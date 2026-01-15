from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .trust_models import UserTrustScore, TrustScoreHistory
from .trust_serializers import TrustScoreSerializer, TrustScoreHistorySerializer


class TrustScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing trust scores.
    Users can view their own score and others' public scores.
    """
    serializer_class = TrustScoreSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Return all trust scores"""
        return UserTrustScore.objects.select_related('user').all()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user's trust score"""
        try:
            trust_score = request.user.trust_score
            # Update metrics and recalculate
            trust_score.update_metrics()
            trust_score.calculate_score()
            
            serializer = self.get_serializer(trust_score)
            return Response(serializer.data)
        except UserTrustScore.DoesNotExist:
            # Create if doesn't exist
            trust_score = UserTrustScore.objects.create(user=request.user)
            trust_score.update_metrics()
            trust_score.calculate_score()
            serializer = self.get_serializer(trust_score)
            return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def history(self, request):
        """Get current user's trust score history"""
        history = TrustScoreHistory.objects.filter(user=request.user)[:20]
        serializer = TrustScoreHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def refresh(self, request):
        """Manually refresh trust score"""
        try:
            trust_score = request.user.trust_score
            old_score = trust_score.score
            
            # Update and recalculate
            trust_score.update_metrics()
            new_score = trust_score.calculate_score()
            
            # Log the change
            if abs(new_score - old_score) >= 1:
                TrustScoreHistory.objects.create(
                    user=request.user,
                    score=new_score,
                    trust_level=trust_score.trust_level,
                    reason='Manual refresh'
                )
            
            serializer = self.get_serializer(trust_score)
            return Response(serializer.data)
        except UserTrustScore.DoesNotExist:
            return Response(
                {'error': 'Trust score not found'},
                status=status.HTTP_404_NOT_FOUND
            )
