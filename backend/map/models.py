from django.db import models
from django.conf import settings



# Map table
class Map(models.Model):
    # Name of the map, named by an admin user
    name = models.CharField(max_length=255)
    # JSON data storing the map grid
    grid_data = models.JSONField(default=dict, blank=False)

    # cell size in metres
    cell_size = models.FloatField(default=1.0, blank=False)

    # Dimensions of the grid
    length = models.FloatField(blank=False)
    width = models.FloatField(blank=False)


    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='maps')
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.name

class Destinations(models.Model):
    name = models.CharField(max_length=255)
    coordinates = models.JSONField(default=dict, blank=False)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='maps')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
