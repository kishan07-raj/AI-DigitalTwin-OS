"""
Digital Twin Engine - User Behavior Modeling
Phase 3: Personal Digital Twin

This module creates AI-powered models that learn user behavior patterns
for task automation and predictions.
"""

import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import json
import os


@dataclass
class UserBehaviorProfile:
    """User behavior profile data structure"""
    user_id: str
    typing_patterns: Dict[str, float] = field(default_factory=dict)
    navigation_preferences: List[str] = field(default_factory=list)
    feature_usage: Dict[str, int] = field(default_factory=dict)
    time_based_patterns: Dict[str, Any] = field(default_factory=dict)
    task_sequences: List[List[str]] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict:
        return {
            'user_id': self.user_id,
            'typing_patterns': self.typing_patterns,
            'navigation_preferences': self.navigation_preferences,
            'feature_usage': self.feature_usage,
            'time_based_patterns': self.time_based_patterns,
            'task_sequences': self.task_sequences,
            'last_updated': self.last_updated.isoformat()
        }


class TypingPatternAnalyzer:
    """Analyzes user typing patterns"""
    
    def __init__(self):
        self.key_intervals = []
        self.keystroke_durations = []
        self.error_rates = []
        
    def analyze_typing(self, keystrokes: List[Dict]) -> Dict[str, float]:
        """Analyze typing patterns from keystroke data"""
        if not keystrokes:
            return {
                'avg_key_interval': 0.0,
                'avg_keystroke_duration': 0.0,
                'error_rate': 0.0,
                'typing_speed': 0.0
            }
        
        # Calculate key intervals
        intervals = []
        for i in range(1, len(keystrokes)):
            if 'timestamp' in keystrokes[i] and 'timestamp' in keystrokes[i-1]:
                interval = keystrokes[i]['timestamp'] - keystrokes[i-1]['timestamp']
                intervals.append(interval)
        
        # Calculate keystroke durations
        durations = []
        for ks in keystrokes:
            if 'press_time' in ks and 'release_time' in ks:
                duration = ks['release_time'] - ks['press_time']
                durations.append(duration)
        
        # Count errors
        errors = sum(1 for ks in keystrokes if ks.get('is_error', False))
        
        return {
            'avg_key_interval': np.mean(intervals) if intervals else 0.0,
            'avg_keystroke_duration': np.mean(durations) if durations else 0.0,
            'error_rate': errors / len(keystrokes) if keystrokes else 0.0,
            'typing_speed': len(keystrokes) / 60.0 if intervals else 0.0  # keys per minute
        }
    
    def match_pattern(self, new_typing: Dict[str, float], profile: Dict[str, float], threshold: float = 0.8) -> bool:
        """Check if new typing matches user profile"""
        if not profile:
            return False
        
        if not new_typing:
            return False
        
        similarity = 0.0
        count = 0
        for key in profile:
            if key in new_typing:
                # Calculate relative difference (normalized)
                max_val = max(abs(profile[key]), abs(new_typing[key]), 0.001)
                diff = abs(new_typing[key] - profile[key]) / max_val
                similarity += 1.0 - min(diff, 1.0)
                count += 1
        
        if count == 0:
            return False
        
        return (similarity / count) >= threshold


class TaskAutomationEngine:
    """Engine for automating user tasks based on learned patterns"""
    
    def __init__(self):
        self.task_templates = {}
        self.automations = []
        
    def learn_task_sequence(self, user_id: str, actions: List[str]) -> None:
        """Learn common task sequences"""
        key = f"{user_id}_tasks"
        if key not in self.task_templates:
            self.task_templates[key] = []
        
        # Find if this sequence exists as a subsequence
        for template in self.task_templates[key]:
            if self._is_similar_sequence(actions, template['sequence']):
                # Update with new data
                self._update_sequence(template, actions)
                return
        
        # Add new sequence
        self.task_templates[key].append({
            'sequence': actions,
            'count': 1,
            'last_used': datetime.now().isoformat()
        })
    
    def _is_similar_sequence(self, seq1: List[str], seq2: List[str]) -> bool:
        """Check if sequences are similar"""
        if len(seq1) != len(seq2):
            return False
        matches = sum(1 for a, b in zip(seq1, seq2) if a == b)
        return matches / len(seq1) > 0.7
    
    def _update_sequence(self, template: Dict, new_seq: List[str]) -> None:
        """Update sequence template with new data"""
        template['count'] += 1
        template['last_used'] = datetime.now().isoformat()
    
    def predict_next_action(self, user_id: str, current_actions: List[str]) -> Optional[str]:
        """Predict next action based on learned patterns"""
        key = f"{user_id}_tasks"
        if key not in self.task_templates:
            return None
        
        for template in self.task_templates[key]:
            seq = template['sequence']
            if len(current_actions) < len(seq):
                if all(a == b for a, b in zip(current_actions, seq[:len(current_actions)])):
                    return seq[len(current_actions)]
        
        return None
    
    def suggest_automation(self, user_id: str) -> List[Dict[str, Any]]:
        """Suggest automations based on user patterns"""
        suggestions = []
        key = f"{user_id}_tasks"
        
        if key in self.task_templates:
            for template in self.task_templates[key]:
                if template['count'] >= 3:
                    suggestions.append({
                        'id': f"auto_{template['count']}",
                        'title': self._generate_automation_title(template['sequence']),
                        'description': f"Automate {template['sequence'][0]} → {' → '.join(template['sequence'][1:4])}",
                        'confidence': min(template['count'] / 10.0, 1.0),
                        'sequence': template['sequence']
                    })
        
        return suggestions
    
    def _generate_automation_title(self, sequence: List[str]) -> str:
        """Generate a human-readable automation title"""
        if len(sequence) == 0:
            return "Empty Task"
        elif len(sequence) == 1:
            return f"Auto {sequence[0]}"
        else:
            return f"Auto {sequence[0]} → {sequence[-1]}"


class AutoScheduler:
    """Automatic scheduling based on user patterns"""
    
    def __init__(self):
        self.schedule_patterns = {}
        
    def analyze_schedule_patterns(self, user_id: str, events: List[Dict]) -> Dict[str, Any]:
        """Analyze user's scheduling patterns"""
        if not events:
            return {}
        
        # Group events by hour
        hour_counts = {}
        day_counts = {}
        
        for event in events:
            if 'start_time' in event:
                dt = datetime.fromisoformat(event['start_time'])
                hour = dt.hour
                day = dt.strftime('%A')
                
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
                day_counts[day] = day_counts.get(day, 0) + 1
        
        # Find peak hours
        peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'peak_hours': [h[0] for h in peak_hours],
            'preferred_days': list(day_counts.keys()),
            'avg_event_duration': np.mean([e.get('duration', 60) for e in events]) if events else 60
        }
    
    def suggest_meeting_time(self, user_id: str, preferred_duration: int = 60) -> Optional[Dict]:
        """Suggest optimal meeting time"""
        if user_id not in self.schedule_patterns:
            return None
        
        patterns = self.schedule_patterns[user_id]
        peak_hours = patterns.get('peak_hours', [10, 11, 14, 15])
        
        # Return first available peak hour
        return {
            'suggested_hour': peak_hours[0] if peak_hours else 10,
            'duration': preferred_duration,
            'confidence': 0.85
        }


class DigitalTwinEngine:
    """Main Digital Twin Engine that coordinates all behavior modeling"""
    
    def __init__(self):
        self.typing_analyzer = TypingPatternAnalyzer()
        self.task_automation = TaskAutomationEngine()
        self.auto_scheduler = AutoScheduler()
        self.user_profiles: Dict[str, UserBehaviorProfile] = {}
        
    def create_user_profile(self, user_id: str) -> UserBehaviorProfile:
        """Create a new user profile"""
        profile = UserBehaviorProfile(user_id=user_id)
        self.user_profiles[user_id] = profile
        return profile
    
    def get_user_profile(self, user_id: str) -> Optional[UserBehaviorProfile]:
        """Get user profile"""
        return self.user_profiles.get(user_id)
    
    def update_typing_patterns(self, user_id: str, keystrokes: List[Dict]) -> None:
        """Update typing patterns for a user"""
        if user_id not in self.user_profiles:
            self.create_user_profile(user_id)
        
        analysis = self.typing_analyzer.analyze_typing(keystrokes)
        self.user_profiles[user_id].typing_patterns = analysis
        self.user_profiles[user_id].last_updated = datetime.now()
    
    def update_navigation_preferences(self, user_id: str, pages: List[str]) -> None:
        """Update navigation preferences"""
        if user_id not in self.user_profiles:
            self.create_user_profile(user_id)
        
        self.user_profiles[user_id].navigation_preferences = pages
        self.user_profiles[user_id].last_updated = datetime.now()
    
    def update_feature_usage(self, user_id: str, feature: str) -> None:
        """Update feature usage count"""
        if user_id not in self.user_profiles:
            self.create_user_profile(user_id)
        
        usage = self.user_profiles[user_id].feature_usage
        usage[feature] = usage.get(feature, 0) + 1
        self.user_profiles[user_id].last_updated = datetime.now()
    
    def learn_task_sequence(self, user_id: str, actions: List[str]) -> None:
        """Learn a task sequence"""
        self.task_automation.learn_task_sequence(user_id, actions)
        
    def get_automations(self, user_id: str) -> List[Dict]:
        """Get suggested automations"""
        return self.task_automation.suggest_automation(user_id)
    
    def get_behavior_summary(self, user_id: str) -> Dict:
        """Get comprehensive behavior summary"""
        if user_id not in self.user_profiles:
            return {}
        
        profile = self.user_profiles[user_id]
        
        return {
            'user_id': user_id,
            'typing_patterns': profile.typing_patterns,
            'top_features': sorted(
                profile.feature_usage.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5],
            'navigation_pattern': profile.navigation_preferences[-10:] if profile.navigation_preferences else [],
            'twin_accuracy': self._calculate_accuracy(user_id),
            'last_updated': profile.last_updated.isoformat()
        }
    
    def _calculate_accuracy(self, user_id: str) -> float:
        """Calculate digital twin prediction accuracy"""
        # Simplified accuracy calculation
        if user_id not in self.user_profiles:
            return 0.0
        
        profile = self.user_profiles[user_id]
        
        # Factor in data available
        data_score = min(
            len(profile.typing_patterns) / 5.0 +
            len(profile.feature_usage) / 10.0 +
            len(profile.navigation_preferences) / 10.0,
            1.0
        )
        
        return min(data_score * 0.85 + 0.1, 0.95)
    
    def save_profiles(self, path: str = "./data/twin_profiles.json") -> None:
        """Save all profiles to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        data = {
            user_id: profile.to_dict() 
            for user_id, profile in self.user_profiles.items()
        }
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def load_profiles(self, path: str = "./data/twin_profiles.json") -> None:
        """Load profiles from disk"""
        if not os.path.exists(path):
            return
        
        with open(path, 'r') as f:
            data = json.load(f)
        
        for user_id, profile_data in data.items():
            profile = UserBehaviorProfile(
                user_id=profile_data['user_id'],
                typing_patterns=profile_data.get('typing_patterns', {}),
                navigation_preferences=profile_data.get('navigation_preferences', []),
                feature_usage=profile_data.get('feature_usage', {}),
                time_based_patterns=profile_data.get('time_based_patterns', {}),
                task_sequences=profile_data.get('task_sequences', []),
                last_updated=datetime.fromisoformat(profile_data.get('last_updated', datetime.now().isoformat()))
            )
            self.user_profiles[user_id] = profile


# FastAPI endpoints for the Digital Twin service
def create_digital_twin_routes(app):
    """Create FastAPI routes for Digital Twin service"""
    from fastapi import APIRouter, HTTPException
    
    router = APIRouter()
    engine = DigitalTwinEngine()
    
    @router.post("/profile/{user_id}")
    async def create_profile(user_id: str):
        """Create a new user profile"""
        profile = engine.create_user_profile(user_id)
        return {"success": True, "profile": profile.to_dict()}
    
    @router.get("/profile/{user_id}")
    async def get_profile(user_id: str):
        """Get user profile"""
        profile = engine.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {"success": True, "profile": profile.to_dict()}
    
    @router.post("/typing/{user_id}")
    async def update_typing(user_id: str, keystrokes: List[Dict]):
        """Update typing patterns"""
        engine.update_typing_patterns(user_id, keystrokes)
        return {"success": True}
    
    @router.get("/automations/{user_id}")
    async def get_automations(user_id: str):
        """Get suggested automations"""
        automations = engine.get_automations(user_id)
        return {"success": True, "automations": automations}
    
    @router.get("/summary/{user_id}")
    async def get_summary(user_id: str):
        """Get behavior summary"""
        summary = engine.get_behavior_summary(user_id)
        return {"success": True, "summary": summary}
    
    return router


if __name__ == "__main__":
    # Demo usage
    engine = DigitalTwinEngine()
    
    # Create a profile
    engine.create_user_profile("user123")
    
    # Simulate typing data
    keystrokes = [
        {'timestamp': 0.0, 'key': 'h', 'press_time': 0.0, 'release_time': 0.1},
        {'timestamp': 0.15, 'key': 'e', 'press_time': 0.15, 'release_time': 0.25},
        {'timestamp': 0.3, 'key': 'l', 'press_time': 0.3, 'release_time': 0.4},
        {'timestamp': 0.45, 'key': 'l', 'press_time': 0.45, 'release_time': 0.55},
        {'timestamp': 0.6, 'key': 'o', 'press_time': 0.6, 'release_time': 0.7},
    ]
    
    engine.update_typing_patterns("user123", keystrokes)
    engine.update_feature_usage("user123", "dashboard")
    engine.update_feature_usage("user123", "analytics")
    engine.learn_task_sequence("user123", ["open_dashboard", "view_analytics", "export_report"])
    
    # Get summary
    summary = engine.get_behavior_summary("user123")
    print(json.dumps(summary, indent=2))

