from django.contrib import admin
from .models import Map, Destinations

# Tables to be displayed in the Django admin panel

@admin.register(Destinations)

@admin.register(Map)
# Permission restrictions for security
class MapAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    readonly_fields = ('created_by',)

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.user_role == 'superadmin':
            return qs
        return qs.filter(created_by=request.user)

    def has_change_permission(self, request, obj=None):
        if not obj:
            return True
        if request.user.user_role == 'superadmin':
            return True
        return obj.created_by == request.user

    def has_delete_permission(self, request, obj=None):
        if not obj:
            return True
        if request.user.user_role == 'superadmin':
            return True
        return obj.created_by == request.user