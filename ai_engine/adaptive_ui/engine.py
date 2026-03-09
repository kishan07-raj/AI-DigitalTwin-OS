"""
Adaptive UI Engine - Client-side ML for UI predictions
Phase 2: Adaptive Interface

Uses TensorFlow.js-like predictions to adapt UI to user behavior.
"""

import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict
import json


@dataclass
class UserActivity:
    """Single user activity record"""
    user_id: str
    action_type: str  # click, navigation, scroll, typing
    element: str
    page: str
    timestamp: datetime
    duration: Optional[float] = None
    metadata: Dict = field(default_factory=dict)


@dataclass
class LayoutPrediction:
    """Predicted layout preferences"""
    preferred_layout: str
    sidebar_collapsed: bool
    widget_order: List[str]
    theme: str
    shortcut_hints: bool
    confidence: float


class BehaviorTracker:
    """Tracks and analyzes user behavior for UI adaptation"""
    
    def __init__(self):
        self.user_activities: Dict[str, List[UserActivity]] = defaultdict(list)
        self.action_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.page_views: Dict[str, List[str]] = defaultdict(list)
        
    def track_activity(self, user_id: str, action_type: str, element: str, 
                      page: str, duration: Optional[float] = None, 
                      metadata: Dict = None) -> None:
        """Track user activity"""
        activity = UserActivity(
            user_id=user_id,
            action_type=action_type,
            element=element,
            page=page,
            timestamp=datetime.now(),
            duration=duration,
            metadata=metadata or {}
        )
        
        self.user_activities[user_id].append(activity)
        self.action_counts[user_id][action_type] += 1
        self.page_views[user_id].append(page)
        
        # Keep only last 1000 activities
        if len(self.user_activities[user_id]) > 1000:
            self.user_activities[user_id] = self.user_activities[user_id][-1000:]
    
    def get_user_actions(self, user_id: str, limit: int = 100) -> List[UserActivity]:
        """Get recent user activities"""
        return self.user_activities.get(user_id, [])[-limit:]
    
    def get_action_distribution(self, user_id: str) -> Dict[str, float]:
        """Get distribution of action types"""
        counts = self.action_counts.get(user_id, {})
        total = sum(counts.values())
        if total == 0:
            return {}
        return {k: v / total for k, v in counts.items()}
    
    def get_page_sequence(self, user_id: str) -> List[str]:
        """Get user's page navigation sequence"""
        return self.page_views.get(user_id, [])


class UIPredictionEngine:
    """ML engine for predicting UI preferences"""
    
    def __init__(self):
        self.tracker = BehaviorTracker()
        self.layout_templates = {
            'sidebar': {
                'layout': 'sidebar',
                'widgets': ['dashboard', 'analytics', 'tasks', 'notifications']
            },
            'topbar': {
                'layout': 'topbar', 
                'widgets': ['search', 'notifications', 'profile']
            },
            'minimal': {
                'layout': 'minimal',
                'widgets': ['dashboard']
            }
        }
        
    def predict_layout(self, user_id: str, time_of_day: int = None, 
                      device_type: str = 'desktop') -> LayoutPrediction:
        """Predict user's preferred layout"""
        actions = self.tracker.get_user_actions(user_id)
        
        if not actions:
            # Default prediction for new users
            return LayoutPrediction(
                preferred_layout='sidebar',
                sidebar_collapsed=False,
                widget_order=['dashboard', 'analytics', 'tasks', 'notifications'],
                theme='adaptive',
                shortcut_hints=True,
                confidence=0.5
            )
        
        # Analyze click patterns
        click_count = sum(1 for a in actions if a.action_type == 'click')
        nav_count = sum(1 for a in actions if a.action_type == 'navigation')
        
        # Analyze page preferences
        page_views = self.tracker.get_page_sequence(user_id)
        unique_pages = len(set(page_views))
        
        # Determine layout based on usage patterns
        if unique_pages > 10 and click_count > 100:
            layout = 'sidebar'
            collapsed = False
        elif unique_pages < 5:
            layout = 'minimal'
            collapsed = True
        else:
            layout = 'topbar'
            collapsed = False
        
        # Time-based theme
        if time_of_day is None:
            time_of_day = datetime.now().hour
            
        if time_of_day < 6 or time_of_day > 20:
            theme = 'dark'
        elif time_of_day < 8 or time_of_day > 18:
            theme = 'adaptive'
        else:
            theme = 'light'
        
        # Calculate confidence
        confidence = min(0.5 + (len(actions) / 500), 0.95)
        
        # Widget order based on usage
        widget_usage = defaultdict(int)
        for a in actions:
            if a.element:
                widget_usage[a.element] += 1
        
        sorted_widgets = sorted(widget_usage.items(), key=lambda x: x[1], reverse=True)
        widget_order = [w[0] for w in sorted_widgets[:4]]
        
        if not widget_order:
            widget_order = ['dashboard', 'analytics', 'tasks', 'notifications']
        
        return LayoutPrediction(
            preferred_layout=layout,
            sidebar_collapsed=collapsed,
            widget_order=widget_order,
            theme=theme,
            shortcut_hints=len(actions) > 50,
            confidence=confidence
        )
    
    def predict_next_page(self, user_id: str) -> Optional[str]:
        """Predict next page user will visit"""
        pages = self.tracker.get_page_sequence(user_id)
        
        if len(pages) < 3:
            return None
        
        # Use simple Markov-like prediction
        transitions = defaultdict(lambda: defaultdict(int))
        for i in range(len(pages) - 1):
            transitions[pages[i]][pages[i + 1]] += 1
        
        last_page = pages[-1]
        if last_page in transitions:
            next_pages = transitions[last_page]
            if next_pages:
                return max(next_pages.items(), key=lambda x: x[1])[0]
        
        return None
    
    def predict_feature_usage(self, user_id: str) -> Dict[str, float]:
        """Predict which features user will use"""
        actions = self.tracker.get_user_actions(user_id, limit=200)
        
        feature_counts = defaultdict(int)
        for action in actions:
            if action.element:
                feature_counts[action.element] += 1
        
        total = sum(feature_counts.values())
        if total == 0:
            return {}
        
        return {k: v / total for k, v in feature_counts.items()}
    
    def get_time_based_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze time-based usage patterns"""
        actions = self.tracker.get_user_actions(user_id, limit=500)
        
        if not actions:
            return {}
        
        # Group by hour
        hour_counts = defaultdict(int)
        day_counts = defaultdict(int)
        
        for action in actions:
            hour = action.timestamp.hour
            day = action.timestamp.strftime('%A')
            hour_counts[hour] += 1
            day_counts[day] += 1
        
        # Find peak hours
        peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Find preferred days
        peak_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'peak_hours': [h[0] for h in peak_hours],
            'peak_days': [d[0] for d in peak_days],
            'avg_session_length': np.mean([a.duration for a in actions if a.duration]) if any(a.duration for a in actions) else 0
        }


class AdaptiveUIEngine:
    """Main adaptive UI engine coordinating all predictions"""
    
    def __init__(self):
        self.tracker = BehaviorTracker()
        self.predictor = UIPredictionEngine()
        
    def track(self, user_id: str, action_type: str, element: str, 
             page: str, duration: float = None, metadata: Dict = None) -> None:
        """Track user activity"""
        self.tracker.track_activity(user_id, action_type, element, page, duration, metadata)
    
    def get_layout_prediction(self, user_id: str, device_type: str = 'desktop') -> Dict:
        """Get layout prediction for user"""
        time_of_day = datetime.now().hour
        prediction = self.predictor.predict_layout(user_id, time_of_day, device_type)
        
        return {
            'preferredLayout': prediction.preferred_layout,
            'sidebarCollapsed': prediction.sidebar_collapsed,
            'widgetOrder': prediction.widget_order,
            'theme': prediction.theme,
            'shortcutHints': prediction.shortcut_hints,
            'confidence': prediction.confidence
        }
    
    def get_next_page_prediction(self, user_id: str) -> Optional[str]:
        """Predict next page"""
        return self.predictor.predict_next_page(user_id)
    
    def get_feature_predictions(self, user_id: str) -> Dict[str, float]:
        """Get feature usage predictions"""
        return self.predictor.predict_feature_usage(user_id)
    
    def get_time_patterns(self, user_id: str) -> Dict:
        """Get time-based patterns"""
        return self.predictor.get_time_based_patterns(user_id)
    
    def get_full_analytics(self, user_id: str) -> Dict:
        """Get complete analytics for a user"""
        return {
            'layout': self.get_layout_prediction(user_id),
            'nextPage': self.get_next_page_prediction(user_id),
            'features': self.get_feature_predictions(user_id),
            'timePatterns': self.get_time_patterns(user_id),
            'actionDistribution': self.tracker.get_action_distribution(user_id)
        }


# Export for FastAPI
def create_adaptive_ui_routes(app):
    """Create FastAPI routes for Adaptive UI service"""
    from fastapi import APIRouter, HTTPException
    
    router = APIRouter()
    engine = AdaptiveUIEngine()
    
    @router.post("/track/{user_id}")
    async def track_activity(user_id: str, data: Dict):
        """Track user activity"""
        engine.track(
            user_id=user_id,
            action_type=data.get('type', 'click'),
            element=data.get('element', ''),
            page=data.get('page', ''),
            duration=data.get('duration'),
            metadata=data.get('metadata', {})
        )
        return {"success": True}
    
    @router.get("/layout/{user_id}")
    async def get_layout(user_id: str, device: str = 'desktop'):
        """Get layout prediction"""
        layout = engine.get_layout_prediction(user_id, device)
        return {"success": True, "layout": layout}
    
    @router.get("/next-page/{user_id}")
    async def get_next_page(user_id: str):
        """Predict next page"""
        next_page = engine.get_next_page_prediction(user_id)
        return {"success": True, "nextPage": next_page}
    
    @router.get("/analytics/{user_id}")
    async def get_analytics(user_id: str):
        """Get full analytics"""
        analytics = engine.get_full_analytics(user_id)
        return {"success": True, "analytics": analytics}
    
    return router


if __name__ == "__main__":
    # Demo usage
    engine = AdaptiveUIEngine()
    
    # Simulate user activity
    user_id = "user123"
    
    # Track some activities
    activities = [
        ('click', 'dashboard', '/dashboard'),
        ('click', 'analytics', '/dashboard'),
        ('navigation', 'analytics', '/analytics'),
        ('click', 'reports', '/analytics'),
        ('navigation', 'reports', '/reports'),
        ('click', 'export', '/reports'),
    ]
    
    for action_type, element, page in activities:
        engine.track(user_id, action_type, element, page)
    
    # Get predictions
    layout = engine.get_layout_prediction(user_id)
    print("Layout Prediction:")
    print(json.dumps(layout, indent=2))
    
    analytics = engine.get_full_analytics(user_id)
    print("\nFull Analytics:")
    print(json.dumps(analytics, indent=2))

