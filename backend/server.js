import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/DB.js';
import router from './routs/Routs.js';
import cors from 'cors';

const port = process.env.PORT || 5000;

// Connect to the database
connectDB();

const app = express();

// Middleware to parse JSON and handle CORS
app.use(express.json());
app.use(cors({
  origin: 'https://math-lessons-rl40.onrender.com'
}));
  app.options('*', cors());  // Allow preflight for all routes


// Test route to verify server is running
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Routes for handling days-related requests
app.use('/api/days', router);

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
