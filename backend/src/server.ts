import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import clientsRoutes from './routes/clientsRoutes';
import taskTypesRoutes from './routes/taskTypesRoutes';
import tasksRoutes from './routes/tasksRoutes';
import hourRecordRoutes from './routes/hourRecordRoutes';
import monthlyClosuresRoutes from './routes/monthlyClosuresRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportsRoutes from './routes/reportsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import expensesRoutes from './routes/expensesRoutes';
import usersRoutes from './routes/usersRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'MyFreela API is running!',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/task-types', taskTypesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/hour-records', hourRecordRoutes);
app.use('/api/monthly-closures', monthlyClosuresRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/users', usersRoutes);

// Test route
app.get('/api', (_req, res) => {
  res.json({
    message: 'MyFreela API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      clients: '/api/clients',
      taskTypes: '/api/task-types',
      tasks: '/api/tasks',
      hourRecords: '/api/hour-records',
      monthlyClosures: '/api/monthly-closures',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      settings: '/api/settings',
      expenses: '/api/expenses',
      users: '/api/users'
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
