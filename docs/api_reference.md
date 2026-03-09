# API Reference

Complete API documentation for AI-DigitalTwin-OS.

## Table of Contents

- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [User Management](#user-management)
- [Activity Tracking](#activity-tracking)
- [AI Predictions](#ai-predictions)
- [Digital Twin](#digital-twin)
- [Adaptive UI](#adaptive-ui)
- [Self-Healing](#self-healing)
- [Self-Evolution](#self-evolution)
- [Cross-Domain](#cross-domain)
- [WebSocket Events](#websocket-events)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Base URLs

| Service | URL | Environment |
|---------|-----|-------------|
| Backend API | `http://localhost:3001/api` | Development |
| AI Engine | `http://localhost:8000` | Development |
| Frontend | `http://localhost:3000` | Development |

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Register User

Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password (min 6 characters) |
| name | string | Yes | User's display name |

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "preferences": {},
      "digitalTwin": {
        "createdAt": "2024-01-15T10:30:00Z",
        "lastActive": "2024-01-15T10:30:00Z",
        "behaviorProfile": {}
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

Authenticate user and get access token.

```http
POST /api/auth/login
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password |

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "preferences": {},
      "digitalTwin": {
        "createdAt": "2024-01-15T10:30:00Z",
        "lastActive": "2024-01-15T10:30:00Z",
        "behaviorProfile": {}
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User

Get authenticated user's profile.

```http
GET /api/auth/me
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "preferences": {
      "theme": "dark",
      "notifications": true
    },
    "digitalTwin": {
      "createdAt": "2024-01-15T10:30:00Z",
      "lastActive": "2024-01-15T10:30:00Z",
      "behaviorProfile": {}
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

### Update Profile

Update user profile information.

```http
PUT /api/auth/profile
```

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | User's display name |
| preferences | object | No | User preferences |

```json
{
  "name": "John Doe",
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "en"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    },
    "digitalTwin": {
      "createdAt": "2024-01-15T10:30:00Z",
      "lastActive": "2024-01-15T12:00:00Z",
      "behaviorProfile": {}
    }
  }
}
```

---

## User Management

### Get User Profile

Get a user's public profile.

```http
GET /api/users/:userId
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "digitalTwin": {
      "accuracy": 0.85,
      "predictionsMade": 150,
      "lastActive": "2024-01-15T12:00:00Z"
    }
  }
}
```

---

## Activity Tracking

### Track Activity

Track user activity for behavior analysis.

```http
POST /api/activity/track
```

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | Action type (click, navigation, scroll, typing) |
| element | string | Yes | UI element identifier |
| page | string | Yes | Current page path |
| timestamp | ISO8601 | No | Activity timestamp |
| duration | number | No | Duration in milliseconds |
| metadata | object | No | Additional data |

```json
{
  "action": "click",
  "element": "dashboard-button",
  "page": "/dashboard",
  "timestamp": "2024-01-15T10:30:00Z",
  "duration": 150,
  "metadata": {
    "buttonText": "View Reports",
    "section": "sidebar"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Activity tracked"
}
```

### Get User Activities

Get paginated list of user activities.

```http
GET /api/activity
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| action | string | - | Filter by action type |
| startDate | ISO8601 | - | Filter start date |
| endDate | ISO8601 | - | Filter end date |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "507f1f77bcf86cd799439012",
        "userId": "507f1f77bcf86cd799439011",
        "action": "click",
        "element": "dashboard-button",
        "page": "/dashboard",
        "timestamp": "2024-01-15T10:30:00Z",
        "duration": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Create Session

Start a new user session.

```http
POST /api/activity/session
```

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| device | string | No | Device type (desktop, mobile, tablet) |
| browser | string | No | Browser name |
| os | string | No | Operating system |

```json
{
  "device": "desktop",
  "browser": "Chrome",
  "os": "Windows 11"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123def456",
    "startedAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

### End Session

End the current user session.

```http
PUT /api/activity/session/end
```

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | string | Yes | Session ID to end |

```json
{
  "sessionId": "sess_abc123def456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123def456",
    "endedAt": "2024-01-15T11:25:00Z",
    "duration": 55,
    "activitiesCount": 42
  }
}
```

---

## AI Predictions

### Get Predictions

Get AI predictions for the user.

```http
GET /api/predictions
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by prediction type (ui, behavior, anomaly) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "id": "pred_abc123",
        "type": "ui",
        "confidence": 0.95,
        "suggestion": "User will likely navigate to dashboard",
        "metadata": {
          "predictedPage": "/dashboard",
          "probability": 0.95
        },
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "pred_abc124",
        "type": "behavior",
        "confidence": 0.87,
        "suggestion": "User will open analytics panel",
        "metadata": {
          "predictedAction": "open_analytics",
          "probability": 0.87
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Submit Feedback

Submit feedback on a prediction.

```http
POST /api/predictions/feedback
```

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| predictionId | string | Yes | Prediction ID |
| feedback | string | Yes | Feedback type (helpful, not_helpful) |
| comment | string | No | Additional comment |

```json
{
  "predictionId": "pred_abc123",
  "feedback": "helpful",
  "comment": "This prediction was accurate"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Feedback recorded successfully"
}
```

### Get Prediction History

Get user's prediction history.

```http
GET /api/predictions/history
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "predictions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

## Digital Twin

### Create User Profile

Create a digital twin profile for a user.

```http
POST /digital-twin/profile/{user_id}
```

**Response (201 Created):**

```json
{
  "success": true,
  "profile": {
    "user_id": "user123",
    "typing_patterns": {},
    "navigation_preferences": [],
    "feature_usage": {},
    "time_based_patterns": {},
    "task_sequences": [],
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

### Get User Profile

Get user's digital twin profile.

```http
GET /digital-twin/profile/{user_id}
```

**Response (200 OK):**

```json
{
  "success": true,
  "profile": {
    "user_id": "user123",
    "typing_patterns": {
      "avg_key_interval": 0.15,
      "avg_keystroke_duration": 0.1,
      "error_rate": 0.02,
      "typing_speed": 45.0
    },
    "navigation_preferences": ["/dashboard", "/analytics", "/reports"],
    "feature_usage": {
      "dashboard": 150,
      "analytics": 85,
      "reports": 42
    },
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

### Update Typing Patterns

Update typing patterns for a user.

```http
POST /digital-twin/typing/{user_id}
```

**Request Body:**

```json
[
  {"timestamp": 0.0, "key": "h", "press_time": 0.0, "release_time": 0.1},
  {"timestamp": 0.15, "key": "e", "press_time": 0.15, "release_time": 0.25},
  {"timestamp": 0.3, "key": "l", "press_time": 0.3, "release_time": 0.4}
]
```

**Response (200 OK):**

```json
{
  "success": true
}
```

### Get Automations

Get suggested automations for a user.

```http
GET /digital-twin/automations/{user_id}
```

**Response (200 OK):**

```json
{
  "success": true,
  "automations": [
    {
      "id": "auto_1",
      "title": "Auto Dashboard → Reports",
      "description": "Automate dashboard → analytics → export_report",
      "confidence": 0.85,
      "sequence": ["open_dashboard", "view_analytics", "export_report"]
    }
  ]
}
```

### Get Behavior Summary

Get comprehensive behavior summary for a user.

```http
GET /digital-twin/summary/{user_id}
```

**Response (200 OK):**

```json
{
  "success": true,
  "summary": {
    "user_id": "user123",
    "typing_patterns": {
      "avg_key_interval": 0.15,
      "avg_keystroke_duration": 0.1,
      "error_rate": 0.02,
      "typing_speed": 45.0
    },
    "top_features": [
      ["dashboard", 150],
      ["analytics", 85],
      ["reports", 42]
    ],
    "navigation_pattern": ["/dashboard", "/analytics", "/reports", "/settings"],
    "twin_accuracy": 0.85,
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

---

## Adaptive UI

### Track Activity

Track user activity for UI adaptation.

```http
POST /adaptive-ui/track/{user_id}
```

**Request Body:**

```json
{
  "type": "click",
  "element": "dashboard",
  "page": "/dashboard",
  "duration": 150,
  "metadata": {}
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

### Get Layout Prediction

Get predicted layout preferences for a user.

```http
GET /adaptive-ui/layout/{user_id}
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| device | string | desktop | Device type |

**Response (200 OK):**

```json
{
  "success": true,
  "layout": {
    "preferredLayout": "sidebar",
    "sidebarCollapsed": false,
    "widgetOrder": ["dashboard", "analytics", "tasks", "notifications"],
    "theme": "dark",
    "shortcutHints": true,
    "confidence": 0.92
  }
}
```

### Predict Next Page

Predict the next page a user will visit.

```http
GET /adaptive-ui/next-page/{user_id}
```

**Response (200 OK):**

```json
{
  "success": true,
  "nextPage": "/analytics"
}
```

### Get Analytics

Get complete analytics for a user.

```http
GET /adaptive-ui/analytics/{user_id}
```

**Response (200 OK):**

```json
{
  "success": true,
  "analytics": {
    "layout": {
      "preferredLayout": "sidebar",
      "confidence": 0.92
    },
    "nextPage": "/analytics",
    "features": {
      "dashboard": 0.45,
      "analytics": 0.30,
      "tasks": 0.15,
      "notifications": 0.10
    },
    "timePatterns": {
      "peakHours": [9, 10, 14, 15],
      "peakDays": ["Monday", "Tuesday", "Wednesday"],
      "avgSessionLength": 25.5
    },
    "actionDistribution": {
      "click": 0.65,
      "navigation": 0.25,
      "scroll": 0.08,
      "typing": 0.02
    }
  }
}
```

---

## Self-Healing

### Log Event

Log a system event.

```http
POST /self-healing/log
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| level | string | Yes | Log level (info, warn, error, critical) |
| source | string | Yes | Source (backend, frontend, ai_engine) |
| message | string | Yes | Log message |
| metadata | object | No | Additional metadata |
| sessionId | string | No | Session ID |
| userId | string | No | User ID |

```json
{
  "level": "error",
  "source": "backend",
  "message": "Database connection failed",
  "metadata": {
    "errorCode": "DB_CONN_001",
    "retryCount": 3
  },
  "sessionId": "sess_abc123"
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

### Get System Health

Get current system health status.

```http
GET /self-healing/health
```

**Response (200 OK):**

```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "error_rate": 0.05,
    "total_logs": 1250,
    "recent_errors": 3,
    "active_anomalies": 0
  }
}
```

### Check and Heal

Check for anomalies and attempt automatic healing.

```http
POST /self-healing/check
```

**Response (200 OK):**

```json
{
  "success": true,
  "results": {
    "timestamp": "2024-01-15T10:30:00Z",
    "anomalies_detected": 2,
    "anomalies": [
      {
        "id": "abc123",
        "type": "error_spike",
        "severity": "medium",
        "description": "Error spike detected in backend: 2.5 errors/min"
      }
    ],
    "recoveries": [
      {
        "anomaly_id": "abc123",
        "type": "error_spike",
        "attempted": true,
        "success": true,
        "actions": [
          {
            "action": "scale_resources",
            "description": "Scaling up resources to handle load"
          }
        ]
      }
    ]
  }
}
```

---

## Self-Evolution

### Add Feedback

Add prediction feedback for model improvement.

```http
POST /self-evolution/feedback
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| predictionId | string | Yes | Prediction ID |
| actual | any | Yes | Actual outcome |
| predicted | any | Yes | Predicted outcome |
| feedback | string | No | User feedback (positive, negative) |

```json
{
  "predictionId": "pred_abc123",
  "actual": "dashboard",
  "predicted": "dashboard",
  "feedback": "positive"
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

### Get Status

Get evolution engine status.

```http
GET /self-evolution/status
```

**Response (200 OK):**

```json
{
  "success": true,
  "status": {
    "current_version": "v1.2.0",
    "total_versions": 5,
    "feedback_buffer_size": 150,
    "metrics": {
      "accuracy": 0.92,
      "error_rate": 0.08,
      "total_feedback": 150,
      "positive_feedback": 120,
      "negative_feedback": 30,
      "model_version": "v1.2.0",
      "training_metrics": {
        "accuracy": 0.95,
        "loss": 0.05,
        "f1_score": 0.93
      }
    },
    "gen_algorithm_best": 1.45
  }
}
```

### Check and Evolve

Check if evolution is needed and apply.

```http
POST /self-evolution/evolve
```

**Request Body:**

```json
{
  "trainingData": [
    {"feature1": 0.5, "feature2": 0.3, "label": "A"},
    {"feature1": 0.2, "feature2": 0.8, "label": "B"}
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "result": {
    "should_evolve": true,
    "evolution_type": "retrain",
    "details": {
      "new_version": "v1.3.0",
      "metrics": {
        "accuracy": 0.96,
        "loss": 0.04,
        "f1_score": 0.95
      }
    },
    "current_metrics": {
      "accuracy": 0.92,
      "error_rate": 0.08,
      "model_version": "v1.2.0"
    }
  }
}
```

### Optimize Architecture

Optimize model architecture using genetic algorithms.

```http
POST /self-evolution/optimize
```

**Request Body:**

```json
{
  "param_space": {
    "learning_rate": [0.001, 0.01, 0.1],
    "batch_size": [16, 32, 64],
    "layers": [2, 3, 4]
  },
  "generations": 50
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "result": {
    "generations": 50,
    "best_fitness": 1.85,
    "best_individual": {
      "learning_rate": 0.01,
      "batch_size": 32,
      "layers": 3,
      "fitness": 1.85
    },
    "history": [...]
  }
}
```

---

## Cross-Domain

### Process Domain Data

Process data for a specific domain.

```http
POST /cross-domain/{domain}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| domain | string | Domain name (healthcare, finance, education) |

**Request Body:**

```json
{
  "data": {
    "input": "data to process"
  },
  "options": {
    "include_insights": true
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "result": {
    "processed": true,
    "domain": "healthcare",
    "predictions": [...],
    "insights": [...]
  }
}
```

---

## WebSocket Events

### Connection

```javascript
const socket = io('http://localhost:3001');
```

### Subscribe to User Activity

```javascript
// Subscribe to specific user's activity stream
socket.emit('subscribe', { userId: 'user123' });
```

### Listen for Events

```javascript
// AI Suggestions
socket.on('ai:suggestion', (data) => {
  console.log('New suggestion:', data);
});

// System Alerts
socket.on('system:alert', (data) => {
  console.log('System alert:', data);
});

// Anomaly Detected
socket.on('anomaly:detected', (data) => {
  console.log('Anomaly:', data);
});

// Prediction Update
socket.on('prediction:update', (data) => {
  console.log('Prediction:', data);
});
```

### Emit Events

```javascript
// Track activity in real-time
socket.emit('activity:track', {
  action: 'click',
  element: 'button',
  page: '/dashboard'
});
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "must be a valid email"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

API endpoints are rate limited to ensure fair usage:

| Endpoint | Limit |
|----------|-------|
| Authentication | 10 requests/minute |
| Activity Tracking | 60 requests/minute |
| AI Predictions | 30 requests/minute |
| Other Endpoints | 100 requests/minute |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

---

## Versioning

The API uses URL-based versioning:

```
GET /api/v1/auth/login
```

Current version: **v1**

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- Authentication endpoints
- Activity tracking
- AI predictions
- Digital Twin endpoints
- Adaptive UI endpoints
- Self-Healing endpoints
- Self-Evolution endpoints
- Cross-Domain endpoints

