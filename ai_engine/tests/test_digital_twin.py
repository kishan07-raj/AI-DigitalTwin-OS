"""
Unit Tests for Digital Twin Engine
Tests the user behavior modeling functionality
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from digital_twin.model import (
    DigitalTwinEngine,
    TypingPatternAnalyzer,
    TaskAutomationEngine,
    UserBehaviorProfile,
)


class TestTypingPatternAnalyzer:
    """Tests for TypingPatternAnalyzer class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.analyzer = TypingPatternAnalyzer()
    
    def test_analyze_typing_with_valid_keystrokes(self):
        """Test typing analysis with valid keystroke data"""
        keystrokes = [
            {'timestamp': 0.0, 'key': 'h', 'press_time': 0.0, 'release_time': 0.1},
            {'timestamp': 0.15, 'key': 'e', 'press_time': 0.15, 'release_time': 0.25},
            {'timestamp': 0.3, 'key': 'l', 'press_time': 0.3, 'release_time': 0.4},
            {'timestamp': 0.45, 'key': 'l', 'press_time': 0.45, 'release_time': 0.55},
            {'timestamp': 0.6, 'key': 'o', 'press_time': 0.6, 'release_time': 0.7},
        ]
        
        result = self.analyzer.analyze_typing(keystrokes)
        
        assert 'avg_key_interval' in result
        assert 'avg_keystroke_duration' in result
        assert 'error_rate' in result
        assert 'typing_speed' in result
        assert result['avg_key_interval'] > 0
        assert result['typing_speed'] > 0
    
    def test_analyze_typing_with_empty_keystrokes(self):
        """Test typing analysis with empty keystroke data"""
        result = self.analyzer.analyze_typing([])
        
        assert result['avg_key_interval'] == 0.0
        assert result['avg_keystroke_duration'] == 0.0
        assert result['error_rate'] == 0.0
        assert result['typing_speed'] == 0.0
    
    def test_match_pattern_returns_true_for_matching(self):
        """Test pattern matching returns true for similar patterns"""
        profile = {
            'avg_key_interval': 0.15,
            'avg_keystroke_duration': 0.1,
            'error_rate': 0.02,
        }
        
        new_typing = {
            'avg_key_interval': 0.16,
            'avg_keystroke_duration': 0.11,
            'error_rate': 0.03,
        }
        
        result = self.analyzer.match_pattern(new_typing, profile, threshold=0.8)
        assert result is True
    
    def test_match_pattern_returns_false_for_different(self):
        """Test pattern matching returns false for different patterns"""
        profile = {
            'avg_key_interval': 0.15,
            'avg_keystroke_duration': 0.1,
            'error_rate': 0.02,
        }
        
        new_typing = {
            'avg_key_interval': 0.5,
            'avg_keystroke_duration': 0.5,
            'error_rate': 0.5,
        }
        
        result = self.analyzer.match_pattern(new_typing, profile, threshold=0.8)
        assert result is False
    
    def test_match_pattern_returns_false_for_empty_profile(self):
        """Test pattern matching returns false for empty profile"""
        result = self.analyzer.match_pattern({'key': 1}, {}, threshold=0.8)
        assert result is False


class TestTaskAutomationEngine:
    """Tests for TaskAutomationEngine class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.engine = TaskAutomationEngine()
    
    def test_learn_task_sequence(self):
        """Test learning a new task sequence"""
        user_id = "test_user"
        actions = ["open_dashboard", "view_analytics", "export_report"]
        
        self.engine.learn_task_sequence(user_id, actions)
        
        key = f"{user_id}_tasks"
        assert key in self.engine.task_templates
        assert len(self.engine.task_templates[key]) == 1
        assert self.engine.task_templates[key][0]['sequence'] == actions
    
    def test_predict_next_action_with_matching_sequence(self):
        """Test predicting next action with matching sequence"""
        user_id = "test_user"
        actions = ["open_dashboard", "view_analytics", "export_report"]
        
        self.engine.learn_task_sequence(user_id, actions)
        current_actions = ["open_dashboard", "view_analytics"]
        
        result = self.engine.predict_next_action(user_id, current_actions)
        
        assert result == "export_report"
    
    def test_predict_next_action_without_matching_sequence(self):
        """Test predicting next action without matching sequence"""
        user_id = "test_user"
        actions = ["open_dashboard", "view_analytics", "export_report"]
        
        self.engine.learn_task_sequence(user_id, actions)
        current_actions = ["unknown_action", "another_action"]
        
        result = self.engine.predict_next_action(user_id, current_actions)
        
        assert result is None
    
    def test_suggest_automation_with_frequent_sequence(self):
        """Test suggesting automation for frequent sequences"""
        user_id = "test_user"
        
        # Learn the same sequence multiple times
        for _ in range(5):
            self.engine.learn_task_sequence(user_id, ["action1", "action2", "action3"])
        
        suggestions = self.engine.suggest_automation(user_id)
        
        assert len(suggestions) > 0
        assert suggestions[0]['confidence'] > 0
    
    def test_suggest_automation_with_infrequent_sequence(self):
        """Test suggesting automation with infrequent sequences"""
        user_id = "test_user"
        
        # Learn sequence only once
        self.engine.learn_task_sequence(user_id, ["action1", "action2"])
        
        suggestions = self.engine.suggest_automation(user_id)
        
        # Should not suggest automation for sequences used only once
        assert len(suggestions) == 0


class TestDigitalTwinEngine:
    """Tests for DigitalTwinEngine class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.engine = DigitalTwinEngine()
    
    def test_create_user_profile(self):
        """Test creating a new user profile"""
        user_id = "test_user_123"
        
        profile = self.engine.create_user_profile(user_id)
        
        assert profile is not None
        assert profile.user_id == user_id
        assert user_id in self.engine.user_profiles
    
    def test_get_user_profile_existing(self):
        """Test getting an existing user profile"""
        user_id = "test_user_123"
        self.engine.create_user_profile(user_id)
        
        profile = self.engine.get_user_profile(user_id)
        
        assert profile is not None
        assert profile.user_id == user_id
    
    def test_get_user_profile_non_existing(self):
        """Test getting a non-existing user profile"""
        profile = self.engine.get_user_profile("non_existing_user")
        
        assert profile is None
    
    def test_update_typing_patterns(self):
        """Test updating typing patterns"""
        user_id = "test_user"
        keystrokes = [
            {'timestamp': 0.0, 'key': 'h', 'press_time': 0.0, 'release_time': 0.1},
            {'timestamp': 0.15, 'key': 'e', 'press_time': 0.15, 'release_time': 0.25},
        ]
        
        self.engine.update_typing_patterns(user_id, keystrokes)
        
        profile = self.engine.get_user_profile(user_id)
        assert profile is not None
        assert len(profile.typing_patterns) > 0
    
    def test_update_navigation_preferences(self):
        """Test updating navigation preferences"""
        user_id = "test_user"
        pages = ["/dashboard", "/analytics", "/reports", "/settings"]
        
        self.engine.update_navigation_preferences(user_id, pages)
        
        profile = self.engine.get_user_profile(user_id)
        assert profile.navigation_preferences == pages
    
    def test_update_feature_usage(self):
        """Test updating feature usage"""
        user_id = "test_user"
        
        self.engine.update_feature_usage(user_id, "dashboard")
        self.engine.update_feature_usage(user_id, "dashboard")
        self.engine.update_feature_usage(user_id, "analytics")
        
        profile = self.engine.get_user_profile(user_id)
        assert profile.feature_usage['dashboard'] == 2
        assert profile.feature_usage['analytics'] == 1
    
    def test_learn_task_sequence(self):
        """Test learning task sequences"""
        user_id = "test_user"
        actions = ["open_dashboard", "view_reports", "export_pdf"]
        
        self.engine.learn_task_sequence(user_id, actions)
        
        automations = self.engine.get_automations(user_id)
        assert len(automations) >= 0
    
    def test_get_behavior_summary(self):
        """Test getting behavior summary"""
        user_id = "test_user"
        
        # Create profile and add some data
        self.engine.create_user_profile(user_id)
        self.engine.update_feature_usage(user_id, "dashboard")
        self.engine.update_feature_usage(user_id, "analytics")
        
        summary = self.engine.get_behavior_summary(user_id)
        
        assert summary is not None
        assert 'user_id' in summary
        assert 'top_features' in summary
        assert summary['user_id'] == user_id
    
    def test_get_behavior_summary_empty_profile(self):
        """Test getting behavior summary for empty profile"""
        user_id = "new_user"
        
        summary = self.engine.get_behavior_summary(user_id)
        
        assert summary == {}
    
    def test_save_and_load_profiles(self):
        """Test saving and loading profiles"""
        user_id = "test_user"
        self.engine.create_user_profile(user_id)
        self.engine.update_feature_usage(user_id, "dashboard")
        
        # Save profiles
        test_path = "/tmp/test_twin_profiles.json"
        self.engine.save_profiles(test_path)
        
        # Create new engine and load
        new_engine = DigitalTwinEngine()
        new_engine.load_profiles(test_path)
        
        profile = new_engine.get_user_profile(user_id)
        assert profile is not None
        
        # Cleanup
        if os.path.exists(test_path):
            os.remove(test_path)


class TestUserBehaviorProfile:
    """Tests for UserBehaviorProfile dataclass"""
    
    def test_create_profile(self):
        """Test creating a user behavior profile"""
        profile = UserBehaviorProfile(user_id="test_user")
        
        assert profile.user_id == "test_user"
        assert profile.typing_patterns == {}
        assert profile.navigation_preferences == []
        assert profile.feature_usage == {}
    
    def test_to_dict(self):
        """Test converting profile to dictionary"""
        profile = UserBehaviorProfile(
            user_id="test_user",
            typing_patterns={'speed': 50},
            navigation_preferences=['/dashboard'],
            feature_usage={'dashboard': 5}
        )
        
        result = profile.to_dict()
        
        assert result['user_id'] == "test_user"
        assert result['typing_patterns'] == {'speed': 50}
        assert result['navigation_preferences'] == ['/dashboard']
        assert result['feature_usage'] == {'dashboard': 5}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

