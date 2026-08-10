from rest_framework import serializers
from .models import Map, Destinations

class MapSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = Map
        fields = '__all__'

class DestinationsSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = Destinations
        fields = '__all__'