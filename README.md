# Voice AI Assistant - Backend Implementation

## Project Status

✅ **Completed:**
- Express backend server with TypeScript
- MongoDB integration with Mongoose
- User authentication (JWT-based)
- Conversation history API
- Admin panel API endpoints
- Password hashing with bcrypt
- Protected routes with middleware

⚠️ **In Progress:**
- Frontend authentication UI
- Admin user management UI
- Settings/profile page
- Voice assistant conversation saving

## Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v18 or higher)
2. **MongoDB** (running locally or MongoDB Atlas)
3. **Google AI API Key** (get free at: https://aistudio.google.com/app/apikey)

## Environment Setup

Update your `.env.local` file with the following:

```env
# Google AI (REQUIRED for voice assistant to work)
GOOGLE_API_KEY=your-actual-google-api-key-here

# MongoDB (update if using MongoDB Atlas or different connection)
MONGODB_URI=mongodb://localhost:27017/voice-assistant

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Running the Project

### Option 1: Run Both Frontend and Backend Together

```bash
npm run dev:all
```

This will start:
- Next.js frontend on `http://localhost:3001`
- Express backend on `http://localhost:5000`

### Option 2: Run Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/password` | Change password | Yes |

### Conversations (`/api/conversations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/conversations` | Get all user conversations | Yes |
| GET | `/api/conversations/:id` | Get specific conversation | Yes |
| POST | `/api/conversations` | Create new conversation | Yes |
| POST | `/api/conversations/:id/messages` | Add message to conversation | Yes |
| DELETE | `/api/conversations/:id` | Delete conversation | Yes |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/admin/stats` | Dashboard statistics | Yes | Yes |
| GET | `/api/admin/users` | List all users | Yes | Yes |
| GET | `/api/admin/users/:id` | Get user details | Yes | Yes |
| PATCH | `/api/admin/users/:id/activate` | Activate user | Yes | Yes |
| PATCH | `/api/admin/users/:id/deactivate` | Deactivate user | Yes | Yes |
| PATCH | `/api/admin/users/:id/role` | Change user role | Yes | Yes |
| DELETE | `/api/admin/users/:id` | Delete user | Yes | Yes |

## Database Models

### User Schema
```typescript
{
  name: string;
  email: string;
  password: string (hashed);
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Conversation Schema
```typescript
{
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Project Structure

```
src/
├── server/                 # Backend Express server
│   ├── config/
│   │   └── db.ts          # MongoDB connection
│   ├── models/
│   │   ├── User.ts        # User model
│   │   └── Conversation.ts # Conversation model
│   ├── routes/
│   │   ├── auth.ts        # Authentication routes
│   │   ├── conversations.ts # Conversation routes
│   │   └── admin.ts       # Admin routes
│   ├── middleware/
│   │   └── auth.ts        # JWT authentication middleware
│   └── index.ts           # Express server entry point
├── app/                   # Next.js frontend
│   ├── (auth)/
│   │   ├── login/         # Login page (needs implementation)
│   │   └── register/      # Register page (needs implementation)
│   └── (app)/
│       ├── admin/
│       │   ├── dashboard/ # Voice assistant interface ✅
│       │   └── users/     # User management (needs implementation)
│       ├── history/       # Conversation history (needs implementation)
│       └── settings/      # Profile settings (needs implementation)
├── ai/
│   ├── genkit.ts          # Genkit initialization
│   └── flows/
│       └── voice-query-processing.ts # Voice AI flow
└── components/            # Reusable UI components
```

## Testing the Backend

### 1. Check Health
```bash
curl http://localhost:5000/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Save the returned `token` for authenticated requests.

### 4. Get Profile (with token)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

To complete the full implementation as per requirements:

1. **Build Authentication UI** - Create functional login/register forms
2. **Update Voice Assistant** - Save conversations to MongoDB with user context
3. **Build Admin Dashboard** - User management interface
4. **Create History Page** - Display user's conversation history
5. **Build Settings Page** - Profile and password management
6. **Add Route Protection** - Middleware to protect authenticated routes in Next.js
7. **Create Default Admin** - Script to create initial admin user

## Creating the First Admin User

You can create an admin user in two ways:

### Option 1: Register and manually update in MongoDB
```javascript
// In MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Option 2: Use the backend API (after registering)
Manually update the database as above, then use admin APIs.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **AI**: Google Gemini via Genkit
- **Voice**: Web Speech API (browser native)
- **UI**: Tailwind CSS, shadcn/ui components

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check MongoDB Atlas connection
- Verify `MONGODB_URI` in `.env.local`

### Voice Assistant Not Responding
- Add your Google API key to `.env.local`
- Check browser console for errors
- Ensure microphone permissions are granted

### Backend Port Already in Use
Change the PORT in `.env.local`:
```env
PORT=5001
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## License

Private Project
