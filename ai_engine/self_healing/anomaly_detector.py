"""
Self-Healing System - Anomaly Detection and Auto-Recovery
Phase 4: Self-Healing System

Detects anomalies in system logs and automatically applies fixes.
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, deque
import json
import hashlib


@dataclass
class LogEntry:
    """System log entry"""
    timestamp: datetime
    level: str  # info, warn, error, critical
    source: str  # backend, frontend, ai_engine, system
    message: str
    metadata: Dict = field(default_factory=dict)
    session_id: Optional[str] = None
    user_id: Optional[str] = None


@dataclass
class Anomaly:
    """Detected anomaly"""
    id: str
    type: str  # error_spike, unusual_behavior, performance_degradation, security
    severity: str  # low, medium, high, critical
    description: str
    timestamp: datetime
    related_logs: List[LogEntry]
    auto_fix_applied: bool = False
    resolved: bool = False


class LogAggregator:
    """Aggregates and processes system logs"""
    
    def __init__(self, window_size: int = 1000):
        self.logs: deque = deque(maxlen=window_size)
        self.error_counts: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        
    def add_log(self, level: str, source: str, message: str, 
                metadata: Dict = None, session_id: str = None, 
                user_id: str = None, timestamp: datetime = None) -> None:
        """Add a log entry"""
        entry = LogEntry(
            timestamp=timestamp or datetime.now(),
            level=level,
            source=source,
            message=message,
            metadata=metadata or {},
            session_id=session_id,
            user_id=user_id
        )
        
        self.logs.append(entry)
        
        # Track error counts by source
        if level in ['error', 'critical']:
            key = f"{source}_{level}"
            self.error_counts[key].append(entry.timestamp)
    
    def get_recent_logs(self, limit: int = 100, level: str = None, 
                       source: str = None) -> List[LogEntry]:
        """Get recent logs with optional filtering"""
        logs = list(self.logs)
        
        if level:
            logs = [l for l in logs if l.level == level]
        if source:
            logs = [l for l in logs if l.source == source]
        
        return logs[-limit:]
    
    def get_error_rate(self, source: str = None, minutes: int = 5) -> float:
        """Calculate error rate per minute"""
        cutoff = datetime.now() - timedelta(minutes=minutes)
        
        errors = [l for l in self.logs 
                 if l.level in ['error', 'critical'] 
                 and l.timestamp > cutoff]
        
        if source:
            errors = [e for e in errors if e.source == source]
        
        return len(errors) / minutes


class AnomalyDetector:
    """Detects anomalies in system behavior"""
    
    def __init__(self):
        self.log_aggregator = LogAggregator()
        self.baseline_metrics: Dict[str, Any] = {}
        self.anomaly_history: List[Anomaly] = []
        
    def detect_anomalies(self) -> List[Anomaly]:
        """Detect all types of anomalies"""
        anomalies = []
        
        # Check for error spikes
        error_anomalies = self._detect_error_spikes()
        anomalies.extend(error_anomalies)
        
        # Check for unusual patterns
        pattern_anomalies = self._detect_unusual_patterns()
        anomalies.extend(pattern_anomalies)
        
        # Check for performance issues
        performance_anomalies = self._detect_performance_issues()
        anomalies.extend(performance_anomalies)
        
        # Add to history
        self.anomaly_history.extend(anomalies)
        
        return anomalies
    
    def _detect_error_spikes(self) -> List[Anomaly]:
        """Detect spikes in error rates"""
        anomalies = []
        
        for source in ['backend', 'frontend', 'ai_engine']:
            error_rate = self.log_aggregator.get_error_rate(source, minutes=5)
            baseline = self.baseline_metrics.get(f'{source}_error_rate', 0.1)
            
            # If error rate is 3x baseline, it's an anomaly
            if error_rate > baseline * 3 and error_rate > 0.5:
                related_logs = self.log_aggregator.get_recent_logs(10, source=source)
                
                anomaly = Anomaly(
                    id=hashlib.md5(f"{source}_{datetime.now()}".encode()).hexdigest()[:8],
                    type='error_spike',
                    severity='high' if error_rate > baseline * 5 else 'medium',
                    description=f"Error spike detected in {source}: {error_rate:.2f} errors/min vs baseline {baseline:.2f}",
                    timestamp=datetime.now(),
                    related_logs=related_logs
                )
                anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_unusual_patterns(self) -> List[Anomaly]:
        """Detect unusual user behavior patterns"""
        anomalies = []
        
        recent_logs = self.log_aggregator.get_recent_logs(50)
        
        # Check for rapid repeated actions (possible bot)
        user_actions = defaultdict(list)
        for log in recent_logs:
            if log.user_id:
                user_actions[log.user_id].append(log.timestamp)
        
        for user_id, timestamps in user_actions.items():
            if len(timestamps) > 10:
                # Check if actions are too close together
                intervals = [(timestamps[i] - timestamps[i-1]).total_seconds() 
                           for i in range(1, len(timestamps))]
                avg_interval = np.mean(intervals)
                
                if avg_interval < 0.1:  # Less than 100ms between actions
                    anomaly = Anomaly(
                        id=hashlib.md5(f"unusual_{user_id}_{datetime.now()}".encode()).hexdigest()[:8],
                        type='unusual_behavior',
                        severity='medium',
                        description=f"Unusual rapid actions from user {user_id}",
                        timestamp=datetime.now(),
                        related_logs=[l for l in recent_logs if l.user_id == user_id]
                    )
                    anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_performance_issues(self) -> List[Anomaly]:
        """Detect performance degradation"""
        anomalies = []
        
        recent_logs = self.log_aggregator.get_recent_logs(100)
        
        # Look for slow response patterns in metadata
        slow_requests = [l for l in recent_logs 
                        if l.metadata.get('response_time', 0) > 5000]
        
        if len(slow_requests) > 5:
            anomaly = Anomaly(
                id=hashlib.md5(f"perf_{datetime.now()}".encode()).hexdigest()[:8],
                type='performance_degradation',
                severity='medium',
                description=f"Multiple slow requests detected: {len(slow_requests)} requests > 5s",
                timestamp=datetime.now(),
                related_logs=slow_requests[:10]
            )
            anomalies.append(anomaly)
        
        return anomalies
    
    def set_baseline(self, metrics: Dict[str, float]) -> None:
        """Set baseline metrics for comparison"""
        self.baseline_metrics.update(metrics)


class AutoRecovery:
    """Automatic recovery from detected issues"""
    
    def __init__(self):
        self.recovery_actions: Dict[str, callable] = {}
        self.recovery_history: List[Dict] = []
        
    def register_recovery(self, issue_type: str, action: callable) -> None:
        """Register a recovery action for an issue type"""
        self.recovery_actions[issue_type] = action
    
    def attempt_recovery(self, anomaly: Anomaly) -> Dict[str, Any]:
        """Attempt to recover from an anomaly"""
        recovery_result = {
            'anomaly_id': anomaly.id,
            'type': anomaly.type,
            'attempted': False,
            'success': False,
            'actions': []
        }
        
        # Find matching recovery action
        if anomaly.type in self.recovery_actions:
            recovery_result['attempted'] = True
            
            try:
                action = self.recovery_actions[anomaly.type]
                result = action(anomaly)
                recovery_result['success'] = result.get('success', True)
                recovery_result['actions'].append(result)
            except Exception as e:
                recovery_result['actions'].append({'error': str(e)})
        
        # Default recovery actions based on type
        if not recovery_result['attempted']:
            recovery_result['actions'] = self._default_recovery(anomaly)
            recovery_result['attempted'] = len(recovery_result['actions']) > 0
            recovery_result['success'] = recovery_result['attempted']
        
        self.recovery_history.append(recovery_result)
        
        return recovery_result
    
    def _default_recovery(self, anomaly: Anomaly) -> List[Dict]:
        """Apply default recovery actions based on anomaly type"""
        actions = []
        
        if anomaly.type == 'error_spike':
            actions.append({
                'action': 'scale_resources',
                'description': 'Scaling up resources to handle load'
            })
            actions.append({
                'action': 'clear_cache',
                'description': 'Clearing cache to free memory'
            })
        
        elif anomaly.type == 'unusual_behavior':
            actions.append({
                'action': 'rate_limit',
                'description': 'Applying rate limiting to affected user'
            })
        
        elif anomaly.type == 'performance_degradation':
            actions.append({
                'action': 'restart_service',
                'description': 'Initiating service restart'
            })
        
        return actions


class SelfHealingEngine:
    """Main self-healing engine"""
    
    def __init__(self):
        self.detector = AnomalyDetector()
        self.recovery = AutoRecovery()
        self._register_default_recoveries()
        
    def _register_default_recoveries(self):
        """Register default recovery actions"""
        self.recovery.register_recovery('error_spike', self._recover_from_spike)
        self.recovery.register_recovery('unusual_behavior', self._recover_from_behavior)
        
    def _recover_from_spike(self, anomaly: Anomaly) -> Dict:
        """Recovery from error spike"""
        # In production, this would trigger actual scaling
        return {
            'success': True,
            'action': 'scaled_resources',
            'details': 'Scaled up resources to handle error spike'
        }
    
    def _recover_from_behavior(self, anomaly: Anomaly) -> Dict:
        """Recovery from unusual behavior"""
        return {
            'success': True,
            'action': 'applied_rate_limit',
            'details': 'Applied rate limiting'
        }
    
    def log_event(self, level: str, source: str, message: str, 
                 metadata: Dict = None, session_id: str = None,
                 user_id: str = None) -> None:
        """Log an event"""
        self.detector.log_aggregator.add_log(level, source, message, 
                                             metadata, session_id, user_id)
    
    def check_and_heal(self) -> Dict[str, Any]:
        """Check for anomalies and attempt healing"""
        anomalies = self.detector.detect_anomalies()
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'anomalies_detected': len(anomalies),
            'anomalies': [],
            'recoveries': []
        }
        
        for anomaly in anomalies:
            results['anomalies'].append({
                'id': anomaly.id,
                'type': anomaly.type,
                'severity': anomaly.severity,
                'description': anomaly.description
            })
            
            # Attempt recovery
            recovery = self.recovery.attempt_recovery(anomaly)
            results['recoveries'].append(recovery)
            
            if recovery['success']:
                anomaly.auto_fix_applied = True
                anomaly.resolved = True
        
        return results
    
    def get_system_health(self) -> Dict:
        """Get current system health status"""
        logs = self.detector.log_aggregator
        
        return {
            'status': 'healthy',
            'error_rate': logs.get_error_rate('backend', 5),
            'total_logs': len(logs.logs),
            'recent_errors': len([l for l in logs.get_recent_logs(50) 
                                if l.level in ['error', 'critical']]),
            'active_anomalies': len([a for a in self.detector.anomaly_history 
                                   if not a.resolved])
        }


# Export for FastAPI
def create_self_healing_routes(app):
    """Create FastAPI routes for Self-Healing service"""
    from fastapi import APIRouter
    
    router = APIRouter()
    engine = SelfHealingEngine()
    
    @router.post("/log")
    async def log_event(data: Dict):
        """Log an event"""
        engine.log_event(
            level=data.get('level', 'info'),
            source=data.get('source', 'system'),
            message=data.get('message', ''),
            metadata=data.get('metadata', {}),
            session_id=data.get('sessionId'),
            user_id=data.get('userId')
        )
        return {"success": True}
    
    @router.get("/health")
    async def get_health():
        """Get system health"""
        health = engine.get_system_health()
        return {"success": True, "health": health}
    
    @router.post("/check")
    async def check_and_heal():
        """Check for anomalies and heal"""
        results = engine.check_and_heal()
        return {"success": True, "results": results}
    
    return router


if __name__ == "__main__":
    # Demo usage
    engine = SelfHealingEngine()
    
    # Simulate some log events
    for i in range(20):
        engine.log_event(
            level='info',
            source='backend',
            message=f'Request {i} processed'
        )
    
    # Add some errors
    for i in range(8):
        engine.log_event(
            level='error',
            source='backend',
            message=f'Error processing request {i}',
            metadata={'request_id': f'req_{i}'}
        )
    
    # Check health
    health = engine.get_system_health()
    print("System Health:")
    print(json.dumps(health, indent=2))
    
    # Check and heal
    results = engine.check_and_heal()
    print("\nCheck and Heal Results:")
    print(json.dumps(results, indent=2))

