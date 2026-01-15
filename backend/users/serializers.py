from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .utils import generate_otp, send_verification_email

User = get_user_model()


class SendOTPSerializer(serializers.Serializer):
    """
    Serializer for sending OTP to email.
    Only validates email - no other registration data needed at this step.
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Check if email is already registered"""
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered. Please login.")
        return value


class VerifyOTPSerializer(serializers.Serializer):
    """
    Serializer for verifying OTP.
    Only verifies the OTP, does NOT create user account.
    """
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, max_length=6, min_length=6)

    def validate_otp(self, value):
        """Ensure OTP is 6 digits"""
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be 6 digits.")
        return value.strip()

    def validate_email(self, value):
        """Normalize email"""
        return value.strip().lower()


class RegisterSerializer(serializers.Serializer):
    """
    Serializer for final registration step.
    Validates all user data and ensures OTP was verified.
    """
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True, min_length=3, max_length=150)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=15)
    location = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def validate_email(self, value):
        """Check if email is already registered"""
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_username(self, value):
        """Check if username is already taken"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate(self, attrs):
        """Validate password match"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs



class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing and updating user profile.
    Read-only username, allows updating other fields.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'phone_number', 'location', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for displaying user info in listings.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'phone_number', 'location']
