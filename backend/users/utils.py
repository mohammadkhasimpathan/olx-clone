"""
Email and OTP utility functions for user authentication.
"""
import random
import string
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


def generate_otp(length=6):
    """
    Generate a random numeric OTP.
    
    Args:
        length (int): Length of OTP (default: 6)
    
    Returns:
        str: Random numeric OTP
    """
    return ''.join(random.choices(string.digits, k=length))


def is_otp_valid(created_at, timeout_minutes=5):
    """
    Check if OTP is still valid based on creation time.
    
    Args:
        created_at (datetime): When the OTP was created
        timeout_minutes (int): OTP validity period in minutes (default: 5)
    
    Returns:
        bool: True if OTP is still valid, False otherwise
    """
    if not created_at:
        return False
    
    expiration_time = created_at + timedelta(minutes=timeout_minutes)
    return timezone.now() < expiration_time



def send_verification_email(user_or_email, otp):
    """
    Send email verification OTP to user.
    
    Args:
        user_or_email: User instance OR email string
        otp (str): OTP code to send
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    # Handle both User object and email string
    if isinstance(user_or_email, str):
        email = user_or_email
        username = email.split('@')[0]  # Use email prefix as fallback
    else:
        email = user_or_email.email
        username = user_or_email.username
    
    subject = 'Verify Your Email - OLX Clone'
    message = f"""
Hello {username},

Thank you for registering with OLX Clone!

Your email verification code is: {otp}

This code will expire in 5 minutes.

If you didn't create an account, please ignore this email.

Best regards,
OLX Clone Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False



def send_password_reset_email(user, otp):
    """
    Send password reset OTP to user.
    
    Args:
        user: User instance
        otp (str): OTP code to send
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = 'Password Reset Request - OLX Clone'
    message = f"""
Hello {user.username},

We received a request to reset your password.

Your password reset code is: {otp}

This code will expire in 5 minutes.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
OLX Clone Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


def send_password_reset_success_email(user):
    """
    Send confirmation email after successful password reset.
    
    Args:
        user: User instance
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = 'Password Reset Successful - OLX Clone'
    message = f"""
Hello {user.username},

Your password has been successfully reset.

If you didn't make this change, please contact our support team immediately.

Best regards,
OLX Clone Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending password reset success email: {e}")
        return False
