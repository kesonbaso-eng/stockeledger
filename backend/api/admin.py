from django.contrib import admin
from .models import Shop, UserProfile, Product, Customer, Order, OrderItem, Expense, CashSession


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = [OrderItemInline]
    list_display = ['id', 'shop', 'cashier', 'total', 'payment_status', 'created_at']
    list_filter = ['payment_status', 'shop']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'shop', 'sale_price', 'stock', 'is_low_stock']
    list_filter = ['shop']
    search_fields = ['name', 'barcode']


admin.site.register(Shop)
admin.site.register(UserProfile)
admin.site.register(Customer)
admin.site.register(Expense)
admin.site.register(CashSession)
