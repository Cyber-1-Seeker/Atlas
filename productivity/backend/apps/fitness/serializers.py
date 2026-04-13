from rest_framework import serializers
from .models import (
    MuscleGroup, Exercise, ExerciseMuscle,
    TrainingProgram, TrainingDay, DaySection, DayExercise,
    WorkoutSession, SessionSet,
)

class MuscleGroupSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    class Meta:
        model  = MuscleGroup
        fields = ('id','key','name','name_en','body_region','emoji','image_url',
                  'description','functions','daily_life','benefits','posture_role','order')

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

class MuscleGroupWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MuscleGroup
        fields = ('key','name','name_en','body_region','emoji','image',
                  'description','functions','daily_life','benefits','posture_role','order')

class ExerciseMuscleSerializer(serializers.ModelSerializer):
    muscle    = MuscleGroupSerializer(read_only=True)
    muscle_id = serializers.PrimaryKeyRelatedField(
        queryset=MuscleGroup.objects.all(), source='muscle', write_only=True)
    class Meta:
        model  = ExerciseMuscle
        fields = ('id','muscle','muscle_id','intensity')

class ExerciseListSerializer(serializers.ModelSerializer):
    primary_muscle = serializers.SerializerMethodField()
    image_url      = serializers.SerializerMethodField()

    class Meta:
        model  = Exercise
        fields = ('id','name','slug','category','equipment','emoji',
                  'description','image_url','video_url','primary_muscle','is_published')

    def get_primary_muscle(self, obj):
        m = obj.muscles.order_by('-intensity').first()
        return ExerciseMuscleSerializer(m).data if m else None

    def get_image_url(self, obj):
        if obj.image:
            r = self.context.get('request')
            return r.build_absolute_uri(obj.image.url) if r else obj.image.url
        return None

class ExerciseDetailSerializer(serializers.ModelSerializer):
    muscles   = ExerciseMuscleSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    gif_url   = serializers.SerializerMethodField()

    class Meta:
        model  = Exercise
        fields = ('id','name','slug','category','equipment','emoji',
                  'description','how_to','benefits','tips','common_mistakes',
                  'image_url','gif_url','video_url','extra_links',
                  'muscles','is_published','created_at')

    def get_image_url(self, obj):
        if obj.image:
            r = self.context.get('request')
            return r.build_absolute_uri(obj.image.url) if r else obj.image.url
        return None

    def get_gif_url(self, obj):
        if obj.gif:
            r = self.context.get('request')
            return r.build_absolute_uri(obj.gif.url) if r else obj.gif.url
        return None

class ExerciseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Exercise
        fields = ('name','slug','category','equipment','emoji',
                  'description','how_to','benefits','tips','common_mistakes',
                  'image','gif','video_url','extra_links','is_published')

class DayExerciseSerializer(serializers.ModelSerializer):
    exercise    = ExerciseListSerializer(read_only=True)
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(), source='exercise', write_only=True)
    class Meta:
        model  = DayExercise
        fields = ('id','exercise','exercise_id','order','sets_count','reps_hint','notes')

class DaySectionSerializer(serializers.ModelSerializer):
    exercises = DayExerciseSerializer(many=True, read_only=True)
    class Meta:
        model  = DaySection
        fields = ('id','title','order','exercises')

class TrainingDaySerializer(serializers.ModelSerializer):
    sections   = DaySectionSerializer(many=True, read_only=True)
    program_id = serializers.PrimaryKeyRelatedField(
        queryset=TrainingProgram.objects.all(), source='program', write_only=True)
    class Meta:
        model  = TrainingDay
        fields = ('id','program_id','name','week_index','day_index','order','rest_day','sections')

class TrainingProgramSerializer(serializers.ModelSerializer):
    days             = TrainingDaySerializer(many=True, read_only=True)
    muscle_coverage  = serializers.SerializerMethodField()
    uncovered_muscles= serializers.SerializerMethodField()

    class Meta:
        model  = TrainingProgram
        fields = ('id','name','description','weeks_count','is_active',
                  'created_at','days','muscle_coverage','uncovered_muscles')
        read_only_fields = ('id','created_at')

    def _get_covered_keys(self, obj):
        covered = {}
        for day in obj.days.all():
            for sec in day.sections.all():
                for de in sec.exercises.all():
                    for em in de.exercise.muscles.all():
                        k = em.muscle.key
                        covered[k] = covered.get(k,0) + em.intensity * de.sets_count
        return covered

    def get_muscle_coverage(self, obj):
        covered = self._get_covered_keys(obj)
        if not covered: return []
        muscles = {m.key: m for m in MuscleGroup.objects.filter(key__in=covered.keys())}
        max_s   = max(covered.values())
        result  = []
        for key, score in sorted(covered.items(), key=lambda x:-x[1]):
            pct   = score / max_s * 100
            level = 'high' if pct>=70 else 'medium' if pct>=35 else 'low'
            m     = muscles.get(key)
            if m:
                result.append({'muscle': MuscleGroupSerializer(m).data, 'score': score, 'level': level})
        return result

    def get_uncovered_muscles(self, obj):
        covered_keys = set(self._get_covered_keys(obj).keys())
        uncovered    = MuscleGroup.objects.exclude(key__in=covered_keys)
        return MuscleGroupSerializer(uncovered, many=True).data

class TrainingProgramListSerializer(serializers.ModelSerializer):
    days_count = serializers.SerializerMethodField()
    class Meta:
        model  = TrainingProgram
        fields = ('id','name','description','weeks_count','is_active','created_at','days_count')
        read_only_fields = ('id','created_at')

    def get_days_count(self, obj):
        return obj.days.count()

class SessionSetSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SessionSet
        fields = ('id','day_exercise','set_number','weight','reps','orm','recorded_at')
        read_only_fields = ('id','recorded_at')

class WorkoutSessionSerializer(serializers.ModelSerializer):
    sets = SessionSetSerializer(many=True, read_only=True)
    class Meta:
        model  = WorkoutSession
        fields = ('id','day','date','started','ended','notes','sets')
        read_only_fields = ('id','started')
