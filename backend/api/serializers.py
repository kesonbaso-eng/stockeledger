from rest_framework import serializers
from .models import Product, Order, OrderItem, Expense, Customer, CashSession, UserProfile


class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'barcode', 'purchase_price', 'sale_price', 'stock', 'low_stock_threshold', 'is_low_stock']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone']


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'cashier', 'customer', 'total', 'payment_status', 'created_at', 'items']
        read_only_fields = ['total', 'cashier', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'label', 'amount', 'created_at']
        read_only_fields = ['created_at']


class CashSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashSession
        fields = ['id', 'cashier', 'opened_at', 'closed_at', 'expected_amount', 'declared_amount']
        read_only_fields = ['cashier', 'opened_at', 'expected_amount']


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'role']
