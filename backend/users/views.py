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
from .models import PendingRegistration
from .serializers import UserRegistrationSerializer, UserProfileSerializer
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
    Step 1 of registration: Receive registration data and send OTP.
    User account is NOT created yet - stored in PendingRegistration.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Extract and validate required fields
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        phone_number = request.data.get('phone_number', '').strip()
        location = request.data.get('location', '').strip()
        
        # Validation
        if not all([username, email, password, confirm_password]):
            return Response({
                'error': 'Username, email, password, and password confirmation are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 6:
            return Response({
                'error': 'Password must be at least 6 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username or email already exists in User model
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already taken'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate OTP
        otp = generate_otp()
        otp_hash = make_password(otp)
        
        # Store or update pending registration
        pending, created = PendingRegistration.objects.update_or_create(
            email=email,
            defaults={
                'username': username,
                'password_hash': make_password(password),
                'phone_number': phone_number,
                'location': location,
                'otp_hash': otp_hash,
                'otp_created_at': timezone.now(),
                'otp_attempts': 0,
                'last_resend_at': None,
            }
        )
        
        # Send OTP email
        send_verification_email(email, otp)
        
        return Response({
            'message': 'OTP sent to your email. Valid for 5 minutes.',
            'email': email
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class VerifyOTPView(APIView):
    """
    Step 2 of registration: Verify OTP and create user account.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        
        if not email or not otp:
            return Response({
                'error': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find pending registration
        try:
            pending = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            return Response({
                'error': 'No pending registration found for this email'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check OTP expiry (5 minutes)
        expiry_time = pending.otp_created_at + timedelta(minutes=5)
        if timezone.now() > expiry_time:
            return Response({
                'error': 'OTP has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check maximum attempts (3)
        if pending.otp_attempts >= 3:
            pending.delete()  # Delete after max attempts exceeded
            return Response({
                'error': 'Maximum verification attempts exceeded. Please register again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP hash
        if not check_password(otp, pending.otp_hash):
            pending.otp_attempts += 1
            pending.save()
            remaining_attempts = 3 - pending.otp_attempts
            return Response({
                'error': f'Invalid OTP. {remaining_attempts} attempt(s) remaining.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # OTP verified successfully - create user account
        try:
            user = User.objects.create(
                username=pending.username,
                email=pending.email,
                phone_number=pending.phone_number,
                location=pending.location,
                email_verified=True  # Mark as verified
            )
            user.password = pending.password_hash  # Use pre-hashed password
            user.save()
            
            # Delete pending registration after successful account creation
            pending.delete()
            
            return Response({
                'message': 'Account created successfully! You can now login.',
                'username': user.username,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Failed to create account: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class ResendOTPView(APIView):
    """
    Resend OTP with 60-second cooldown to prevent abuse.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find pending registration
        try:
            pending = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            return Response({
                'error': 'No pending registration found for this email'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check cooldown period (60 seconds)
        if pending.last_resend_at:
            cooldown_end = pending.last_resend_at + timedelta(seconds=60)
            if timezone.now() < cooldown_end:
                remaining_seconds = (cooldown_end - timezone.now()).seconds
                return Response({
                    'error': f'Please wait {remaining_seconds} seconds before requesting a new OTP'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Generate new OTP
        otp = generate_otp()
        pending.otp_hash = make_password(otp)
        pending.otp_created_at = timezone.now()
        pending.otp_attempts = 0  # Reset attempts
        pending.last_resend_at = timezone.now()
        pending.save()
        
        # Send new OTP email
        send_verification_email(email, otp)
        
        return Response({
            'message': 'New OTP sent to your email. Valid for 5 minutes.'
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Simple JWT login - no additional checks needed.
    """
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# Password reset views (existing functionality)
class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If the email exists, a reset code has been sent.'}, status=status.HTTP_200_OK)
        
        otp = generate_otp()
        user.reset_otp = otp
        user.reset_otp_created_at = timezone.now()
        user.save()
        
        send_password_reset_email(user, otp)
        
        return Response({'message': 'Password reset code sent to your email.'}, status=status.HTTP_200_OK)


class VerifyResetOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email or OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.reset_otp or user.reset_otp != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not is_otp_valid(user.reset_otp_created_at):
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'message': 'OTP verified. You can now reset your password.'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        
        if not all([email, otp, new_password]):
            return Response({'error': 'Email, OTP, and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.reset_otp or user.reset_otp != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not is_otp_valid(user.reset_otp_created_at):
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.reset_otp = None
        user.reset_otp_created_at = None
        user.save()
        
        send_password_reset_success_email(user)
        
        return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
