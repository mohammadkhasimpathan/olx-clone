from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView, 
    UserProfileView,
    CustomTokenObtainPairView,
    VerifyEmailView,
    ResendOTPView,
    RequestPasswordResetView,
    VerifyResetOTPView,
    ResetPasswordView
)

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Email verification endpoints
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    
    # Password reset endpoints
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('verify-reset-otp/', VerifyResetOTPView.as_view(), name='verify_reset_otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    
    # Profile endpoints
    path('profile/', UserProfileView.as_view(), name='profile'),
]
