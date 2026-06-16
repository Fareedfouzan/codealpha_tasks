from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from cart.models import CartItem
from products.models import Product

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        cart_items = CartItem.objects.filter(user=request.user)
        
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=request.user,
            **serializer.validated_data
        )

        total_amount = 0
        for cart_item in cart_items:
            product = cart_item.product
            if product.stock < cart_item.quantity:
                order.delete()
                return Response(
                    {'error': f'Insufficient stock for {product.name}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=cart_item.quantity,
                price=product.price
            )
            
            product.stock -= cart_item.quantity
            product.save()
            total_amount += product.price * cart_item.quantity

        order.total_amount = total_amount
        order.save()
        
        cart_items.delete()
        
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status and new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
