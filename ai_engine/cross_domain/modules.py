"""
Cross-Domain Intelligence - Specialized AI Modules
Phase 6: Cross-Domain Intelligence

Modular AI services for healthcare, finance, education, and custom domains.
"""

import numpy as np
from typing import Dict, List, Any, Optional, Literal
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
import json
import random


# Base Module Interface
class DomainModule(ABC):
    """Base class for all domain modules"""
    
    @abstractmethod
    def process(self, data: Dict) -> Dict:
        """Process data for this domain"""
        pass
    
    @abstractmethod
    def get_insights(self) -> List[Dict]:
        """Get domain-specific insights"""
        pass


# Healthcare Module
@dataclass
class HealthMetrics:
    """Health-related metrics"""
    heart_rate: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    steps: Optional[int] = None
    sleep_hours: Optional[float] = None
    calories_burned: Optional[float] = None
    water_intake: Optional[float] = None


class HealthModule(DomainModule):
    """Healthcare domain module"""
    
    def __init__(self):
        self.health_history: List[HealthMetrics] = []
        self.alerts: List[Dict] = []
        self.recommendations: List[str] = []
        
    def process(self, data: Dict) -> Dict:
        """Process health data"""
        metrics = HealthMetrics(
            heart_rate=data.get('heart_rate'),
            blood_pressure_systolic=data.get('blood_pressure_systolic'),
            blood_pressure_diastolic=data.get('blood_pressure_diastolic'),
            steps=data.get('steps'),
            sleep_hours=data.get('sleep_hours'),
            calories_burned=data.get('calories_burned'),
            water_intake=data.get('water_intake')
        )
        
        self.health_history.append(metrics)
        
        # Keep only last 1000 entries
        if len(self.health_history) > 1000:
            self.health_history = self.health_history[-1000:]
        
        # Generate analysis
        analysis = self._analyze_metrics(metrics)
        
        # Check for alerts
        self._check_alerts(metrics)
        
        # Generate recommendations
        self._generate_recommendations(metrics)
        
        return analysis
    
    def _analyze_metrics(self, metrics: HealthMetrics) -> Dict:
        """Analyze health metrics"""
        analysis = {
            'timestamp': datetime.now().isoformat(),
            'metrics': {},
            'status': 'normal',
            'scores': {}
        }
        
        # Heart rate analysis
        if metrics.heart_rate:
            if metrics.heart_rate < 60:
                analysis['metrics']['heart_rate'] = 'low'
                analysis['scores']['heart_rate'] = 0.3
            elif metrics.heart_rate > 100:
                analysis['metrics']['heart_rate'] = 'high'
                analysis['scores']['heart_rate'] = 0.3
            else:
                analysis['metrics']['heart_rate'] = 'normal'
                analysis['scores']['heart_rate'] = 1.0
        
        # Blood pressure analysis
        if metrics.blood_pressure_systolic and metrics.blood_pressure_diastolic:
            bp_status = 'normal'
            bp_score = 1.0
            
            if metrics.blood_pressure_systolic > 140 or metrics.blood_pressure_diastolic > 90:
                bp_status = 'high'
                bp_score = 0.3
            elif metrics.blood_pressure_systolic < 90 or metrics.blood_pressure_diastolic < 60:
                bp_status = 'low'
                bp_score = 0.5
            
            analysis['metrics']['blood_pressure'] = bp_status
            analysis['scores']['blood_pressure'] = bp_score
        
        # Activity analysis
        if metrics.steps:
            if metrics.steps >= 10000:
                analysis['metrics']['activity'] = 'excellent'
                analysis['scores']['activity'] = 1.0
            elif metrics.steps >= 5000:
                analysis['metrics']['activity'] = 'good'
                analysis['scores']['activity'] = 0.8
            elif metrics.steps >= 2500:
                analysis['metrics']['activity'] = 'moderate'
                analysis['scores']['activity'] = 0.6
            else:
                analysis['metrics']['activity'] = 'low'
                analysis['scores']['activity'] = 0.4
        
        # Sleep analysis
        if metrics.sleep_hours:
            if 7 <= metrics.sleep_hours <= 9:
                analysis['metrics']['sleep'] = 'optimal'
                analysis['scores']['sleep'] = 1.0
            elif 6 <= metrics.sleep_hours < 7 or 9 < metrics.sleep_hours <= 10:
                analysis['metrics']['sleep'] = 'good'
                analysis['scores']['sleep'] = 0.8
            else:
                analysis['metrics']['sleep'] = 'insufficient'
                analysis['scores']['sleep'] = 0.5
        
        # Overall health score
        if analysis['scores']:
            analysis['overall_score'] = np.mean(list(analysis['scores'].values()))
        
        return analysis
    
    def _check_alerts(self, metrics: HealthMetrics) -> None:
        """Check for health alerts"""
        if metrics.heart_rate and (metrics.heart_rate > 150 or metrics.heart_rate < 40):
            self.alerts.append({
                'type': 'critical',
                'message': f'Abnormal heart rate: {metrics.heart_rate} bpm',
                'timestamp': datetime.now().isoformat()
            })
        
        if metrics.blood_pressure_systolic and metrics.blood_pressure_systolic > 180:
            self.alerts.append({
                'type': 'critical',
                'message': 'Hypertensive crisis detected',
                'timestamp': datetime.now().isoformat()
            })
    
    def _generate_recommendations(self, metrics: HealthMetrics) -> None:
        """Generate health recommendations"""
        self.recommendations = []
        
        if metrics.steps and metrics.steps < 5000:
            self.recommendations.append('Aim for at least 5,000 steps daily')
        
        if metrics.sleep_hours and metrics.sleep_hours < 7:
            self.recommendations.append('Try to get 7-9 hours of sleep')
        
        if metrics.water_intake and metrics.water_intake < 8:
            self.recommendations.append('Increase water intake to at least 8 glasses')
        
        if metrics.heart_rate and metrics.heart_rate > 100:
            self.recommendations.append('Consider stress reduction techniques')
    
    def get_insights(self) -> List[Dict]:
        """Get health insights"""
        if not self.health_history:
            return []
        
        # Calculate trends
        recent = self.health_history[-7:]
        
        insights = []
        
        # Activity trend
        if recent[-1].steps:
            avg_steps = np.mean([m.steps for m in recent if m.steps])
            if avg_steps > 8000:
                insights.append({
                    'type': 'positive',
                    'title': 'Active Lifestyle',
                    'description': f'Your average of {avg_steps:.0f} steps shows great activity level'
                })
        
        # Sleep trend
        if recent[-1].sleep_hours:
            avg_sleep = np.mean([m.sleep_hours for m in recent if m.sleep_hours])
            if avg_sleep < 6:
                insights.append({
                    'type': 'warning',
                    'title': 'Sleep Deprivation',
                    'description': f'Average {avg_sleep:.1f} hours - below recommended 7-9 hours'
                })
        
        return insights


# Finance Module
@dataclass
class FinancialRecord:
    """Financial transaction record"""
    amount: float
    category: str
    type: Literal['income', 'expense']
    date: datetime


class FinanceModule(DomainModule):
    """Finance domain module"""
    
    def __init__(self):
        self.transactions: List[FinancialRecord] = []
        self.budgets: Dict[str, float] = {}
        self.savings_goals: List[Dict] = []
        
    def process(self, data: Dict) -> Dict:
        """Process financial data"""
        transaction = FinancialRecord(
            amount=data['amount'],
            category=data.get('category', 'other'),
            type=data.get('type', 'expense'),
            date=datetime.now()
        )
        
        self.transactions.append(transaction)
        
        # Keep only last 1000
        if len(self.transactions) > 1000:
            self.transactions = self.transactions[-1000:]
        
        return self._analyze_finances()
    
    def _analyze_finances(self) -> Dict:
        """Analyze financial status"""
        analysis = {
            'timestamp': datetime.now().isoformat(),
            'balance': 0.0,
            'income': 0.0,
            'expenses': 0.0,
            'savings_rate': 0.0,
            'category_breakdown': {},
            'budget_status': {}
        }
        
        for t in self.transactions:
            if t.type == 'income':
                analysis['income'] += t.amount
            else:
                analysis['expenses'] += t.amount
                analysis['category_breakdown'][t.category] = \
                    analysis['category_breakdown'].get(t.category, 0) + t.amount
        
        analysis['balance'] = analysis['income'] - analysis['expenses']
        
        if analysis['income'] > 0:
            analysis['savings_rate'] = (
                (analysis['income'] - analysis['expenses']) / analysis['income']
            ) * 100
        
        # Budget status
        for category, budget in self.budgets.items():
            spent = analysis['category_breakdown'].get(category, 0)
            analysis['budget_status'][category] = {
                'budget': budget,
                'spent': spent,
                'remaining': budget - spent,
                'percentage': (spent / budget * 100) if budget > 0 else 0
            }
        
        return analysis
    
    def set_budget(self, category: str, amount: float) -> None:
        """Set budget for category"""
        self.budgets[category] = amount
    
    def add_savings_goal(self, name: str, target: float, deadline: str) -> None:
        """Add savings goal"""
        self.savings_goals.append({
            'name': name,
            'target': target,
            'deadline': deadline,
            'current': 0.0
        })
    
    def get_insights(self) -> List[Dict]:
        """Get financial insights"""
        insights = []
        
        if len(self.transactions) < 5:
            return insights
        
        analysis = self._analyze_finances()
        
        # Savings rate
        if analysis['savings_rate'] > 20:
            insights.append({
                'type': 'positive',
                'title': 'Great Savings Rate',
                'description': f'You are saving {analysis["savings_rate"]:.1f}% of income'
            })
        elif analysis['savings_rate'] < 0:
            insights.append({
                'type': 'warning',
                'title': 'Negative Savings',
                'description': 'You are spending more than you earn'
            })
        
        # Budget alerts
        for category, status in analysis['budget_status'].items():
            if status['percentage'] > 100:
                insights.append({
                    'type': 'warning',
                    'title': f'Over Budget: {category}',
                    'description': f'{status["percentage"]:.0f}% of {category} budget used'
                })
        
        # Top expense category
        if analysis['category_breakdown']:
            top_category = max(
                analysis['category_breakdown'].items(),
                key=lambda x: x[1]
            )
            insights.append({
                'type': 'info',
                'title': 'Top Expense',
                'description': f'Highest spending in {top_category[0]}: ${top_category[1]:.2f}'
            })
        
        return insights


# Education Module
@dataclass
class LearningProgress:
    """User learning progress"""
    course_id: str
    module_id: str
    score: float
    time_spent: float  # minutes
    completed: bool


class EducationModule(DomainModule):
    """Education domain module"""
    
    def __init__(self):
        self.courses: Dict[str, Dict] = {}
        self.progress: List[LearningProgress] = []
        self.assessments: List[Dict] = []
        
    def process(self, data: Dict) -> Dict:
        """Process learning data"""
        progress = LearningProgress(
            course_id=data['course_id'],
            module_id=data.get('module_id', ''),
            score=data.get('score', 0),
            time_spent=data.get('time_spent', 0),
            completed=data.get('completed', False)
        )
        
        self.progress.append(progress)
        
        # Update course stats
        if progress.course_id not in self.courses:
            self.courses[progress.course_id] = {
                'name': data.get('course_name', 'Unknown Course'),
                'modules': 0,
                'completed': 0,
                'total_time': 0,
                'avg_score': 0
            }
        
        course = self.courses[progress.course_id]
        if progress.completed:
            course['completed'] += 1
        course['total_time'] += progress.time_spent
        
        # Calculate average score
        course_progress = [p for p in self.progress if p.course_id == progress.course_id]
        course['avg_score'] = np.mean([p.score for p in course_progress])
        
        return self._analyze_progress(progress.course_id)
    
    def _analyze_progress(self, course_id: str) -> Dict:
        """Analyze learning progress"""
        if course_id not in self.courses:
            return {}
        
        course = self.courses[course_id]
        course_progress = [p for p in self.progress if p.course_id == course_id]
        
        return {
            'course_id': course_id,
            'course_name': course['name'],
            'modules_completed': course['completed'],
            'total_time_minutes': course['total_time'],
            'average_score': course['avg_score'],
            'recent_scores': [p.score for p in course_progress[-5:]],
            'completion_percentage': (course['completed'] / max(course['modules'], 1)) * 100
        }
    
    def add_course(self, course_id: str, name: str, modules: int) -> None:
        """Add a new course"""
        self.courses[course_id] = {
            'name': name,
            'modules': modules,
            'completed': 0,
            'total_time': 0,
            'avg_score': 0
        }
    
    def get_insights(self) -> List[Dict]:
        """Get education insights"""
        insights = []
        
        if not self.courses:
            return insights
        
        # Find most completed course
        for course_id, course in self.courses.items():
            if course['completed'] > 0:
                completion = (course['completed'] / max(course['modules'], 1)) * 100
                
                if completion >= 100:
                    insights.append({
                        'type': 'positive',
                        'title': 'Course Completed!',
                        'description': f"You've completed {course['name']}"
                    })
                elif completion >= 50:
                    insights.append({
                        'type': 'info',
                        'title': 'Halfway There',
                        'description': f'{completion:.0f}% through {course["name"]}'
                    })
        
        # Study time analysis
        recent_progress = [p for p in self.progress if p.time_spent > 0]
        if recent_progress:
            avg_time = np.mean([p.time_spent for p in recent_progress])
            if avg_time > 30:
                insights.append({
                    'type': 'positive',
                    'title': 'Dedicated Learner',
                    'description': f'Average {avg_time:.0f} minutes per session'
                })
        
        return insights


# Cross-Domain Manager
class CrossDomainManager:
    """Manages all domain modules"""
    
    def __init__(self):
        self.modules: Dict[str, DomainModule] = {}
        self._register_default_modules()
        
    def _register_default_modules(self) -> None:
        """Register default domain modules"""
        self.modules['healthcare'] = HealthModule()
        self.modules['finance'] = FinanceModule()
        self.modules['education'] = EducationModule()
    
    def register_module(self, name: str, module: DomainModule) -> None:
        """Register a new domain module"""
        self.modules[name] = module
    
    def process(self, domain: str, data: Dict) -> Optional[Dict]:
        """Process data for a specific domain"""
        if domain not in self.modules:
            return None
        return self.modules[domain].process(data)
    
    def get_insights(self, domain: str) -> List[Dict]:
        """Get insights for a domain"""
        if domain not in self.modules:
            return []
        return self.modules[domain].get_insights()
    
    def get_all_insights(self) -> Dict[str, List[Dict]]:
        """Get insights from all domains"""
        return {domain: module.get_insights() 
                for domain, module in self.modules.items()}
    
    def get_module(self, domain: str) -> Optional[DomainModule]:
        """Get a specific module"""
        return self.modules.get(domain)


# Export for FastAPI
def create_cross_domain_routes(app):
    """Create FastAPI routes for Cross-Domain service"""
    from fastapi import APIRouter
    
    router = APIRouter()
    manager = CrossDomainManager()
    
    @router.post("/{domain}")
    async def process_domain(domain: str, data: Dict):
        """Process data for a domain"""
        result = manager.process(domain, data)
        if result is None:
            return {"success": False, "error": "Domain not found"}
        return {"success": True, "result": result}
    
    @router.get("/{domain}/insights")
    async def get_domain_insights(domain: str):
        """Get insights for a domain"""
        insights = manager.get_insights(domain)
        return {"success": True, "insights": insights}
    
    @router.get("/insights")
    async def get_all_insights():
        """Get insights from all domains"""
        insights = manager.get_all_insights()
        return {"success": True, "insights": insights}
    
    @router.get("/domains")
    async def list_domains():
        """List available domains"""
        return {"success": True, "domains": list(manager.modules.keys())}
    
    return router


if __name__ == "__main__":
    # Demo usage
    manager = CrossDomainManager()
    
    # Healthcare demo
    health_data = {
        'heart_rate': 72,
        'blood_pressure_systolic': 120,
        'blood_pressure_diastolic': 80,
        'steps': 8500,
        'sleep_hours': 7.5,
        'water_intake': 8
    }
    health_result = manager.process('healthcare', health_data)
    print("Health Analysis:")
    print(json.dumps(health_result, indent=2))
    
    # Finance demo
    finance_data = [
        {'amount': 5000, 'type': 'income', 'category': 'salary'},
        {'amount': 1500, 'type': 'expense', 'category': 'rent'},
        {'amount': 400, 'type': 'expense', 'category': 'food'},
        {'amount': 200, 'type': 'expense', 'category': 'transport'},
    ]
    for data in finance_data:
        manager.process('finance', data)
    
    finance_result = manager.process('finance', {'amount': 300, 'type': 'expense', 'category': 'entertainment'})
    print("\nFinance Analysis:")
    print(json.dumps(finance_result, indent=2))
    
    # Get all insights
    print("\nAll Insights:")
    all_insights = manager.get_all_insights()
    print(json.dumps(all_insights, indent=2))

