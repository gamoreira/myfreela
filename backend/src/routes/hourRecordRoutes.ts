import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllHourRecords,
  getHourRecordById,
  createHourRecord,
  updateHourRecord,
  deleteHourRecord,
  getHourRecordsByTask,
} from '../controllers/hourRecordController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/hour-records
 * @desc    Get all hour records for authenticated user
 * @access  Private
 */
router.get('/', getAllHourRecords);

/**
 * @route   GET /api/hour-records/task/:taskId
 * @desc    Get hour records for a specific task
 * @access  Private
 */
router.get(
  '/task/:taskId',
  [param('taskId').isUUID().withMessage('Invalid task ID format'), validate],
  getHourRecordsByTask
);

/**
 * @route   GET /api/hour-records/:id
 * @desc    Get a single hour record by ID
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid hour record ID format'), validate],
  getHourRecordById
);

/**
 * @route   POST /api/hour-records
 * @desc    Create a new hour record
 * @access  Private
 */
router.post(
  '/',
  [
    body('taskId')
      .isUUID()
      .withMessage('Task ID must be a valid UUID'),
    body('workDate')
      .isISO8601()
      .withMessage('Work date must be a valid date (ISO 8601 format)'),
    body('hoursWorked')
      .isFloat({ min: 0.01 })
      .withMessage('Hours worked must be greater than 0'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be at most 1000 characters'),
    validate,
  ],
  createHourRecord
);

/**
 * @route   PUT /api/hour-records/:id
 * @desc    Update an hour record
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid hour record ID format'),
    body('workDate')
      .optional()
      .isISO8601()
      .withMessage('Work date must be a valid date (ISO 8601 format)'),
    body('hoursWorked')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Hours worked must be greater than 0'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be at most 1000 characters'),
    validate,
  ],
  updateHourRecord
);

/**
 * @route   DELETE /api/hour-records/:id
 * @desc    Delete an hour record
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid hour record ID format'), validate],
  deleteHourRecord
);

export default router;
