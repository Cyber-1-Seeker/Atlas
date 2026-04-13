from rest_framework import serializers
from .models import ProgressCategory, ProgressTracker, ProgressRecord, StrengthRecord

class ProgressRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProgressRecord
        fields = ('id','value','note','date')
        read_only_fields = ('id',)

class StrengthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StrengthRecord
        fields = ('id','weight','reps','orm','note','date')
        read_only_fields = ('id',)

class ProgressTrackerSerializer(serializers.ModelSerializer):
    records          = ProgressRecordSerializer(many=True, read_only=True)
    strength_records = StrengthRecordSerializer(many=True, read_only=True)

    class Meta:
        model  = ProgressTracker
        fields = ('id','category','name','kind','unit','color','order','records','strength_records')
        read_only_fields = ('id',)

class ProgressCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProgressCategory
        fields = ('id','name','color')
        read_only_fields = ('id',)
