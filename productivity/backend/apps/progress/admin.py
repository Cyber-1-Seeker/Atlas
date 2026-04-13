from django.contrib import admin
from .models import ProgressCategory, ProgressTracker, ProgressRecord, StrengthRecord

admin.site.register(ProgressCategory)
admin.site.register(ProgressTracker)
admin.site.register(ProgressRecord)
admin.site.register(StrengthRecord)
