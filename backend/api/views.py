import csv
from datetime import datetime
from django.http import HttpResponse
from django.db.models import Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
import firebase_admin
from firebase_admin import auth as firebase_auth

from .models import Product, Order, Expense, Customer, CashSession, UserProfile, Shop
from .serializers import (
    ProductSerializer, OrderSerializer, ExpenseSerializer,
    CustomerSerializer, CashSessionSerializer, UserProfileSerializer
)
from .permissions import IsAdmin, IsAdminOrCashier


def get_shop(user):
    try:
        profile = user.profile
    except Exception:
        profile = None

    if profile and profile.shop_id:
        return profile.shop

    shop = Shop.objects.filter(owner=user).first()
    if shop is None:
        shop = Shop.objects.create(owner=user, name=f"Boutique de {user.first_name or user.username}")

    if profile is None:
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'shop': shop, 'role': 'cashier', 'firebase_uid': user.username},
        )
    elif not profile.shop_id:
        profile.shop = shop
        profile.save(update_fields=['shop'])

    return shop


# --- AUTH ---

@api_view(['POST'])
@permission_classes([AllowAny])
def firebase_login(request):
    token = request.data.get('token')
    if not token:
        return Response({'error': 'Token manquant.'}, status=400)

    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        return Response({'error': 'Token invalide.'}, status=401)

    uid = decoded['uid']
    email = decoded.get('email', '')
    name = decoded.get('name', email.split('@')[0])

    try:
        profile = UserProfile.objects.select_related('user', 'shop').get(firebase_uid=uid)
        return Response({'role': profile.role, 'shop': profile.shop.name})
    except UserProfile.DoesNotExist:
        user = User.objects.create_user(username=uid, email=email, first_name=name)
        shop = Shop.objects.create(owner=user, name=f"Boutique de {name}")
        UserProfile.objects.create(user=user, shop=shop, role='admin', firebase_uid=uid)
        return Response({'role': 'admin', 'shop': shop.name}, status=201)


@api_view(['GET'])
def me(request):
    shop = get_shop(request.user)
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'shop': shop, 'role': 'cashier', 'firebase_uid': request.user.username},
    )
    if profile.shop_id != shop.id:
        profile.shop = shop
        profile.save(update_fields=['shop'])
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)


# --- PRODUITS ---

class ProductListCreate(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrCashier()]

    def get_queryset(self):
        return Product.objects.filter(shop=get_shop(self.request.user))

    def perform_create(self, serializer):
        serializer.save(shop=get_shop(self.request.user))


class ProductDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Product.objects.filter(shop=get_shop(self.request.user))


# --- COMMANDES ---

class OrderListCreate(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminOrCashier]

    def get_queryset(self):
        return Order.objects.filter(shop=get_shop(self.request.user)).prefetch_related('items')

    def perform_create(self, serializer):
        serializer.save(shop=get_shop(self.request.user), cashier=self.request.user)


# --- DÉPENSES ---

class ExpenseListCreate(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Expense.objects.filter(shop=get_shop(self.request.user))

    def perform_create(self, serializer):
        serializer.save(shop=get_shop(self.request.user))


# --- CLIENTS ---

class CustomerListCreate(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminOrCashier]

    def get_queryset(self):
        return Customer.objects.filter(shop=get_shop(self.request.user))

    def perform_create(self, serializer):
        serializer.save(shop=get_shop(self.request.user))


# --- DASHBOARD P&L ---

@api_view(['GET'])
@permission_classes([IsAdmin])
def dashboard(request):
    shop = get_shop(request.user)
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    revenue = Order.objects.filter(
        shop=shop, created_at__gte=month_start, payment_status='paid'
    ).aggregate(total=Sum('total'))['total'] or 0

    expenses = Expense.objects.filter(
        shop=shop, created_at__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0

    low_stock = Product.objects.filter(shop=shop, stock__lte=5)

    return Response({
        'month': now.strftime('%B %Y'),
        'revenue': revenue,
        'expenses': expenses,
        'profit': revenue - expenses,
        'low_stock_products': ProductSerializer(low_stock, many=True).data,
    })


# --- EXPORT CSV ---

@api_view(['GET'])
@permission_classes([IsAdmin])
def export_sales_csv(request):
    shop = get_shop(request.user)
    orders = Order.objects.filter(shop=shop).prefetch_related('items__product')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="ventes_{datetime.now().strftime("%Y%m")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Produit', 'Quantité', 'Prix unitaire', 'Sous-total', 'Statut'])

    for order in orders:
        for item in order.items.all():
            writer.writerow([
                order.created_at.strftime('%d/%m/%Y %H:%M'),
                item.product.name,
                item.quantity,
                item.unit_price,
                item.subtotal,
                order.payment_status,
            ])

    return response


# --- SESSION DE CAISSE ---

class CashSessionListCreate(generics.ListCreateAPIView):
    serializer_class = CashSessionSerializer
    permission_classes = [IsAdminOrCashier]

    def get_queryset(self):
        return CashSession.objects.filter(shop=get_shop(self.request.user))

    def perform_create(self, serializer):
        serializer.save(shop=get_shop(self.request.user), cashier=self.request.user)
