from django.contrib import admin
from .models import User, UserProgress, UserTaskProgress
admin.site.register(User)
admin.site.register(UserProgress)
admin.site.register(UserTaskProgress)
