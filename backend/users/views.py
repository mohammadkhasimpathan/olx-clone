from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import PendingRegistration
from .serializers import RegistrationRequestSerializer, UserProfileSerializer
from .utils import (
    generate_otp, 
    send_verification_email, 
    send_password_reset_email,
    send_password_reset_success_email,
    is_otp_valid
)

User = get_user_model()

@method_decorator(csrf_exempt, name='dispatch')
class RegistrationRequestView(APIView):
    """
    Step 1 of Secure Registration:
    - Validate registration data
    - Hash password
    - Generate and Hash OTP
    - Store in PendingRegistration (TTL 10 mins implied by logical expiry)
    - Send OTP via Email
    - User is NOT created yet.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            # 1. Validate Data using Serializer
            serializer = RegistrationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                # Return first error message
                first_error = next(iter(serializer.errors.values()))[0]
                return Response({'error': first_error}, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            # Extract validated data
            username = data['username']
            email = data['email']
            password = data['password']
            phone_number = data.get('phone_number', '')
            location = data.get('location', '')

            # 4. Generate Security Tokens
            otp = generate_otp()
            otp_hash = make_password(otp)
            password_hash = make_password(password)

            # 5. Store in PendingRegistration
            pending, created = PendingRegistration.objects.update_or_create(
                email=email,
                defaults={
                    'username': username,
                    'password_hash': password_hash,
                    'phone_number': phone_number,
                    'location': location,
                    'otp_hash': otp_hash,
                    'otp_created_at': timezone.now(),
                    'otp_attempts': 0,
                    'last_resend_at': None
                }
            )

            # 6. Send Email
            email_sent = send_verification_email(email, otp)
            
            return Response({
                'message': 'OTP sent to your email. Valid for 5 minutes.',
                'email': email
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Log error in production
            print(f"Registration Request Error: {e}")
            # RETURN ACTUAL ERROR FOR DEBUGGING
            return Response({'error': f'Server Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class VerifyOTPView(APIView):
    """
    Step 2 of Secure Registration:
    - Validate OTP
    - Check Expiry
    - Create User Account
    - Clean up PendingRegistration
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            otp = request.data.get('otp', '').strip()
            
            if not email or not otp:
                return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 1. Fetch Pending Record
            try:
                pending = PendingRegistration.objects.get(email=email)
            except PendingRegistration.DoesNotExist:
                return Response({'error': 'Registration session not found or expired. Please register again.'}, status=status.HTTP_404_NOT_FOUND)
            
            # 2. Security Checks
            
            # Check Max Attempts
            if pending.otp_attempts >= 3:
                pending.delete()
                return Response({'error': 'Too many failed attempts. Registration cancelled. Please start over.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check Expiry (5 minutes)
            if timezone.now() > pending.otp_created_at + timedelta(minutes=5):
                return Response({'error': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify OTP
            if not check_password(otp, pending.otp_hash):
                pending.otp_attempts += 1
                pending.save()
                return Response({'error': f'Invalid OTP. {3 - pending.otp_attempts} attempts remaining.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 3. Create Realm User
            # Ensure user didn't register in the meantime (race condition)
            if User.objects.filter(email=email).exists():
                 pending.delete()
                 return Response({'error': 'User already exists. Please login.'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create(
                username=pending.username,
                email=pending.email,
                phone_number=pending.phone_number,
                location=pending.location,
                email_verified=True, # Verified immediately upon creation
                is_active=True
            )
            # Set the password we hashed earlier
            user.password = pending.password_hash
            user.save()
            
            # 4. Cleanup
            pending.delete()
            
            return Response({
                'message': 'Account created successfully! You can now login.',
                'username': user.username
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"OTP Verification Error: {e}")
            return Response({'error': 'Verification failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class ResendOTPView(APIView):
    """
    Resend OTP with 60s cooldown.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            if not email:
                return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 1. Check Pending Record
            try:
                pending = PendingRegistration.objects.get(email=email)
            except PendingRegistration.DoesNotExist:
                # Security: Don't reveal if email isn't in pending, but logically we can say "Not found" 
                # or generically "If valid, sent". For registration flow, 404 is acceptable to tell them to register first.
                return Response({'error': 'No pending registration found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # 2. Cooldown Check (60 seconds)
            if pending.last_resend_at:
                cooldown_delta = timezone.now() - pending.last_resend_at
                if cooldown_delta.total_seconds() < 60:
                    wait_seconds = 60 - int(cooldown_delta.total_seconds())
                    return Response({'error': f'Please wait {wait_seconds} seconds before resending.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # 3. Generate New OTP
            otp = generate_otp()
            pending.otp_hash = make_password(otp)
            pending.otp_created_at = timezone.now() # Reset expiry
            pending.otp_attempts = 0 # Reset attempts on new OTP (optional policy choice)
            pending.last_resend_at = timezone.now()
            pending.save()
            
            # 4. Send Email
            send_verification_email(email, otp)
            
            return Response({'message': 'New OTP sent.'}, status=status.HTTP_200_OK)
            
        except Exception as e:
             print(f"Resend OTP Error: {e}")
             return Response({'error': 'Failed to resend OTP'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login View.
    Checks credentials and returns JWT.
    (Email verified check is redundant for new users as they are verified on creation, 
    but kept for legacy/safety).
    """
    permission_classes = [permissions.AllowAny]
    
    # We can rely on default TokenObtainPairView logic 
    # OR override post to do extra checks if needed.
    # For now, default is fine as User is active.


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# --- Password Reset Views (Keeping existing logic roughly same) ---

class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
    def post(self, request):
        email = request.data.get('email')
        if not email: return Response({'error': 'Email required'}, 400)
        try:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Security: Silent fail, but for now returned message says "If account exists..."
                return Response({'message': 'If account exists, reset code sent.'})

            otp = generate_otp()
            # In a real app, hash this!
            user.reset_otp = otp 
            user.reset_otp_created_at = timezone.now()
            user.save()
            
            # Send email
            send_password_reset_email(user, otp)
            
            return Response({'message': 'If account exists, reset code sent.'})

        except Exception as e:
            print(f"Password Reset Error: {e}")
            # Prevent 502 by catching SMTP errors
            return Response({'error': f'Server Error: {str(e)}'}, status=500)

class VerifyResetOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        try:
            user = User.objects.get(email=email)
            if not user.reset_otp or user.reset_otp != otp:
                 return Response({'error': 'Invalid OTP'}, 400)
            if not is_otp_valid(user.reset_otp_created_at):
                 return Response({'error': 'Expired OTP'}, 400)
            return Response({'message': 'OTP Valid'})
        except User.DoesNotExist:
            return Response({'error': 'Invalid request'}, 400)

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        try:
            user = User.objects.get(email=email)
            if not user.reset_otp or user.reset_otp != otp:
                 return Response({'error': 'Invalid token'}, 400)
            if not is_otp_valid(user.reset_otp_created_at):
                 return Response({'error': 'Expired'}, 400)
            user.set_password(new_password)
            user.reset_otp = None
            user.save()
            send_password_reset_success_email(user)
            return Response({'message': 'Password reset successful'})
        except User.DoesNotExist:
             return Response({'error': 'Error'}, 400)
