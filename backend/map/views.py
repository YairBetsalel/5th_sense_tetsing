from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework import status,generics
from django.shortcuts import get_object_or_404
from .utils import find_shortest_path
from .models import Map, Destinations
from .serializers import MapSerializer, DestinationsSerializer
from .permissions import IsSuperAdminOrMapOwner

class MapListCreateView(generics.ListCreateAPIView):
    # List maps or create a map
    serializer_class = MapSerializer

    def get_permissions(self):
        # Any user may see the maps but only authenticated users may create one
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsSuperAdminOrMapOwner()]

    def get_queryset(self):
        queryset = Map.objects.all()
        user = self.request.user
        # Superadmin and users can see all the maps
        if user.is_authenticated and getattr(user, 'user_role', None) == 'superadmin':
            return queryset

        # Admin can only see the maps they created
        if user.is_authenticated:
            return queryset.filter(created_by=user)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class MapDetailView(generics.RetrieveUpdateDestroyAPIView):
    # Edit or delete a map
    queryset = Map.objects.all()
    serializer_class = MapSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrMapOwner]

class MapPathfindingView(APIView):
    # Find the shortest path between two provided coordinates
    permission_classes = [AllowAny]

    def get(self, request, pk):
        map_instance = get_object_or_404(Map, pk=pk)

        try:
            # Store start and end coordinates
            start_x = int(request.query_params.get('start_x'))
            start_y = int(request.query_params.get('start_y'))
            end_x = int(request.query_params.get('end_x'))
            end_y = int(request.query_params.get('end_y'))
        except (TypeError, ValueError):
            # Make sure that coordinates provided are valid integers
            return Response({'error', 'Start and end coordinates provided are invalid'}, status=status.HTTP_400_BAD_REQUEST)

        start_coordinate = [start_x, start_y]
        end_coordinate = [end_x, end_y]

        # Find the shortest path
        result = find_shortest_path(map_instance.grid_data, start_coordinate, end_coordinate)

        # Catch any errors or return the result
        if isinstance(result, dict) and "error" in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'map_id': map_instance.id,
            'start': start_coordinate,
            'end': end_coordinate,
            'path': result,
            'total_steps': len(result) - 1,
        }, status=status.HTTP_200_OK)

class DestinationsListCreateView(generics.ListCreateAPIView):
    # List or create destinations
    serializer_class = DestinationsSerializer

    def get_permissions(self):
        # Any user may see the destinations but only admin may create one
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsSuperAdminOrMapOwner()]

    def get_queryset(self):
        # Search the destinations based on the map id given
        queryset = Destinations.objects.all()
        map_id = self.request.query_params.get('map_id')
        if map_id:
            return queryset.filter(map_id=map_id)

        user = self.request.user
        # Superadmin and users can see all the destinations
        if user.is_authenticated and getattr(user, 'user_role', None) == 'superadmin':
            return queryset

        # Admin can only see the destinations they created
        if user.is_authenticated:
            return queryset.filter(created_by=user)

        return queryset

    # Create destinations
    def perform_create(self, serializer):
        map_id = self.request.data.get('map')
        if map_id:
            map_instance = get_object_or_404(Map, pk=map_id)
            serializer.save(created_by=self.request.user, map=map_instance)
        else:
            serializer.save(created_by=self.request.user)

class DestinationsDetailView(generics.RetrieveUpdateDestroyAPIView):
    # Edit or delete a destination
    queryset = Destinations.objects.all()
    serializer_class = DestinationsSerializer

    def get_permissions(self):
        # Any one may view details but not edit or delete
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsSuperAdminOrMapOwner()]