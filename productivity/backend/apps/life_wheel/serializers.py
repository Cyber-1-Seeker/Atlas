from rest_framework import serializers
from .models import WheelSegment, WheelTask

class WheelTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WheelTask
        fields = ('id','text','done')
        read_only_fields = ('id',)

class WheelSegmentSerializer(serializers.ModelSerializer):
    tasks = WheelTaskSerializer(many=True, read_only=True)

    class Meta:
        model  = WheelSegment
        fields = ('id','name','score','color','order','tasks')
        read_only_fields = ('id',)
