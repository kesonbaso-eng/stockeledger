import firebase_admin
from firebase_admin import auth, credentials
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from django.conf import settings
from .models import UserProfile, Shop
import os

if not firebase_admin._apps:
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)


class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return None

        token = header.split(' ')[1]
        try:
            decoded = auth.verify_id_token(token)
        except Exception:
            raise AuthenticationFailed('Token Firebase invalide.')

        uid = decoded['uid']
        email = decoded.get('email', '')

        try:
            profile = UserProfile.objects.select_related('user').get(firebase_uid=uid)
            return (profile.user, decoded)
        except UserProfile.DoesNotExist:
            pass

        user, _ = User.objects.get_or_create(username=uid, defaults={'email': email})
        return (user, decoded)
