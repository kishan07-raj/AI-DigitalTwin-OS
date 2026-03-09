"""
Self-Evolution Engine - Meta-Learning and Continuous Improvement
Phase 5: Self-Evolution Engine

Implements meta-learning pipelines and genetic algorithms for continuous improvement.
"""

import numpy as np
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from dataclasses import dataclass, field
from collections import defaultdict
import json
import random
import copy


@dataclass
class ModelVersion:
    """Version information for a model"""
    version: str
    created_at: datetime
    metrics: Dict[str, float]
    parameters: Dict[str, Any]
    parent_version: Optional[str] = None
    is_active: bool = False


@dataclass
class TrainingResult:
    """Result from a training run"""
    epoch: int
    loss: float
    accuracy: float
    validation_loss: float
    validation_accuracy: float
    timestamp: datetime


class MetaLearningPipeline:
    """Meta-learning pipeline for models that learn how to learn"""
    
    def __init__(self):
        self.task_embeddings: Dict[str, np.ndarray] = {}
        self.model_configs: Dict[str, Dict] = {}
        self.performance_history: List[Dict] = []
        
    def compute_task_embedding(self, task_data: Dict) -> np.ndarray:
        """Compute embedding for a task"""
        # Simplified task embedding based on features
        features = []
        
        # Extract numerical features
        for key, value in task_data.items():
            if isinstance(value, (int, float)):
                features.append(value)
            elif isinstance(value, list):
                features.extend(value[:5])
        
        # Pad or truncate to fixed size
        embedding = np.zeros(20)
        for i, f in enumerate(features[:20]):
            embedding[i] = f
        
        return embedding / (np.linalg.norm(embedding) + 1e-8)
    
    def adapt_model(self, task_embedding: np.ndarray, base_config: Dict) -> Dict:
        """Adapt model configuration based on task embedding"""
        adapted = copy.deepcopy(base_config)
        
        # Adjust learning rate based on embedding
        lr_factor = 1.0 + np.mean(task_embedding[:5]) * 0.5
        adapted['learning_rate'] *= lr_factor
        
        # Adjust batch size based on embedding variance
        variance = np.var(task_embedding[5:10])
        if variance > 0.5:
            adapted['batch_size'] = int(adapted.get('batch_size', 32) * 1.5)
        
        # Adjust regularization
        reg_factor = 1.0 - np.mean(task_embedding[10:15]) * 0.3
        adapted['regularization'] *= reg_factor
        
        return adapted
    
    def meta_train(self, tasks: List[Dict], iterations: int = 100) -> Dict:
        """Meta-train on multiple tasks"""
        results = {
            'iterations': iterations,
            'tasks': len(tasks),
            'improvement': 0.0
        }
        
        # Compute embeddings for all tasks
        embeddings = [self.compute_task_embedding(task) for task in tasks]
        
        # Meta-learning loop (simplified)
        best_config = {'learning_rate': 0.001, 'batch_size': 32, 'regularization': 0.01}
        
        for i in range(iterations):
            # Sample tasks
            sampled_idx = random.sample(range(len(tasks)), min(5, len(tasks)))
            sampled_tasks = [tasks[j] for j in sampled_idx]
            sampled_embeddings = [embeddings[j] for j in sampled_idx]
            
            # Adapt model for each task
            total_loss = 0
            for task, embedding in zip(sampled_tasks, sampled_embeddings):
                adapted_config = self.adapt_model(embedding, best_config)
                # Simulate training loss
                loss = random.uniform(0.1, 0.5) * (1 - i / iterations)
                total_loss += loss
            
            avg_loss = total_loss / len(sampled_tasks)
            
            # Update base configuration
            best_config['learning_rate'] *= (1 - 0.01 * avg_loss)
            
            self.performance_history.append({
                'iteration': i,
                'loss': avg_loss,
                'timestamp': datetime.now().isoformat()
            })
        
        results['improvement'] = 1.0 - (self.performance_history[-1]['loss'] / 
                                         self.performance_history[0]['loss'])
        
        return results


class GeneticAlgorithm:
    """Genetic algorithm for architecture optimization"""
    
    def __init__(self, population_size: int = 20):
        self.population_size = population_size
        self.population: List[Dict] = []
        self.generation = 0
        self.best_fitness = 0
        self.history: List[Dict] = []
        
    def initialize_population(self, param_space: Dict[str, List]) -> None:
        """Initialize random population"""
        self.population = []
        
        for _ in range(self.population_size):
            individual = {}
            for param, values in param_space.items():
                individual[param] = random.choice(values)
            self.population.append(individual)
    
    def evaluate_fitness(self, individual: Dict, task: str = 'default') -> float:
        """Evaluate fitness of an individual"""
        # Simplified fitness function
        fitness = 1.0
        
        # Reward good learning rate
        if 'learning_rate' in individual:
            lr = individual['learning_rate']
            if 0.0001 <= lr <= 0.01:
                fitness *= 1.5
        
        # Reward appropriate batch size
        if 'batch_size' in individual:
            bs = individual['batch_size']
            if 16 <= bs <= 64:
                fitness *= 1.3
        
        # Add randomness for exploration
        fitness *= random.uniform(0.8, 1.2)
        
        return fitness
    
    def selection(self) -> List[Dict]:
        """Select parents for next generation"""
        # Tournament selection
        parents = []
        
        for _ in range(self.population_size):
            tournament = random.sample(self.population, 3)
            winner = max(tournament, key=lambda x: x.get('fitness', 0))
            parents.append(copy.deepcopy(winner))
        
        return parents
    
    def crossover(self, parents: List[Dict]) -> List[Dict]:
        """Crossover parents to create offspring"""
        offspring = []
        
        for i in range(0, len(parents), 2):
            parent1 = parents[i]
            parent2 = parents[(i + 1) % len(parents)]
            
            child1 = {}
            child2 = {}
            
            for key in parent1.keys():
                if random.random() < 0.5:
                    child1[key] = parent1.get(key)
                    child2[key] = parent2.get(key)
                else:
                    child2[key] = parent1.get(key)
                    child1[key] = parent2.get(key)
            
            offspring.extend([child1, child2])
        
        return offspring[:self.population_size]
    
    def mutate(self, population: List[Dict], mutation_rate: float = 0.1,
              param_space: Dict[str, List] = None) -> List[Dict]:
        """Mutate population"""
        for individual in population:
            if random.random() < mutation_rate:
                # Pick a random parameter to mutate
                if param_space:
                    key = random.choice(list(param_space.keys()))
                    individual[key] = random.choice(param_space[key])
        
        return population
    
    def evolve(self, param_space: Dict[str, List], generations: int = 50,
              task: str = 'default') -> Dict:
        """Run genetic algorithm"""
        self.initialize_population(param_space)
        
        for gen in range(generations):
            self.generation = gen
            
            # Evaluate fitness
            for individual in self.population:
                individual['fitness'] = self.evaluate_fitness(individual, task)
            
            # Track best
            best = max(self.population, key=lambda x: x.get('fitness', 0))
            self.best_fitness = max(self.best_fitness, best.get('fitness', 0))
            
            self.history.append({
                'generation': gen,
                'best_fitness': self.best_fitness,
                'avg_fitness': np.mean([x.get('fitness', 0) for x in self.population])
            })
            
            # Selection
            parents = self.selection()
            
            # Crossover
            offspring = self.crossover(parents)
            
            # Mutation
            self.population = self.mutate(offspring, param_space=param_space)
        
        return {
            'generations': generations,
            'best_fitness': self.best_fitness,
            'best_individual': best,
            'history': self.history
        }


class ContinuousTrainingLoop:
    """Continuous training system with feedback integration"""
    
    def __init__(self):
        self.model_versions: List[ModelVersion] = []
        self.feedback_buffer: List[Dict] = []
        self.current_version = "v1.0.0"
        
    def add_feedback(self, prediction_id: str, actual: Any, predicted: Any,
                    user_feedback: str = None) -> None:
        """Add feedback from predictions"""
        self.feedback_buffer.append({
            'prediction_id': prediction_id,
            'actual': actual,
            'predicted': predicted,
            'user_feedback': user_feedback,
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep buffer size limited
        if len(self.feedback_buffer) > 1000:
            self.feedback_buffer = self.feedback_buffer[-1000:]
    
    def compute_metrics(self) -> Dict[str, float]:
        """Compute metrics from feedback"""
        if not self.feedback_buffer:
            return {'accuracy': 0.0, 'error_rate': 1.0}
        
        correct = sum(1 for f in self.feedback_buffer 
                    if f['actual'] == f['predicted'])
        
        total = len(self.feedback_buffer)
        
        return {
            'accuracy': correct / total,
            'error_rate': (total - correct) / total,
            'total_feedback': total,
            'positive_feedback': sum(1 for f in self.feedback_buffer 
                                    if f['user_feedback'] == 'positive'),
            'negative_feedback': sum(1 for f in self.feedback_buffer 
                                   if f['user_feedback'] == 'negative')
        }
    
    def should_retrain(self, threshold: float = 0.1) -> bool:
        """Determine if model should be retrained"""
        metrics = self.compute_metrics()
        
        # Retrain if error rate is above threshold
        if metrics['error_rate'] > threshold:
            return True
        
        # Or if enough new feedback collected
        if len(self.feedback_buffer) > 100:
            return True
        
        return False
    
    def retrain(self, training_data: List[Dict]) -> ModelVersion:
        """Retrain model with new data"""
        # Create new version
        version_num = len(self.model_versions) + 1
        new_version = f"v1.{version_num}.0"
        
        # Simulate training
        metrics = {
            'accuracy': random.uniform(0.85, 0.98),
            'loss': random.uniform(0.01, 0.1),
            'f1_score': random.uniform(0.80, 0.95)
        }
        
        model_version = ModelVersion(
            version=new_version,
            created_at=datetime.now(),
            metrics=metrics,
            parameters={'learning_rate': 0.001, 'epochs': 10},
            parent_version=self.current_version,
            is_active=True
        )
        
        # Deactivate previous version
        for v in self.model_versions:
            v.is_active = False
        
        self.model_versions.append(model_version)
        self.current_version = new_version
        
        # Clear feedback buffer (used for training)
        self.feedback_buffer = []
        
        return model_version
    
    def get_current_metrics(self) -> Dict:
        """Get current model metrics"""
        metrics = self.compute_metrics()
        
        if self.model_versions:
            current = self.model_versions[-1]
            metrics['model_version'] = current.version
            metrics['training_metrics'] = current.metrics
        
        return metrics


class SelfEvolutionEngine:
    """Main self-evolution engine"""
    
    def __init__(self):
        self.meta_learner = MetaLearningPipeline()
        self.gen_algorithm = GeneticAlgorithm()
        self.training_loop = ContinuousTrainingLoop()
        
    def optimize_architecture(self, param_space: Dict[str, List], 
                            generations: int = 50) -> Dict:
        """Optimize model architecture using genetic algorithms"""
        result = self.gen_algorithm.evolve(param_space, generations)
        return result
    
    def meta_learn(self, tasks: List[Dict]) -> Dict:
        """Meta-learn from multiple tasks"""
        result = self.meta_learner.meta_train(tasks)
        return result
    
    def add_feedback(self, prediction_id: str, actual: Any, predicted: Any,
                    user_feedback: str = None) -> None:
        """Add prediction feedback"""
        self.training_loop.add_feedback(prediction_id, actual, predicted, user_feedback)
    
    def check_and_evolve(self, training_data: List[Dict] = None) -> Dict:
        """Check if evolution is needed and apply"""
        result = {
            'should_evolve': False,
            'evolution_type': None,
            'details': {}
        }
        
        # Check if should retrain
        if self.training_loop.should_retrain():
            if training_data:
                new_version = self.training_loop.retrain(training_data)
                result['should_evolve'] = True
                result['evolution_type'] = 'retrain'
                result['details'] = {
                    'new_version': new_version.version,
                    'metrics': new_version.metrics
                }
        
        # Check current metrics
        result['current_metrics'] = self.training_loop.get_current_metrics()
        
        return result
    
    def get_status(self) -> Dict:
        """Get evolution engine status"""
        return {
            'current_version': self.training_loop.current_version,
            'total_versions': len(self.training_loop.model_versions),
            'feedback_buffer_size': len(self.training_loop.feedback_buffer),
            'metrics': self.training_loop.get_current_metrics(),
            'gen_algorithm_best': self.gen_algorithm.best_fitness
        }


# Export for FastAPI
def create_self_evolution_routes(app):
    """Create FastAPI routes for Self-Evolution service"""
    from fastapi import APIRouter
    
    router = APIRouter()
    engine = SelfEvolutionEngine()
    
    @router.post("/feedback")
    async def add_feedback(data: Dict):
        """Add prediction feedback"""
        engine.add_feedback(
            prediction_id=data.get('predictionId'),
            actual=data.get('actual'),
            predicted=data.get('predicted'),
            user_feedback=data.get('feedback')
        )
        return {"success": True}
    
    @router.get("/status")
    async def get_status():
        """Get evolution status"""
        status = engine.get_status()
        return {"success": True, "status": status}
    
    @router.post("/evolve")
    async def evolve(data: Dict = None):
        """Check and evolve"""
        training_data = data.get('trainingData', []) if data else []
        result = engine.check_and_evolve(training_data)
        return {"success": True, "result": result}
    
    @router.post("/optimize")
    async def optimize_architecture(param_space: Dict, generations: int = 50):
        """Optimize architecture"""
        result = engine.optimize_architecture(param_space, generations)
        return {"success": True, "result": result}
    
    return router


if __name__ == "__main__":
    # Demo usage
    engine = SelfEvolutionEngine()
    
    # Add some feedback
    for i in range(50):
        engine.add_feedback(
            prediction_id=f"pred_{i}",
            actual=random.choice(['A', 'B']),
            predicted=random.choice(['A', 'B']),
            user_feedback=random.choice(['positive', 'negative', None])
        )
    
    # Check status
    status = engine.get_status()
    print("Evolution Status:")
    print(json.dumps(status, indent=2))
    
    # Check if should evolve
    result = engine.check_and_evolve()
    print("\nEvolution Result:")
    print(json.dumps(result, indent=2))

