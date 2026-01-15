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
from .serializers import (
    SendOTPSerializer,
    VerifyOTPSerializer,
    RegisterSerializer,
    UserProfileSerializer
)
from .utils import (
    generate_otp, 
    send_verification_email, 
    send_password_reset_email,
    send_password_reset_success_email,
    is_otp_valid
)

User = get_user_model()


# ============================================================================
# NEW IMPROVED OTP REGISTRATION FLOW
# ============================================================================

@method_decorator(csrf_exempt, name='dispatch')
class SendOTPView(APIView):
    """
    Step 1: Send OTP to Email
    - Only requires email address
    - Validates email is not already registered
    - Generates and sends OTP
    - Creates/updates PendingRegistration record
    - Does NOT require or store password/username yet
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            # Validate email
            serializer = SendOTPSerializer(data=request.data)
            if not serializer.is_valid():
                first_error = next(iter(serializer.errors.values()))[0]
                return Response({'error': first_error}, status=status.HTTP_400_BAD_REQUEST)
            
            email = serializer.validated_data['email']
            
            # Generate OTP
            otp = generate_otp()
            otp_hash = make_password(otp)
            
            # Create or update PendingRegistration (only email and OTP data)
            pending, created = PendingRegistration.objects.update_or_create(
                email=email,
                defaults={
                    'username': '',  # Will be provided during registration
                    'password_hash': '',  # Will be provided during registration
                    'phone_number': '',
                    'location': '',
                    'otp_hash': otp_hash,
                    'otp_created_at': timezone.now(),
                    'otp_attempts': 0,
                    'last_resend_at': None,
                    'is_verified': False,
                    'is_used': False
                }
            )
            
            # Send OTP via email
            email_sent = send_verification_email(email, otp)
            
            if not email_sent:
                return Response(
                    {'error': 'Failed to send email. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                'message': 'OTP sent to your email. Valid for 5 minutes.',
                'email': email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Send OTP Error: {e}")
            return Response(
                {'error': f'Server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class VerifyOTPView(APIView):
    """
    Step 2: Verify OTP
    - Validates OTP against hashed value
    - Checks expiry (5 minutes)
    - Tracks failed attempts (max 3)
    - Marks OTP as verified
    - Does NOT create user account yet
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            # Validate input
            serializer = VerifyOTPSerializer(data=request.data)
            if not serializer.is_valid():
                first_error = next(iter(serializer.errors.values()))[0]
                return Response({'error': first_error}, status=status.HTTP_400_BAD_REQUEST)
            
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            
            # Fetch pending registration
            try:
                pending = PendingRegistration.objects.get(email=email)
            except PendingRegistration.DoesNotExist:
                return Response(
                    {'error': 'No OTP request found for this email. Please request a new OTP.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if already verified
            if pending.is_verified:
                return Response({
                    'message': 'Email already verified. You can now register.',
                    'verified': True
                }, status=status.HTTP_200_OK)
            
            # Check max attempts
            if pending.otp_attempts >= 3:
                pending.delete()
                return Response(
                    {'error': 'Too many failed attempts. Please request a new OTP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check expiry (5 minutes)
            if timezone.now() > pending.otp_created_at + timedelta(minutes=5):
                return Response(
                    {'error': 'OTP has expired. Please request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify OTP
            if not check_password(otp, pending.otp_hash):
                pending.otp_attempts += 1
                pending.save()
                remaining = 3 - pending.otp_attempts
                return Response(
                    {'error': f'Invalid OTP. {remaining} attempt(s) remaining.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark as verified
            pending.is_verified = True
            pending.save()
            
            return Response({
                'message': 'Email verified successfully! You can now complete your registration.',
                'verified': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Verify OTP Error: {e}")
            return Response(
                {'error': 'Verification failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    """
    Step 3: Complete Registration
    - Requires all registration data
    - MUST have verified OTP first
    - Validates all fields
    - Creates user account
    - Marks OTP as used
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            # Validate all registration data
            serializer = RegisterSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            email = data['email']
            
            # CRITICAL: Check if OTP was verified
            try:
                pending = PendingRegistration.objects.get(email=email)
            except PendingRegistration.DoesNotExist:
                return Response(
                    {'error': 'Email not found. Please verify your email first.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if OTP is verified
            if not pending.is_verified:
                return Response(
                    {'error': 'Email not verified. Please verify your email with OTP first.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if OTP already used
            if pending.is_used:
                return Response(
                    {'error': 'This OTP has already been used. Please login or request a new OTP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check OTP expiry (still valid within 10 minutes of creation)
            if timezone.now() > pending.otp_created_at + timedelta(minutes=10):
                pending.delete()
                return Response(
                    {'error': 'OTP session expired. Please start registration again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Double-check user doesn't exist (race condition protection)
            if User.objects.filter(email=email).exists():
                pending.delete()
                return Response(
                    {'error': 'User already exists. Please login.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(username=data['username']).exists():
                return Response(
                    {'error': 'Username already taken.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user account
            user = User.objects.create(
                username=data['username'],
                email=email,
                phone_number=data.get('phone_number', ''),
                location=data.get('location', ''),
                email_verified=True,  # Email is verified via OTP
                is_active=True
            )
            user.set_password(data['password'])
            user.save()
            
            # Mark OTP as used and delete pending registration
            pending.is_used = True
            pending.save()
            # Optionally delete instead: pending.delete()
            
            return Response({
                'message': 'Account created successfully! You can now login.',
                'username': user.username,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Registration Error: {e}")
            return Response(
                {'error': f'Registration failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ResendOTPView(APIView):
    """
    Resend OTP with 60-second cooldown.
    Resets verification status and generates new OTP.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            if not email:
                return Response(
                    {'error': 'Email is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email is already registered
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'Email already registered. Please login.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check pending registration
            try:
                pending = PendingRegistration.objects.get(email=email)
            except PendingRegistration.DoesNotExist:
                return Response(
                    {'error': 'No OTP request found. Please request OTP first.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Cooldown check (60 seconds)
            if pending.last_resend_at:
                cooldown_delta = timezone.now() - pending.last_resend_at
                if cooldown_delta.total_seconds() < 60:
                    wait_seconds = 60 - int(cooldown_delta.total_seconds())
                    return Response({
                        'error': f'Please wait {wait_seconds} seconds before resending.',
                        'wait_seconds': wait_seconds
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Generate new OTP
            otp = generate_otp()
            pending.otp_hash = make_password(otp)
            pending.otp_created_at = timezone.now()
            pending.otp_attempts = 0
            pending.last_resend_at = timezone.now()
            pending.is_verified = False  # Reset verification status
            pending.save()
            
            # Send email
            send_verification_email(email, otp)
            
            return Response({
                'message': 'New OTP sent to your email.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Resend OTP Error: {e}")
            return Response(
                {'error': 'Failed to resend OTP'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# AUTHENTICATION VIEWS
# ============================================================================

@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login View - Returns JWT tokens for authenticated users.
    """
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile view - Get and update user profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# ============================================================================
# PASSWORD RESET VIEWS
# ============================================================================

class RequestPasswordResetView(APIView):
    """Request password reset OTP"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email required'}, status=400)
        
        try:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Security: Silent fail
                return Response({'message': 'If account exists, reset code sent.'})
            
            otp = generate_otp()
            user.reset_otp = otp
            user.reset_otp_created_at = timezone.now()
            user.save()
            
            send_password_reset_email(user, otp)
            
            return Response({'message': 'If account exists, reset code sent.'})
            
        except Exception as e:
            print(f"Password Reset Error: {e}")
            return Response({'error': f'Server Error: {str(e)}'}, status=500)


class VerifyResetOTPView(APIView):
    """Verify password reset OTP"""
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
    """Reset password with verified OTP"""
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
