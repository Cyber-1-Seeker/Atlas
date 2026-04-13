from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'avatar_color', 'created_at', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Профиль', {'fields': ('avatar_color',)}),
    )
