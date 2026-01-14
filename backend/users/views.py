from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .serializers import UserRegistrationSerializer, UserProfileSerializer
from .utils import (
    generate_otp, 
    send_verification_email, 
    send_password_reset_email,
    send_password_reset_success_email,
    is_otp_valid
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that checks email verification before issuing tokens.
    """
    def post(self, request, *args, **kwargs):
        # Get username/email from request
        username = request.data.get('username')
        
        if username:
            try:
                # Try to find user by username or email
                user = User.objects.filter(username=username).first() or \
                       User.objects.filter(email=username).first()
                
                if user and not user.email_verified:
                    return Response({
                        'error': 'Please verify your email before logging in.',
                        'email': user.email,
                        'requires_verification': True
                    }, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                pass  # Let the parent class handle invalid credentials
        
        # Proceed with normal login if email is verified
        return super().post(request, *args, **kwargs)


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Public endpoint - no authentication required.
    Sends verification email with OTP after registration.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'message': 'Registration successful! Please check your email for verification code.'
        }, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    """
    API endpoint for email verification with OTP.
    Public endpoint - no authentication required.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({
                'error': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid email or OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already verified
        if user.email_verified:
            return Response({
                'message': 'Email already verified'
            }, status=status.HTTP_200_OK)
        
        # Validate OTP
        if not user.email_otp or user.email_otp != otp:
            return Response({
                'error': 'Invalid OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check OTP expiration
        if not is_otp_valid(user.email_otp_created_at):
            return Response({
                'error': 'OTP has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark email as verified and clear OTP
        user.email_verified = True
        user.email_otp = None
        user.email_otp_created_at = None
        user.save()
        
        return Response({
            'message': 'Email verified successfully! You can now login.'
        }, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    """
    API endpoint for resending verification OTP.
    Rate limited to prevent abuse.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists
            return Response({
                'message': 'If the email exists, a new OTP has been sent.'
            }, status=status.HTTP_200_OK)
        
        # Check if already verified
        if user.email_verified:
            return Response({
                'message': 'Email already verified'
            }, status=status.HTTP_200_OK)
        
        # Rate limiting: Allow resend only after 1 minute
        if user.email_otp_created_at:
            time_since_last_otp = timezone.now() - user.email_otp_created_at
            if time_since_last_otp < timedelta(minutes=1):
                remaining_seconds = 60 - int(time_since_last_otp.total_seconds())
                return Response({
                    'error': f'Please wait {remaining_seconds} seconds before requesting a new OTP'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Generate new OTP and send email
        otp = generate_otp()
        user.email_otp = otp
        user.email_otp_created_at = timezone.now()
        user.save()
        
        send_verification_email(user, otp)
        
        return Response({
            'message': 'A new OTP has been sent to your email.'
        }, status=status.HTTP_200_OK)


class RequestPasswordResetView(APIView):
    """
    API endpoint for requesting password reset.
    Sends OTP to user's email.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Rate limiting: Allow reset request only after 1 minute
            if user.reset_otp_created_at:
                time_since_last_otp = timezone.now() - user.reset_otp_created_at
                if time_since_last_otp < timedelta(minutes=1):
                    remaining_seconds = 60 - int(time_since_last_otp.total_seconds())
                    return Response({
                        'error': f'Please wait {remaining_seconds} seconds before requesting another reset'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Generate OTP and send email
            otp = generate_otp()
            user.reset_otp = otp
            user.reset_otp_created_at = timezone.now()
            user.save()
            
            send_password_reset_email(user, otp)
        except User.DoesNotExist:
            pass  # Don't reveal if email exists
        
        # Always return success to prevent email enumeration
        return Response({
            'message': 'If the email exists, password reset instructions have been sent.'
        }, status=status.HTTP_200_OK)


class VerifyResetOTPView(APIView):
    """
    API endpoint for verifying password reset OTP.
    Returns success if OTP is valid.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({
                'error': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid email or OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate OTP
        if not user.reset_otp or user.reset_otp != otp:
            return Response({
                'error': 'Invalid OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check OTP expiration
        if not is_otp_valid(user.reset_otp_created_at):
            return Response({
                'error': 'OTP has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'OTP verified. You can now reset your password.',
            'email': email  # Return email for next step
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    API endpoint for resetting password after OTP verification.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([email, otp, new_password, confirm_password]):
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid request'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate OTP one more time
        if not user.reset_otp or user.reset_otp != otp:
            return Response({
                'error': 'Invalid OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check OTP expiration
        if not is_otp_valid(user.reset_otp_created_at):
            return Response({
                'error': 'OTP has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset password
        user.set_password(new_password)
        user.reset_otp = None
        user.reset_otp_created_at = None
        user.save()
        
        # Send confirmation email
        send_password_reset_success_email(user)
        
        return Response({
            'message': 'Password reset successful! You can now login with your new password.'
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for viewing and updating user profile.
    Requires authentication.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Return the current authenticated user"""
        return self.request.user
