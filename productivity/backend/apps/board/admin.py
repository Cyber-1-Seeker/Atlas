from django.contrib import admin
from .models import Board, BoardSnapshot

@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'updated_at')

admin.site.register(BoardSnapshot)
