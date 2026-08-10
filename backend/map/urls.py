from django.urls import path
from .views import MapListCreateView, MapDetailView, MapPathfindingView, DestinationsListCreateView, \
    DestinationsDetailView

urlpatterns = [
    path('api/maps/', MapListCreateView.as_view(), name='map-list-create'),
    path('api/maps/<int:pk>/', MapDetailView.as_view(), name='map-detail'),
    path('api/maps/<int:pk>/path/', MapPathfindingView.as_view(), name='map-pathfinding'),
    path('api/destinations/', DestinationsListCreateView.as_view(), name='destination-list-create'),
    path('api/destinations/<int:pk>/', DestinationsDetailView.as_view(), name='destination-detail'),


]