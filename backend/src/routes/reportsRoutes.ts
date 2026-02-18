import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getMonthlyReport,
  getAnnualReport,
  generateMonthlyReportPDF,
  generateAnnualReportPDF
} from '../controllers/reportsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/reports/monthly
 * Get monthly report data (JSON)
 */
router.get(
  '/monthly',
  [
    query('month')
      .notEmpty()
      .withMessage('Month is required')
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    query('year')
      .notEmpty()
      .withMessage('Year is required')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100')
  ],
  validate,
  getMonthlyReport
);

/**
 * GET /api/reports/annual
 * Get annual report data (JSON)
 */
router.get(
  '/annual',
  [
    query('year')
      .notEmpty()
      .withMessage('Year is required')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100')
  ],
  validate,
  getAnnualReport
);

/**
 * GET /api/reports/monthly/pdf
 * Generate monthly report PDF
 */
router.get(
  '/monthly/pdf',
  [
    query('month')
      .notEmpty()
      .withMessage('Month is required')
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    query('year')
      .notEmpty()
      .withMessage('Year is required')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100')
  ],
  validate,
  generateMonthlyReportPDF
);

/**
 * GET /api/reports/annual/pdf
 * Generate annual report PDF
 */
router.get(
  '/annual/pdf',
  [
    query('year')
      .notEmpty()
      .withMessage('Year is required')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100')
  ],
  validate,
  generateAnnualReportPDF
);

export default router;
