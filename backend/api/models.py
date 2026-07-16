from django.db import models
from django.contrib.auth.models import User


class Shop(models.Model):
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shop')
    name = models.CharField(max_length=200)
    subscription_expires = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    ROLE_CHOICES = [('admin', 'Administrateur'), ('cashier', 'Caissier')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='cashier')
    firebase_uid = models.CharField(max_length=128, unique=True, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    barcode = models.CharField(max_length=100, blank=True, null=True, unique=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_low_stock(self):
        return self.stock <= self.low_stock_threshold

    def __str__(self):
        return self.name


class Customer(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='customers')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    PAYMENT_STATUS = [
        ('paid', 'Payé'),
        ('pending', 'En attente'),
        ('partial', 'Partiel'),
    ]

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='orders')
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default='paid')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commande #{self.pk} — {self.shop.name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.quantity * self.unit_price


class Expense(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='expenses')
    label = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label} — {self.amount}"


class CashSession(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='sessions')
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    expected_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    declared_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
