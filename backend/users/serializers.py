from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user details in the response
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom user data to the response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'email_verified': self.user.email_verified,
            'phone_number': self.user.phone_number,
            'location': self.user.location,
        }
        
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'location', 'email_verified', 'date_joined'            'is_online', 'last_seen'
        ]
        read_only_fields = ['id', 'email_verified', 'date_joined'            'is_online', 'last_seen'
        ]


class SendOTPSerializer(serializers.Serializer):
    """Serializer for sending OTP"""
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration"""
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates"""
    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number', 'location'            'is_online', 'last_seen'
        ]
        read_only_fields = ['username', 'email'            'is_online', 'last_seen'
        ]
