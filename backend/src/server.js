import passport from './config/passport.js';
import dotenv from "dotenv"
import express from "express"
import { connectDB } from "./config/db.js"
import cors from 'cors'
import path from "path"
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { fileURLToPath } from 'url';
// Routes
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import adminRoutes from './routes/admin.js';

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//access enviromnt variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000;

//middleware
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173",
    })
  );
}
app.use(express.json())
app.use(express.urlencoded({ extended: true })); // Middleware xử lý dữ liệu từ form (x-www-form-urlencoded)
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files (uploads folder ở root level)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Book Management API is running',
    version: '2.0 - ES6 Modules + Dual JWT Tokens',
    structure: 'src folder',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      admin: '/api/admin'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route không tồn tại' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || 'Có lỗi xảy ra!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});


//
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../Frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../Frontend", "dist", "index.html"));
//   });
// }

//connect to mongoDBs
connectDB().then(() => {
  //connect to db first and then listening on port
  app.listen(PORT, () => {
    console.log(`App listening on port http://localhost:${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  })
})

