# AI-DigitalTwin-OS

An intelligent operating system that creates a digital twin of each user, enabling adaptive UI/UX, predictive features, self-healing, and self-evolution capabilities.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

AI-DigitalTwin-OS is an innovative intelligent operating system that revolutionizes user experience by creating a comprehensive digital twin for each user. This digital twin learns from user behavior, predicts future actions, adapts the interface accordingly, and continuously evolves to provide a personalized computing experience.

### Key Capabilities

- **Personal Digital Twin**: Creates an AI-powered behavioral profile for each user
- **Adaptive Interface**: UI that evolves based on user preferences and behavior patterns
- **Self-Healing**: Automatic anomaly detection and resolution
- **Self-Evolution**: Continuous learning and improvement through meta-learning
- **Cross-Domain Intelligence**: Specialized modules for various industries

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Adaptive UI/UX** | Personalized interface that adapts to user behavior in real-time |
| **Digital Twin** | AI-powered user behavior modeling and predictions |
| **Self-Healing** | Automatic anomaly detection and resolution |
| **Self-Evolution** | Continuous learning and improvement via meta-learning and reinforcement learning |
| **Cross-Domain Intelligence** | Specialized modules for healthcare, finance, and education |
| **Microservices Architecture** | Docker + Kubernetes ready deployment |
| **Real-time Monitoring** | Prometheus + Grafana integration |

### AI Engine Modules

1. **Digital Twin Engine**
   - User behavior modeling
   - Typing pattern analysis
   - Task automation
   - Auto-scheduling

2. **Adaptive UI Engine**
   - Layout prediction
   - Next page prediction
   - Feature usage prediction
   - Time-based pattern analysis

3. **Self-Healing Engine**
   - Anomaly detection
   - Log aggregation
   - Auto-recovery
   - Performance monitoring

4. **Self-Evolution Engine**
   - Meta-learning pipeline
   - Genetic algorithms
   - Continuous training
   - Model versioning

5. **Cross-Domain Modules**
   - Healthcare module
   - Finance module
   - Education module

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)                        │
│              Adaptive UI/UX Layer • Zustand • Tailwind              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    HTTPS/WebSocket
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                         Backend (Express.js)                          │
│              REST API + WebSocket • MongoDB • JWT Auth               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Routes     │  │ Controllers  │  │   Models     │               │
│  │  - Auth      │  │  - Auth      │  │  - User      │               │
│  │  - Activity │  │  - Activity  │  │  - Activity  │               │
│  │  - AI        │  │  - AI        │  │  - Session   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    REST API / gRPC
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      AI Engine (Python/FastAPI)                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ Digital Twin   │  │ Adaptive UI    │  │ Self-Healing   │        │
│  │ - Behavior     │  │ - Layout       │  │ - Anomaly      │        │
│  │   Modeling    │  │   Prediction   │  │   Detection    │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│  ┌────────────────┐  ┌────────────────┐                            │
│  │ Self-Evolution │  │ Cross-Domain   │                            │
│  │ - Meta-Learning│  │ - Healthcare   │                            │
│  │ - GA           │  │ - Finance      │                            │
│  └────────────────┘  └────────────────┘                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                     Infrastructure Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  MongoDB    │  │   Redis     │  │ Prometheus  │                  │
│  │  Database   │  │   Cache     │  │  Monitoring │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Frontend → Backend API → MongoDB
                ↓                        ↑
           AI Engine ←──────────────────
                ↓
         Digital Twin Model
                ↓
         Predictions → Adaptive UI
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Zustand | 4.x | State management |
| Axios | 1.x | HTTP client |
| Socket.io | 4.x | Real-time communication |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| MongoDB | 7.0+ | Database |
| Mongoose | 8.x | ODM |
| JWT | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| Socket.io | 4.x | Real-time communication |

### AI Engine

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.100+ | Web framework |
| NumPy | 1.24+ | Numerical computing |
| Pandas | 2.0+ | Data processing |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Kubernetes | Orchestration |
| Prometheus | Metrics collection |
| Grafana | Visualization |

---

## Project Structure

```
AI-DigitalTwin-OS/
├── .gitignore                  # Git ignore rules
├── LICENSE                     # MIT License
├── README.md                   # Project documentation
├── TODO.md                     # Implementation progress
│
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Layout.tsx     # Main layout component
│   │   │   └── ...
│   │   ├── pages/             # Next.js pages
│   │   │   ├── _app.tsx       # App wrapper
│   │   │   ├── index.tsx      # Home page
│   │   │   ├── login.tsx      # Login page
│   │   │   ├── register.tsx   # Registration page
│   │   │   └── dashboard/     # Dashboard pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── store/             # Zustand store
│   │   ├── styles/            # CSS styles
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── tailwind.config.js     # Tailwind config
│   └── next.config.js         # Next.js config
│
├── backend/                    # Node.js Express backend
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── activityController.ts
│   │   │   └── predictionController.ts
│   │   ├── middleware/        # Express middleware
│   │   │   └── auth.ts
│   │   ├── models/            # MongoDB schemas
│   │   │   ├── User.ts
│   │   │   ├── Activity.ts
│   │   │   ├── Session.ts
│   │   │   ├── SystemLog.ts
│   │   │   └── AIPrediction.ts
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts
│   │   │   ├── activity.ts
│   │   │   ├── predictions.ts
│   │   │   └── index.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── database.ts
│   │   │   └── jwt.ts
│   │   └── index.ts           # Entry point
│   ├── tests/                 # Backend tests
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── jest.config.js        # Jest config
│
├── ai_engine/                  # Python AI services
│   ├── digital_twin/         # User behavior modeling
│   │   └── model.py
│   ├── adaptive_ui/          # UI prediction engine
│   │   └── engine.py
│   ├── self_healing/         # Anomaly detection
│   │   └── anomaly_detector.py
│   ├── self_evolution/      # Meta-learning & GA
│   │   └── meta_learner.py
│   ├── cross_domain/         # Domain-specific modules
│   │   └── modules.py
│   ├── main.py               # FastAPI entry point
│   └── requirements.txt      # Python dependencies
│
├── system_layer/             # Deployment configurations
│   ├── docker/               # Docker configurations
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.ai
│   │   ├── docker-compose.yml
│   │   └── prometheus.yml
│   ├── k8s/                  # Kubernetes manifests
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── ai-deployment.yaml
│   │   └── mongodb-deployment.yaml
│   └── monitoring/           # Monitoring configs
│
├── docs/                     # Documentation
│   ├── architecture.md       # Architecture details
│   ├── api_reference.md      # API documentation
│   └── roadmap.md           # Project roadmap
│
├── scripts/                  # Setup scripts
│   ├── setup.sh              # Linux/macOS setup
│   └── setup.ps1             # Windows setup
│
└── tests/                    # E2E tests
```

---

## Installation

### Prerequisites

Ensure you have the following installed on your system:

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 18.x |
| Python | 3.11 |
| MongoDB | 7.0 |
| Docker | 24.x (optional) |
| Git | 2.x |

### Quick Start

#### Using Setup Scripts

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

#### Manual Installation

**1. Clone the Repository**
```bash
git clone https://github.com/yourusername/AI-DigitalTwin-OS.git
cd AI-DigitalTwin-OS
```

**2. Install Frontend Dependencies**
```bash
cd frontend
npm install
```

**3. Install Backend Dependencies**
```bash
cd ../backend
npm install
```

**4. Install AI Engine Dependencies**
```bash
cd ../ai_engine
pip install -r requirements.txt
```

---

## Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/digitaltwin
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_AI_URL=http://localhost:8000
```

---

## Running the Application

### Development Mode

**1. Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or locally
mongod
```

**2. Start Backend**
```bash
cd backend
npm run dev
# Server running on http://localhost:3001
```

**3. Start Frontend**
```bash
cd frontend
npm run dev
# Application running on http://localhost:3000
```

**4. Start AI Engine**
```bash
cd ai_engine
python main.py
# AI Engine running on http://localhost:8000
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
npm run build
npm start
```

---

## Docker Deployment

### Using Docker Compose

The fastest way to run the entire stack:

```bash
cd system_layer/docker
docker-compose up -d
```

This will start:
- Frontend on port 3000
- Backend API on port 3001
- AI Engine on port 8000
- MongoDB on port 27017
- Redis on port 6379
- Prometheus on port 9090
- Grafana on port 3002

### Individual Services

```bash
# Build and run frontend
docker build -f system_layer/docker/Dockerfile.frontend -t digitaltwin-frontend .
docker run -p 3000:3000 digitaltwin-frontend

# Build and run backend
docker build -f system_layer/docker/Dockerfile.backend -t digitaltwin-backend .
docker run -p 3001:3001 digitaltwin-backend

# Build and run AI engine
docker build -f system_layer/docker/Dockerfile.ai -t digitaltwin-ai .
docker run -p 8000:8000 digitaltwin-ai
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured

### Deploy All Services

```bash
kubectl apply -f system_layer/k8s/
```

### Individual Deployments

```bash
# Create namespace
kubectl apply -f system_layer/k8s/namespace.yaml

# Apply ConfigMap
kubectl apply -f system_layer/k8s/configmap.yaml

# Deploy MongoDB
kubectl apply -f system_layer/k8s/mongodb-deployment.yaml

# Deploy Backend
kubectl apply -f system_layer/k8s/backend-deployment.yaml

# Deploy Frontend
kubectl apply -f system_layer/k8s/frontend-deployment.yaml

# Deploy AI Engine
kubectl apply -f system_layer/k8s/ai-deployment.yaml
```

---

## API Documentation

### Base URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3001/api |
| AI Engine | http://localhost:8000 |
| Frontend | http://localhost:3000 |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |

### Activity Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/activity/track | Track user activity |
| GET | /api/activity | Get user activities |
| POST | /api/activity/session | Create session |
| PUT | /api/activity/session/end | End session |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/predictions | Get AI predictions |
| POST | /api/predictions/feedback | Submit feedback |
| GET | /api/predictions/history | Get prediction history |

### AI Engine Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /digital-twin/profile/{user_id} | Create user profile |
| GET | /digital-twin/summary/{user_id} | Get behavior summary |
| GET | /adaptive-ui/layout/{user_id} | Get layout prediction |
| GET | /self-healing/health | Get system health |
| POST | /self-healing/check | Check and heal |
| POST | /self-evolution/feedback | Add feedback |

For complete API documentation, see [docs/api_reference.md](docs/api_reference.md).

---

## Testing

### Backend Tests (Jest)

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific test file
npm test -- authController.test.ts
```

### AI Module Tests (pytest)

```bash
cd ai_engine

# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Specific test
pytest test_digital_twin.py -v
```

### Integration Tests

```bash
# Test backend + AI communication
cd tests
npm install
npm run integration
```

### End-to-End Tests (Playwright)

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test

# Run specific test
npx playwright test login.spec.ts
```

### Test Coverage Goals

| Module | Coverage Target |
|--------|-----------------|
| Backend Controllers | 80% |
| Backend Models | 85% |
| Backend Middleware | 90% |
| AI Modules | 75% |
| Frontend Components | 70% |

---

## Development

### Code Style

- **Frontend**: ESLint + Prettier (Next.js conventions)
- **Backend**: ESLint + TypeScript
- **AI Engine**: Black + Flake8

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
git add .
git commit -m "Add your feature"

# Push to remote
git push origin feature/your-feature
```

### Adding New Features

1. Create a new branch
2. Implement the feature
3. Add tests
4. Update documentation
5. Submit a pull request

---

## Roadmap

### Current Status

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Foundation Setup | ✅ Complete |
| Phase 2 | Adaptive Interface | ✅ Complete |
| Phase 3 | Personal Digital Twin | ✅ Complete |
| Phase 4 | Self-Healing System | ✅ Complete |
| Phase 5 | Self-Evolution Engine | ✅ Complete |
| Phase 6 | Cross-Domain Intelligence | ✅ Complete |
| Phase 7 | Deployment & Showcase | ✅ Complete |

### Future Enhancements

See [docs/roadmap.md](docs/roadmap.md) for detailed milestones.

---

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

### Ways to Contribute

- Report bugs
- Suggest new features
- Improve documentation
- Write tests
- Submit pull requests

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Built with ❤️ using AI-DigitalTwin-OS**

