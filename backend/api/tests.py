from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from .models import Order, OrderItem, Product, Shop
from .serializers import OrderSerializer


class OrderSerializerTests(TestCase):
    def test_create_order_updates_stock_and_total(self):
        user = User.objects.create_user(username='cashier', email='cashier@example.com')
        shop = Shop.objects.create(owner=user, name='Boutique Test')
        product = Product.objects.create(
            shop=shop,
            name='Produit test',
            purchase_price=Decimal('100.00'),
            sale_price=Decimal('150.00'),
            stock=10,
        )

        serializer = OrderSerializer(data={
            'payment_status': 'paid',
            'items': [
                {'product': product.id, 'quantity': 2, 'unit_price': '150.00'}
            ],
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        order = serializer.save(shop=shop, cashier=user)

        product.refresh_from_db()
        self.assertEqual(product.stock, 8)
        self.assertEqual(order.total, Decimal('300.00'))
        self.assertEqual(OrderItem.objects.count(), 1)
        self.assertEqual(Order.objects.count(), 1)
