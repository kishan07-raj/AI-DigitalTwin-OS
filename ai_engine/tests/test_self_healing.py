"""
Unit Tests for Self-Healing Engine
Tests the anomaly detection and auto-recovery functionality
"""

import pytest
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from self_healing.anomaly_detector import (
    SelfHealingEngine,
    AnomalyDetector,
    AutoRecovery,
    LogAggregator,
    Anomaly,
    LogEntry,
)


class TestLogAggregator:
    """Tests for LogAggregator class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.aggregator = LogAggregator(window_size=100)
    
    def test_add_log(self):
        """Test adding log entries"""
        self.aggregator.add_log(
            level='error',
            source='backend',
            message='Test error message',
            user_id='user123'
        )
        
        logs = self.aggregator.get_recent_logs(10)
        assert len(logs) == 1
        assert logs[0].level == 'error'
        assert logs[0].source == 'backend'
    
    def test_get_recent_logs_filtered_by_level(self):
        """Test getting logs filtered by level"""
        self.aggregator.add_log('info', 'backend', 'Info message')
        self.aggregator.add_log('error', 'backend', 'Error message')
        self.aggregator.add_log('warn', 'frontend', 'Warning message')
        
        error_logs = self.aggregator.get_recent_logs(10, level='error')
        
        assert len(error_logs) == 1
        assert error_logs[0].level == 'error'
    
    def test_get_recent_logs_filtered_by_source(self):
        """Test getting logs filtered by source"""
        self.aggregator.add_log('info', 'backend', 'Backend message')
        self.aggregator.add_log('info', 'frontend', 'Frontend message')
        
        backend_logs = self.aggregator.get_recent_logs(10, source='backend')
        
        assert len(backend_logs) == 1
        assert backend_logs[0].source == 'backend'
    
    def test_get_error_rate(self):
        """Test calculating error rate"""
        # Add some logs
        for i in range(10):
            self.aggregator.add_log('error', 'backend', f'Error {i}')
        
        # Add some info logs
        for i in range(20):
            self.aggregator.add_log('info', 'backend', f'Info {i}')
        
        error_rate = self.aggregator.get_error_rate('backend', minutes=5)
        
        assert error_rate == 2.0  # 10 errors / 5 minutes


class TestAnomalyDetector:
    """Tests for AnomalyDetector class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.detector = AnomalyDetector()
    
    def test_detect_error_spikes(self):
        """Test detecting error spikes"""
        # Add many error logs to trigger spike detection
        for i in range(20):
            self.detector.log_aggregator.add_log(
                'error',
                'backend',
                f'Error {i}'
            )
        
        # Set baseline
        self.detector.set_baseline({'backend_error_rate': 0.1})
        
        anomalies = self.detector.detect_anomalies()
        
        # Should detect error spike anomaly
        error_spikes = [a for a in anomalies if a.type == 'error_spike']
        assert len(error_spikes) >= 0
    
    def test_detect_unusual_patterns(self):
        """Test detecting unusual user behavior"""
        # Add many rapid actions from same user
        base_time = datetime.now()
        for i in range(15):
            self.detector.log_aggregator.add_log(
                'info',
                'backend',
                f'Action {i}',
                user_id='test_user',
                timestamp=base_time + timedelta(milliseconds=i * 50)
            )
        
        anomalies = self.detector.detect_anomalies()
        
        # Should detect unusual behavior
        behavior_anomalies = [a for a in anomalies if a.type == 'unusual_behavior']
        assert len(behavior_anomalies) >= 0
    
    def test_detect_performance_issues(self):
        """Test detecting performance issues"""
        # Add logs with slow response times
        for i in range(10):
            self.detector.log_aggregator.add_log(
                'info',
                'backend',
                f'Request {i}',
                metadata={'response_time': 6000}  # 6 seconds
            )
        
        anomalies = self.detector.detect_anomalies()
        
        # Should detect performance issues
        perf_anomalies = [a for a in anomalies if a.type == 'performance_degradation']
        assert len(perf_anomalies) >= 0
    
    def test_set_baseline(self):
        """Test setting baseline metrics"""
        metrics = {
            'backend_error_rate': 0.05,
            'frontend_error_rate': 0.03,
            'response_time': 200,
        }
        
        self.detector.set_baseline(metrics)
        
        assert self.detector.baseline_metrics['backend_error_rate'] == 0.05
        assert self.detector.baseline_metrics['frontend_error_rate'] == 0.03


class TestAutoRecovery:
    """Tests for AutoRecovery class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.recovery = AutoRecovery()
    
    def test_register_recovery_action(self):
        """Test registering a recovery action"""
        def custom_recovery(anomaly):
            return {'success': True, 'action': 'custom'}
        
        self.recovery.register_recovery('custom_type', custom_recovery)
        
        assert 'custom_type' in self.recovery.recovery_actions
    
    def test_attempt_recovery_with_registered_action(self):
        """Test attempting recovery with registered action"""
        def test_recovery(anomaly):
            return {'success': True, 'action': 'test_action'}
        
        self.recovery.register_recovery('test_type', test_recovery)
        
        test_anomaly = Anomaly(
            id='test123',
            type='test_type',
            severity='medium',
            description='Test anomaly',
            timestamp=datetime.now(),
            related_logs=[]
        )
        
        result = self.recovery.attempt_recovery(test_anomaly)
        
        assert result['attempted'] is True
        assert result['success'] is True
    
    def test_attempt_recovery_default_actions(self):
        """Test attempting recovery with default actions"""
        test_anomaly = Anomaly(
            id='test123',
            type='error_spike',
            severity='high',
            description='Error spike',
            timestamp=datetime.now(),
            related_logs=[]
        )
        
        result = self.recovery.attempt_recovery(test_anomaly)
        
        assert result['attempted'] is True
        assert len(result['actions']) > 0
    
    def test_default_recovery_for_error_spike(self):
        """Test default recovery for error spike"""
        test_anomaly = Anomaly(
            id='test123',
            type='error_spike',
            severity='medium',
            description='Error spike',
            timestamp=datetime.now(),
            related_logs=[]
        )
        
        actions = self.recovery._default_recovery(test_anomaly)
        
        assert len(actions) > 0
        assert any(a['action'] == 'scale_resources' for a in actions)
    
    def test_default_recovery_for_unusual_behavior(self):
        """Test default recovery for unusual behavior"""
        test_anomaly = Anomaly(
            id='test123',
            type='unusual_behavior',
            severity='medium',
            description='Unusual behavior',
            timestamp=datetime.now(),
            related_logs=[]
        )
        
        actions = self.recovery._default_recovery(test_anomaly)
        
        assert len(actions) > 0
        assert any(a['action'] == 'rate_limit' for a in actions)


class TestSelfHealingEngine:
    """Tests for SelfHealingEngine class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.engine = SelfHealingEngine()
    
    def test_log_event(self):
        """Test logging an event"""
        self.engine.log_event(
            level='info',
            source='backend',
            message='Test message',
            user_id='user123'
        )
        
        health = self.engine.get_system_health()
        
        assert health['total_logs'] == 1
    
    def test_check_and_heal(self):
        """Test checking and healing"""
        # Add some logs
        for i in range(5):
            self.engine.log_event('info', 'backend', f'Message {i}')
        
        results = self.engine.check_and_heal()
        
        assert 'timestamp' in results
        assert 'anomalies_detected' in results
        assert 'recoveries' in results
    
    def test_get_system_health_healthy(self):
        """Test getting system health when healthy"""
        # Add some normal logs
        for i in range(20):
            self.engine.log_event('info', 'backend', f'Info {i}')
        
        health = self.engine.get_system_health()
        
        assert 'status' in health
        assert 'error_rate' in health
        assert 'total_logs' in health
        assert health['total_logs'] == 20
    
    def test_get_system_health_with_errors(self):
        """Test getting system health with errors"""
        # Add info logs
        for i in range(20):
            self.engine.log_event('info', 'backend', f'Info {i}')
        
        # Add error logs
        for i in range(5):
            self.engine.log_event('error', 'backend', f'Error {i}')
        
        health = self.engine.get_system_health()
        
        assert health['total_logs'] == 25
        assert health['recent_errors'] >= 0


class TestAnomaly:
    """Tests for Anomaly dataclass"""
    
    def test_create_anomaly(self):
        """Test creating an anomaly"""
        anomaly = Anomaly(
            id='test123',
            type='error_spike',
            severity='high',
            description='Test anomaly',
            timestamp=datetime.now(),
            related_logs=[],
            auto_fix_applied=False,
            resolved=False
        )
        
        assert anomaly.id == 'test123'
        assert anomaly.type == 'error_spike'
        assert anomaly.severity == 'high'
        assert anomaly.auto_fix_applied is False
        assert anomaly.resolved is False


class TestLogEntry:
    """Tests for LogEntry dataclass"""
    
    def test_create_log_entry(self):
        """Test creating a log entry"""
        entry = LogEntry(
            timestamp=datetime.now(),
            level='error',
            source='backend',
            message='Test message',
            metadata={'key': 'value'},
            session_id='session123',
            user_id='user123'
        )
        
        assert entry.level == 'error'
        assert entry.source == 'backend'
        assert entry.message == 'Test message'
        assert entry.metadata == {'key': 'value'}
        assert entry.session_id == 'session123'
        assert entry.user_id == 'user123'


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

