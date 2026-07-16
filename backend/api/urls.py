from django.urls import path
from . import views

urlpatterns = [
    path('auth/firebase/', views.firebase_login),
    path('auth/me/', views.me),

    path('products/', views.ProductListCreate.as_view()),
    path('products/<int:pk>/', views.ProductDetail.as_view()),

    path('orders/', views.OrderListCreate.as_view()),

    path('expenses/', views.ExpenseListCreate.as_view()),

    path('customers/', views.CustomerListCreate.as_view()),

    path('dashboard/', views.dashboard),
    path('export/sales/', views.export_sales_csv),

    path('sessions/', views.CashSessionListCreate.as_view()),
]
