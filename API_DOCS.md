# API Documentation

## Base URL
- **Production**: `https://olx-clone-backend-6ho8.onrender.com/api`
- **Development**: `http://localhost:8000/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Obtain Token
```http
POST /users/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "user@example.com",
    "email_verified": true
  }
}
```

### Refresh Token
```http
POST /users/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Users

### Register
```http
POST /users/register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "user@example.com",
  "password": "password123",
  "phone_number": "+1234567890",
  "location": "New York"
}
```

### Verify Email
```http
POST /users/verify-email/
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Get Profile
```http
GET /users/profile/
Authorization: Bearer <token>
```

## Listings

### List All Listings
```http
GET /listings/?category=electronics&search=laptop&location=New York
```

**Query Parameters**:
- `category` - Filter by category
- `search` - Search in title/description
- `location` - Filter by location
- `min_price` - Minimum price
- `max_price` - Maximum price
- `page` - Page number

### Create Listing
```http
POST /listings/
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "iPhone 13 Pro",
  "description": "Like new condition",
  "price": 800,
  "category": 1,
  "location": "New York",
  "images": [<file1>, <file2>]
}
```

### Get Listing Details
```http
GET /listings/{id}/
```

### Update Listing
```http
PUT /listings/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 750
}
```

### Delete Listing
```http
DELETE /listings/{id}/
Authorization: Bearer <token>
```

## Chat

### List Conversations
```http
GET /chat/conversations/
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": 1,
    "listing": {
      "id": 5,
      "title": "iPhone 13 Pro",
      "price": 800
    },
    "other_user": {
      "id": 2,
      "username": "seller_name",
      "is_online": true
    },
    "last_message": {
      "content": "Is this still available?",
      "created_at": "2026-01-17T10:30:00Z"
    },
    "unread_count": 2
  }
]
```

### Create Conversation
```http
POST /chat/conversations/
Authorization: Bearer <token>
Content-Type: application/json

{
  "listing_id": 5
}
```

### Get Messages
```http
GET /chat/conversations/{id}/messages/
Authorization: Bearer <token>
```

### Send Message
```http
POST /chat/messages/
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation": 1,
  "content": "Hello, is this available?"
}
```

### Mark Messages as Read
```http
POST /chat/conversations/{id}/mark_read/
Authorization: Bearer <token>
```

### Delete Conversation
```http
POST /chat/conversations/{id}/hide/
Authorization: Bearer <token>
```

## WebSocket API

### Chat WebSocket
```javascript
const ws = new WebSocket(
  `wss://backend.com/ws/chat/${conversationId}/?token=${jwtToken}`
);

// Send message
ws.send(JSON.stringify({
  type: 'chat_message',
  message: 'Hello!'
}));

// Send typing indicator
ws.send(JSON.stringify({
  type: 'typing',
  is_typing: true
}));

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'chat_message':
      console.log('New message:', data.message);
      break;
    case 'typing':
      console.log('User typing:', data.is_typing);
      break;
    case 'message_status':
      console.log('Status update:', data);
      break;
    case 'ping':
      // Heartbeat
      break;
  }
};
```

### Notifications WebSocket
```javascript
const ws = new WebSocket(
  `wss://backend.com/ws/notifications/?token=${jwtToken}`
);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'notification_created') {
    console.log('New notification:', data.notification);
  }
};
```

## Notifications

### List Notifications
```http
GET /notifications/
Authorization: Bearer <token>
```

### Mark as Read
```http
POST /notifications/{id}/mark_read/
Authorization: Bearer <token>
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred."
}
```

## Rate Limits

- **Authentication**: 5 requests per minute
- **Chat Creation**: 5 conversations per 5 minutes
- **Message Sending**: 60 messages per minute
- **General API**: 100 requests per minute

## WebSocket Events

### Chat Events

**Incoming**:
- `chat_message` - New message received
- `typing` - User typing status
- `message_status` - Message delivery/read status
- `ping` - Heartbeat (every 25s)

**Outgoing**:
- `chat_message` - Send message
- `typing` - Send typing status

### Notification Events

**Incoming**:
- `notification_created` - New notification
- `unread_count_updated` - Unread count changed

---

For more details, see the [main README](./README.md).
