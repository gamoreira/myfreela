import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  duplicateTask,
} from '../controllers/tasksController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('clientId')
      .optional()
      .isUUID()
      .withMessage('Client ID must be a valid UUID'),
    query('taskTypeId')
      .optional()
      .isUUID()
      .withMessage('Task type ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['pending', 'completed'])
      .withMessage('Status must be either pending or completed'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Date from must be a valid ISO 8601 date'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Date to must be a valid ISO 8601 date'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search term must be at least 2 characters'),
    validate,
  ],
  getAllTasks
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID format'),
    validate,
  ],
  getTaskById
);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post(
  '/',
  [
    body('clientId')
      .notEmpty()
      .withMessage('Client ID is required')
      .isUUID()
      .withMessage('Client ID must be a valid UUID'),
    body('taskTypeId')
      .notEmpty()
      .withMessage('Task type ID is required')
      .isUUID()
      .withMessage('Task type ID must be a valid UUID'),
    body('taskNumber')
      .trim()
      .notEmpty()
      .withMessage('Task number is required'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Task name is required'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Description must be between 5 and 1000 characters'),
    body('creationDate')
      .notEmpty()
      .withMessage('Creation date is required')
      .isISO8601()
      .withMessage('Creation date must be a valid ISO 8601 date')
      .custom((value) => {
        const creationDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (creationDate > today) {
          throw new Error('Creation date cannot be in the future');
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['pending', 'completed'])
      .withMessage('Status must be either pending or completed'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    validate,
  ],
  createTask
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID format'),
    body('clientId')
      .optional()
      .isUUID()
      .withMessage('Client ID must be a valid UUID'),
    body('taskTypeId')
      .optional()
      .isUUID()
      .withMessage('Task type ID must be a valid UUID'),
    body('taskNumber')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Task number cannot be empty'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Task name cannot be empty'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Description must be between 5 and 1000 characters'),
    body('creationDate')
      .optional()
      .isISO8601()
      .withMessage('Creation date must be a valid ISO 8601 date')
      .custom((value) => {
        if (value) {
          const creationDate = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (creationDate > today) {
            throw new Error('Creation date cannot be in the future');
          }
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['pending', 'completed'])
      .withMessage('Status must be either pending or completed'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    validate,
  ],
  updateTask
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID format'),
    validate,
  ],
  deleteTask
);

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Toggle task status (pending <-> completed)
 * @access  Private
 */
router.patch(
  '/:id/status',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID format'),
    validate,
  ],
  toggleTaskStatus
);

/**
 * @route   POST /api/tasks/:id/duplicate
 * @desc    Duplicate a task with optional new date
 * @access  Private
 */
router.post(
  '/:id/duplicate',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID format'),
    body('creationDate')
      .optional()
      .isISO8601()
      .withMessage('Creation date must be a valid ISO 8601 date')
      .custom((value) => {
        if (value) {
          const creationDate = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (creationDate > today) {
            throw new Error('Creation date cannot be in the future');
          }
        }
        return true;
      }),
    validate,
  ],
  duplicateTask
);

export default router;
