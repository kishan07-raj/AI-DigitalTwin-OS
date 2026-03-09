"""
Enhanced AI Prediction Engine
Phase 3: Advanced User Behavior Analysis

This module provides advanced AI predictions including:
- User activity pattern analysis
- Session duration prediction
- Focus time tracking
- Navigation behavior prediction
- Productivity insights
"""

import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict
import json


@dataclass
class ActivityPattern:
    """User activity pattern data"""
    user_id: str
    hourly_distribution: Dict[int, float] = field(default_factory=lambda: defaultdict(float))
    daily_distribution: Dict[str, float] = field(default_factory=lambda: defaultdict(float))
    weekly_trend: List[float] = field(default_factory=list)
    avg_session_duration: float = 0.0
    focus_time_avg: float = 0.0
    context_switch_count: int = 0
    peak_hours: List[int] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class ProductivityInsight:
    """Productivity insight data"""
    score: float
    trend: str  # 'up', 'down', 'stable'
    factors: List[Dict[str, Any]]
    period: str
    recommendations: List[str]


class ActivityPatternAnalyzer:
    """Analyzes user activity patterns"""
    
    def __init__(self):
        self.patterns: Dict[str, ActivityPattern] = {}
        
    def analyze_hourly_patterns(self, sessions: List[Dict]) -> Dict[int, float]:
        """Analyze activity by hour of day"""
        hourly_counts = defaultdict(int)
        
        for session in sessions:
            if 'startTime' in session:
                dt = datetime.fromisoformat(session['startTime'])
                hour = dt.hour
                hourly_counts[hour] += 1
        
        # Normalize to percentages
        total = sum(hourly_counts.values()) or 1
        return {hour: count / total for hour, count in hourly_counts.items()}
    
    def analyze_daily_patterns(self, sessions: List[Dict]) -> Dict[str, float]:
        """Analyze activity by day of week"""
        daily_counts = defaultdict(int)
        
        for session in sessions:
            if 'startTime' in session:
                dt = datetime.fromisoformat(session['startTime'])
                day = dt.strftime('%A')
                daily_counts[day] += 1
        
        # Normalize to percentages
        total = sum(daily_counts.values()) or 1
        return {day: count / total for day, count in daily_counts.items()}
    
    def detect_peak_hours(self, hourly_dist: Dict[int, float]) -> List[int]:
        """Detect peak activity hours"""
        if not hourly_dist:
            return []
        
        # Find hours with activity above 50% of max
        max_activity = max(hourly_dist.values())
        threshold = max_activity * 0.5
        
        peak_hours = [hour for hour, activity in hourly_dist.items() 
                     if activity >= threshold]
        
        return sorted(peak_hours)
    
    def detect_context_switching(self, activities: List[Dict]) -> int:
        """Detect context switching patterns"""
        if len(activities) < 2:
            return 0
        
        switches = 0
        prev_page = None
        
        for activity in activities:
            if activity.get('type') == 'page_view':
                page = activity.get('page')
                if prev_page and page != prev_page:
                    switches += 1
                prev_page = page
        
        return switches
    
    def calculate_focus_time(self, sessions: List[Dict], activities: List[Dict]) -> float:
        """Calculate average focus time in minutes"""
        if not sessions:
            return 0.0
        
        # Focus time is time spent without context switching
        focus_times = []
        
        for session in sessions:
            session_id = session.get('_id')
            session_activities = [a for a in activities 
                                if a.get('sessionId') == session_id]
            
            if len(session_activities) > 1:
                # Calculate time between first and last activity
                timestamps = [datetime.fromisoformat(a['timestamp']) 
                            for a in session_activities if 'timestamp' in a]
                
                if len(timestamps) >= 2:
                    duration = (max(timestamps) - min(timestamps)).total_seconds() / 60
                    focus_times.append(duration)
        
        return np.mean(focus_times) if focus_times else 0.0
    
    def get_pattern(self, user_id: str) -> Optional[ActivityPattern]:
        """Get user activity pattern"""
        return self.patterns.get(user_id)
    
    def update_pattern(self, user_id: str, sessions: List[Dict], 
                     activities: List[Dict]) -> ActivityPattern:
        """Update user activity pattern"""
        pattern = self.patterns.get(user_id, ActivityPattern(user_id=user_id))
        
        # Analyze patterns
        pattern.hourly_distribution = self.analyze_hourly_patterns(sessions)
        pattern.daily_distribution = self.analyze_daily_patterns(sessions)
        pattern.peak_hours = self.detect_peak_hours(pattern.hourly_distribution)
        pattern.context_switch_count = self.detect_context_switching(activities)
        pattern.focus_time_avg = self.calculate_focus_time(sessions, activities)
        
        # Calculate average session duration
        if sessions:
            durations = []
            for session in sessions:
                if 'startTime' in session and 'endTime' in session:
                    start = datetime.fromisoformat(session['startTime'])
                    end = datetime.fromisoformat(session['endTime'])
                    duration = (end - start).total_seconds() / 60
                    durations.append(duration)
            
            pattern.avg_session_duration = np.mean(durations) if durations else 0.0
        
        pattern.last_updated = datetime.now()
        self.patterns[user_id] = pattern
        
        return pattern


class ProductivityAnalyzer:
    """Analyzes user productivity"""
    
    def __init__(self):
        self.baseline_score = 75.0
        
    def calculate_productivity_score(self, pattern: ActivityPattern) -> float:
        """Calculate overall productivity score (0-100)"""
        if not pattern.user_id:
            return self.baseline_score
        
        score = 0.0
        weights = []
        
        # Factor 1: Consistent peak hours (20% weight)
        if pattern.peak_hours:
            # Score higher for consistent working hours (9-11am, 2-4pm)
            good_hours = set(range(9, 12)) | set(range(14, 17))
            matching_hours = len(set(pattern.peak_hours) & good_hours)
            peak_score = min(matching_hours / 3, 1.0) * 20
            score += peak_score
            weights.append(20)
        
        # Factor 2: Focus time (30% weight)
        if pattern.focus_time_avg > 0:
            # Good focus time is 25-45 minutes
            if 25 <= pattern.focus_time_avg <= 45:
                focus_score = 30
            elif pattern.focus_time_avg > 45:
                focus_score = 30 - (pattern.focus_time_avg - 45) * 0.5
            else:
                focus_score = pattern.focus_time_avg * 1.2
            score += max(focus_score, 0)
            weights.append(30)
        
        # Factor 3: Low context switching (25% weight)
        if pattern.context_switch_count > 0:
            # Lower is better
            switch_score = max(25 - pattern.context_switch_count * 2, 0)
            score += switch_score
            weights.append(25)
        
        # Factor 4: Healthy session duration (25% weight)
        if pattern.avg_session_duration > 0:
            # Optimal is 20-40 minutes
            if 20 <= pattern.avg_session_duration <= 40:
                duration_score = 25
            elif pattern.avg_session_duration < 20:
                duration_score = pattern.avg_session_duration * 1.25
            else:
                duration_score = max(25 - (pattern.avg_session_duration - 40) * 0.5, 0)
            score += max(duration_score, 0)
            weights.append(25)
        
        return min(score, 100)
    
    def get_productivity_trend(self, historical_scores: List[float]) -> str:
        """Determine productivity trend"""
        if len(historical_scores) < 2:
            return 'stable'
        
        recent = np.mean(historical_scores[-3:])
        previous = np.mean(historical_scores[:-3])
        
        diff = (recent - previous) / (previous or 1)
        
        if diff > 0.1:
            return 'up'
        elif diff < -0.1:
            return 'down'
        return 'stable'
    
    def generate_insights(self, pattern: ActivityPattern, 
                         historical_scores: List[float]) -> ProductivityInsight:
        """Generate productivity insights"""
        score = self.calculate_productivity_score(pattern)
        trend = self.get_productivity_trend(historical_scores)
        
        factors = [
            {
                'name': 'Focus Time',
                'value': min(pattern.focus_time_avg * 4, 100),
                'weight': 0.3,
                'description': f"Average focus: {pattern.focus_time_avg:.0f} min"
            },
            {
                'name': 'Session Consistency',
                'value': min(pattern.avg_session_duration * 2.5, 100),
                'weight': 0.25,
                'description': f"Avg session: {pattern.avg_session_duration:.0f} min"
            },
            {
                'name': 'Context Management',
                'value': max(100 - pattern.context_switch_count * 10, 0),
                'weight': 0.2,
                'description': f"Switches: {pattern.context_switch_count}"
            },
            {
                'name': 'Peak Performance',
                'value': len(pattern.peak_hours) * 20 if pattern.peak_hours else 50,
                'weight': 0.25,
                'description': f"Peak hours: {pattern.peak_hours}"
            }
        ]
        
        # Generate recommendations
        recommendations = []
        
        if pattern.focus_time_avg < 25:
            recommendations.append("Try the Pomodoro technique: 25 min focused work, 5 min break")
        
        if pattern.context_switch_count > 5:
            recommendations.append("Minimize context switching by batching similar tasks")
        
        if pattern.peak_hours and 9 not in pattern.peak_hours and 10 not in pattern.peak_hours:
            recommendations.append("Your peak hours are unusual. Consider adjusting your schedule")
        
        if pattern.avg_session_duration > 60:
            recommendations.append("Take regular breaks to maintain high productivity")
        
        if not recommendations:
            recommendations.append("Great productivity patterns! Keep up the good work")
        
        return ProductivityInsight(
            score=score,
            trend=trend,
            factors=factors,
            period='This Week',
            recommendations=recommendations
        )


class AdvancedPredictionEngine:
    """Main prediction engine with advanced analytics"""
    
    def __init__(self):
        self.activity_analyzer = ActivityPatternAnalyzer()
        self.productivity_analyzer = ProductivityAnalyzer()
        self.user_sessions: Dict[str, List[Dict]] = defaultdict(list)
        self.user_activities: Dict[str, List[Dict]] = defaultdict(list)
        self.historical_scores: Dict[str, List[float]] = defaultdict(list)
        
    def record_session(self, user_id: str, session_data: Dict) -> None:
        """Record a user session"""
        self.user_sessions[user_id].append(session_data)
        
        # Keep only last 100 sessions
        if len(self.user_sessions[user_id]) > 100:
            self.user_sessions[user_id] = self.user_sessions[user_id][-100:]
    
    def record_activity(self, user_id: str, activity_data: Dict) -> None:
        """Record a user activity"""
        self.user_activities[user_id].append(activity_data)
        
        # Keep only last 1000 activities
        if len(self.user_activities[user_id]) > 1000:
            self.user_activities[user_id] = self.user_activities[user_id][-1000:]
    
    def get_activity_pattern(self, user_id: str) -> Optional[ActivityPattern]:
        """Get user activity pattern"""
        sessions = self.user_sessions.get(user_id, [])
        activities = self.user_activities.get(user_id, [])
        
        if not sessions and not activities:
            return None
        
        return self.activity_analyzer.update_pattern(
            user_id, sessions, activities
        )
    
    def get_productivity_insight(self, user_id: str) -> ProductivityInsight:
        """Get productivity insights for user"""
        pattern = self.get_activity_pattern(user_id)
        
        if not pattern:
            return ProductivityInsight(
                score=75.0,
                trend='stable',
                factors=[],
                period='This Week',
                recommendations=['Start using the app to get personalized insights']
            )
        
        # Calculate current score
        current_score = self.productivity_analyzer.calculate_productivity_score(pattern)
        
        # Store historical score
        self.historical_scores[user_id].append(current_score)
        
        # Keep only last 10 scores
        if len(self.historical_scores[user_id]) > 10:
            self.historical_scores[user_id] = self.historical_scores[user_id][-10:]
        
        return self.productivity_analyzer.generate_insights(
            pattern, self.historical_scores[user_id]
        )
    
    def predict_optimal_work_time(self, user_id: str) -> Dict[str, Any]:
        """Predict optimal working time for user"""
        pattern = self.get_activity_pattern(user_id)
        
        if not pattern or not pattern.peak_hours:
            return {
                'optimal_hours': [10, 11, 14, 15],
                'description': 'Based on typical user patterns'
            }
        
        # Find best continuous block
        peak_hours = sorted(pattern.peak_hours)
        best_block = []
        current_block = [peak_hours[0]]
        
        for i in range(1, len(peak_hours)):
            if peak_hours[i] - peak_hours[i-1] <= 1:
                current_block.append(peak_hours[i])
            else:
                if len(current_block) > len(best_block):
                    best_block = current_block
                current_block = [peak_hours[i]]
        
        if len(current_block) > len(best_block):
            best_block = current_block
        
        return {
            'optimal_hours': best_block,
            'description': f"Your most productive hours are {best_block[0]}:00-{best_block[-1]+1}:00"
        }
    
    def generate_behavior_insights(self, user_id: str) -> List[str]:
        """Generate behavioral insights"""
        pattern = self.get_activity_pattern(user_id)
        insights = []
        
        if not pattern:
            return ['Not enough data to generate insights yet']
        
        # Peak hours insight
        if pattern.peak_hours:
            peak_str = ', '.join([f"{h}:00" for h in sorted(pattern.peak_hours)[:3]])
            insights.append(f"Your productivity peaks between {peak_str}")
        
        # Focus time insight
        if pattern.focus_time_avg > 40:
            insights.append("You have excellent focus duration")
        elif pattern.focus_time_avg > 25:
            insights.append("Your focus time is good, but could be improved")
        elif pattern.focus_time_avg > 0:
            insights.append("Consider using the Pomodoro technique to improve focus")
        
        # Context switching insight
        if pattern.context_switch_count > 10:
            insights.append("High context switching detected - try to minimize distractions")
        elif pattern.context_switch_count > 5:
            insights.append("Moderate context switching - consider batching similar tasks")
        
        # Session duration insight
        if pattern.avg_session_duration > 45:
            insights.append("Long sessions detected - remember to take regular breaks")
        elif pattern.avg_session_duration > 20:
            insights.append("Your session duration is optimal for productivity")
        
        return insights
    
    def predict_next_action(self, user_id: str, 
                           current_page: str) -> Optional[str]:
        """Predict next user action based on patterns"""
        activities = self.user_activities.get(user_id, [])
        
        if len(activities) < 5:
            return None
        
        # Simple Markov-chain-like prediction
        page_transitions = defaultdict(list)
        
        for i in range(len(activities) - 1):
            if activities[i].get('type') == 'page_view':
                current = activities[i].get('page')
                next_page = activities[i + 1].get('page')
                if current and next_page:
                    page_transitions[current].append(next_page)
        
        # Find most likely next page
        if current_page in page_transitions:
            next_pages = page_transitions[current_page]
            if next_pages:
                return max(set(next_pages), key=next_pages.count)
        
        return None


# FastAPI routes
def create_prediction_routes(app):
    """Create FastAPI routes for prediction service"""
    from fastapi import APIRouter, HTTPException
    
    router = APIRouter()
    engine = AdvancedPredictionEngine()
    
    @router.post("/session/{user_id}")
    async def record_session(user_id: str, session_data: Dict):
        """Record a user session"""
        engine.record_session(user_id, session_data)
        return {"success": True}
    
    @router.post("/activity/{user_id}")
    async def record_activity(user_id: str, activity_data: Dict):
        """Record a user activity"""
        engine.record_activity(user_id, activity_data)
        return {"success": True}
    
    @router.get("/pattern/{user_id}")
    async def get_pattern(user_id: str):
        """Get user activity pattern"""
        pattern = engine.get_activity_pattern(user_id)
        if not pattern:
            raise HTTPException(status_code=404, detail="No pattern data found")
        return {
            "success": True,
            "pattern": {
                "peak_hours": pattern.peak_hours,
                "avg_session_duration": pattern.avg_session_duration,
                "focus_time_avg": pattern.focus_time_avg,
                "context_switch_count": pattern.context_switch_count,
                "hourly_distribution": dict(pattern.hourly_distribution),
                "daily_distribution": dict(pattern.daily_distribution)
            }
        }
    
    @router.get("/productivity/{user_id}")
    async def get_productivity(user_id: str):
        """Get productivity insights"""
        insight = engine.get_productivity_insight(user_id)
        return {
            "success": True,
            "productivity": {
                "score": insight.score,
                "trend": insight.trend,
                "factors": insight.factors,
                "period": insight.period,
                "recommendations": insight.recommendations
            }
        }
    
    @router.get("/optimal-time/{user_id}")
    async def get_optimal_time(user_id: str):
        """Get optimal work time"""
        optimal = engine.predict_optimal_work_time(user_id)
        return {"success": True, "optimal_time": optimal}
    
    @router.get("/insights/{user_id}")
    async def get_insights(user_id: str):
        """Get behavioral insights"""
        insights = engine.generate_behavior_insights(user_id)
        return {"success": True, "insights": insights}
    
    @router.get("/next-action/{user_id}")
    async def get_next_action(user_id: str, current_page: str):
        """Predict next action"""
        next_action = engine.predict_next_action(user_id, current_page)
        return {"success": True, "next_action": next_action}
    
    return router


if __name__ == "__main__":
    # Demo usage
    engine = AdvancedPredictionEngine()
    
    # Simulate user sessions
    for i in range(10):
        engine.record_session("user123", {
            "startTime": datetime.now().isoformat(),
            "endTime": (datetime.now() + timedelta(minutes=30)).isoformat(),
            "duration": 30
        })
    
    # Simulate user activities
    pages = ["/dashboard", "/analytics", "/dashboard", "/reports", "/dashboard"]
    for page in pages:
        engine.record_activity("user123", {
            "type": "page_view",
            "page": page,
            "timestamp": datetime.now().isoformat()
        })
    
    # Get insights
    pattern = engine.get_activity_pattern("user123")
    productivity = engine.get_productivity_insight("user123")
    insights = engine.generate_behavior_insights("user123")
    
    print("=== Activity Pattern ===")
    print(f"Peak Hours: {pattern.peak_hours}")
    print(f"Avg Session: {pattern.avg_session_duration:.1f} min")
    print(f"Focus Time: {pattern.focus_time_avg:.1f} min")
    
    print("\n=== Productivity Score ===")
    print(f"Score: {productivity.score:.1f}")
    print(f"Trend: {productivity.trend}")
    print(f"Recommendations: {productivity.recommendations}")
    
    print("\n=== Behavioral Insights ===")
    for insight in insights:
        print(f"- {insight}")

