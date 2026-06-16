from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category', 'category_id', 'stock', 'image', 'image_url', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        product = Product.objects.create(**validated_data)
        if category_id:
            product.category_id = category_id
            product.save()
        return product
