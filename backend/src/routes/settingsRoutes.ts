import { Router } from 'express';
import { body } from 'express-validator';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/', getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put(
  '/',
  [
    body('currency')
      .optional()
      .isString()
      .withMessage('Currency must be a string'),
    body('dateFormat')
      .optional()
      .isString()
      .withMessage('Date format must be a string'),
    body('theme')
      .optional()
      .isIn(['light', 'dark'])
      .withMessage('Theme must be either light or dark'),
    body('allowFutureDateHourRecords')
      .optional()
      .isBoolean()
      .withMessage('allowFutureDateHourRecords must be a boolean'),
    validate,
  ],
  updateSettings
);

export default router;
