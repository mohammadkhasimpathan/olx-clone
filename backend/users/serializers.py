from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .utils import generate_otp, send_verification_email

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Validates password, creates user with hashed password, and sends verification email.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password2', 
                  'first_name', 'last_name', 'phone_number', 'location']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password and send verification email"""
        validated_data.pop('password2')
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Generate OTP and send verification email
        otp = generate_otp()
        user.email_otp = otp
        user.email_otp_created_at = timezone.now()
        user.save()
        
        # Send verification email
        send_verification_email(user, otp)
        
        return user


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
