from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SendOTPView,
    VerifyOTPView,
    RegisterView,
    ResendOTPView,
    UserProfileView,
    CustomTokenObtainPairView,
    RequestPasswordResetView,
    VerifyResetOTPView,
    ResetPasswordView
)

app_name = 'users'

urlpatterns = [
    # New Registration Flow
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('register/', RegisterView.as_view(), name='register'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    
    # Authentication
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password reset endpoints
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('verify-reset-otp/', VerifyResetOTPView.as_view(), name='verify_reset_otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    
    # Profile endpoints
    path('profile/', UserProfileView.as_view(), name='profile'),
]
