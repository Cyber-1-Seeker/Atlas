from rest_framework import serializers
from .models import Direction, Branch, Checkpoint, Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'


class CheckpointSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    prerequisites = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Checkpoint.objects.all(), required=False
    )
    prerequisites_ids = serializers.SerializerMethodField()

    class Meta:
        model = Checkpoint
        fields = '__all__'

    def get_prerequisites_ids(self, obj):
        return [str(p.id) for p in obj.prerequisites.all()]


class BranchSerializer(serializers.ModelSerializer):
    checkpoints = CheckpointSerializer(many=True, read_only=True)

    class Meta:
        model = Branch
        fields = '__all__'


class DirectionSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)

    class Meta:
        model = Direction
        fields = '__all__'


class DirectionListSerializer(serializers.ModelSerializer):
    branch_count = serializers.SerializerMethodField()
    class Meta:
        model = Direction
        fields = ['id','name','slug','icon_type','description','color_hex','is_active','order','branch_count']
    def get_branch_count(self, obj): return obj.branches.count()


# ── Import serializers ─────────────────────────────────────────────────────

class TaskImportSerializer(serializers.Serializer):
    title = serializers.CharField()
    content_md = serializers.CharField(required=False, default='')
    xp_reward = serializers.IntegerField(required=False, default=100)
    difficulty_rating = serializers.IntegerField(required=False, default=1)
    order = serializers.IntegerField(required=False, default=0)
    hardcore_xp_multiplier = serializers.FloatField(required=False, default=2.0)
    hardcore_description = serializers.CharField(required=False, default='')


class CheckpointImportSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False, default='')
    icon_type = serializers.CharField(required=False, default='star')
    xp_reward = serializers.IntegerField(required=False, default=500)
    order = serializers.IntegerField(required=False, default=0)
    pos_x = serializers.IntegerField(required=False, default=200)
    pos_y = serializers.IntegerField(required=False, default=400)
    achievement_name = serializers.CharField(required=False, default='')
    achievement_description = serializers.CharField(required=False, default='')
    achievement_icon = serializers.CharField(required=False, default='🏆')
    tasks = TaskImportSerializer(many=True, required=False, default=[])
    # list of order-indices of prerequisite checkpoints
    prerequisite_orders = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=[]
    )


class BranchImportSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False, default='')
    color_hex = serializers.CharField(required=False, default='#e8003d')
    order = serializers.IntegerField(required=False, default=0)
    is_hardcore = serializers.BooleanField(required=False, default=False)
    checkpoints = CheckpointImportSerializer(many=True, required=False, default=[])


class DirectionImportSerializer(serializers.Serializer):
    name = serializers.CharField()
    slug = serializers.SlugField()
    icon_type = serializers.CharField(required=False, default='star')
    description = serializers.CharField(required=False, default='')
    color_hex = serializers.CharField(required=False, default='#7c3aed')
    branches = BranchImportSerializer(many=True, required=False, default=[])
