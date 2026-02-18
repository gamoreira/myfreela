import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getDashboardOverview,
  getRevenueStats,
  getProductivityStats,
  getMonthlyComparison,
  getTasksDashboard
} from '../controllers/dashboardController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/overview
 * Get dashboard overview with current month metrics
 */
router.get('/overview', getDashboardOverview);

/**
 * GET /api/dashboard/revenue
 * Get revenue statistics for a period
 */
router.get(
  '/revenue',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  validate,
  getRevenueStats
);

/**
 * GET /api/dashboard/productivity
 * Get productivity statistics by task type
 */
router.get(
  '/productivity',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  validate,
  getProductivityStats
);

/**
 * GET /api/dashboard/monthly-comparison
 * Get monthly comparison data
 */
router.get(
  '/monthly-comparison',
  [
    query('months')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Months must be between 1 and 12')
  ],
  validate,
  getMonthlyComparison
);

/**
 * GET /api/dashboard/tasks
 * Get task items dashboard with metrics
 */
router.get(
  '/tasks',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  validate,
  getTasksDashboard
);

export default router;
