# Expense Tracker

## Requirements

- Node.js and npm
- A MongoDB Atlas cluster
- Git

## Setup

1. Clone the repository and open its folder:

   ```bash
   git clone YOUR_REPOSITORY_URL
   cd temp
   ```

2. Create `backend/.env` with your MongoDB Atlas connection string:

   ```env
   MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/expense_tracker"
   PORT=5000
   ```

credentials i had in the video

3. Install dependencies:

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

## Start the application

From the repository root, run:

```bash
npm start
```

This starts the backend and frontend together. `http://localhost:5173`.

The backend runs on port `5000` and connects to MongoDB using `backend/.env`.
