from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import OrderItem, Order


@receiver(post_save, sender=OrderItem)
def deduct_stock(sender, instance, created, **kwargs):
    if created:
        product = instance.product
        product.stock -= instance.quantity
        product.save(update_fields=['stock'])

        order = instance.order
        order.total = sum(item.subtotal for item in order.items.all())
        order.save(update_fields=['total'])
