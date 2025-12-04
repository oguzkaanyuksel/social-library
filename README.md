# Social Library

A full-stack social media platform for book and movie enthusiasts to discover, rate, review, and share their favorite content.

## Features

- 📚 Browse and discover books and movies
- ⭐ Rate and review content
- 💬 Comment and interact with other users
- 📝 Create custom lists
- 👥 Follow other users
- 🔍 Advanced search functionality
- 📱 Activity feed

## Tech Stack

### Backend
- Node.js & Express
- Sequelize ORM
- JWT Authentication
- MySQL Database
- External APIs (TMDB, Google Books)

### Frontend
- React
- Vite
- React Router
- Axios

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd social-library
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Configure environment variables
Create a `.env` file in the backend directory with:
```
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=social_library
JWT_SECRET=your_jwt_secret
TMDB_API_KEY=your_tmdb_api_key
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

5. Run database migrations
```bash
cd backend
npm run migrate
```

6. Start the development servers

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run dev
```

## License

MIT
