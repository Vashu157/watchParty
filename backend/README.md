# WatchParty Backend

A Node.js backend server for the WatchParty application with Express, Socket.io, and MongoDB.

## Features

- 🏠 **Room Management**: Create, join, leave rooms
- 💬 **Real-time Chat**: Socket.io powered messaging
- 🎥 **Video Management**: Dynamic video URL updates
- 🔐 **Authentication**: JWT-based user authentication
- 📊 **Real-time Updates**: Live room status and user presence

## Tech Stack

- **Node.js** + **Express.js** - Server framework
- **Socket.io** - Real-time communication
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/watchparty
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (protected)

### Rooms
- `POST /api/rooms/create` - Create new room
- `POST /api/rooms/join` - Join existing room
- `PATCH /api/rooms/leave` - Leave room
- `PATCH /api/rooms/update-video` - Update video URL
- `GET /api/rooms` - Get all active rooms
- `GET /api/rooms/:roomLink` - Get room details

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/room/:roomId` - Get room messages
- `DELETE /api/messages/:messageId` - Delete message

## Socket Events

### Client → Server
- `join-room` - Join a room
- `leave-room` - Leave a room
- `send-message` - Send chat message
- `room-update` - Update room (video URL)
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator

### Server → Client
- `user-joined` - User joined room
- `user-left` - User left room
- `new-message` - New chat message
- `room-updated` - Room was updated
- `user-typing` - User typing status
- `error` - Error occurred

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/watchparty` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `SOCKET_CORS_ORIGIN` | Socket.io CORS origin | `http://localhost:3000` |

## Project Structure

```
backend/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env                      # Environment variables
└── src/
    ├── config/
    │   └── database.js       # MongoDB connection
    ├── models/
    │   ├── User.js           # User model
    │   ├── Room.js           # Room model
    │   └── Message.js        # Message model
    ├── controllers/
    │   ├── authController.js # Authentication logic
    │   ├── roomController.js # Room management
    │   └── messageController.js # Message handling
    ├── routes/
    │   ├── auth.js           # Auth routes
    │   ├── rooms.js          # Room routes
    │   └── messages.js       # Message routes
    ├── middleware/
    │   ├── auth.js           # JWT authentication
    │   └── errorHandler.js   # Error handling
    └── sockets/
        └── socketHandlers.js # Socket.io events
```

## Development

### Run with nodemon:
```bash
npm run dev
```

### Run frontend and backend together:
From the main project root:
```bash
npm run dev:full
```

## License

ISC
