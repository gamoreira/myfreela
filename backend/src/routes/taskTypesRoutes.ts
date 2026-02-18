import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllTaskTypes,
  getTaskTypeById,
  createTaskType,
  updateTaskType,
  deleteTaskType,
  getTaskTypeStats,
} from '../controllers/taskTypesController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/task-types
 * @desc    Get all task types for authenticated user
 * @access  Private
 */
router.get('/', getAllTaskTypes);

/**
 * @route   GET /api/task-types/:id
 * @desc    Get a single task type by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task type ID format'),
    validate,
  ],
  getTaskTypeById
);

/**
 * @route   POST /api/task-types
 * @desc    Create a new task type
 * @access  Private
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Task type name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Task type name must be between 2 and 50 characters'),
    body('color')
      .trim()
      .notEmpty()
      .withMessage('Color is required')
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color code (e.g., #FF5733)'),
    validate,
  ],
  createTaskType
);

/**
 * @route   PUT /api/task-types/:id
 * @desc    Update a task type
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task type ID format'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Task type name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('Task type name must be between 2 and 50 characters'),
    body('color')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Color cannot be empty')
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color code (e.g., #FF5733)'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    validate,
  ],
  updateTaskType
);

/**
 * @route   DELETE /api/task-types/:id
 * @desc    Delete a task type
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task type ID format'),
    validate,
  ],
  deleteTaskType
);

/**
 * @route   GET /api/task-types/:id/stats
 * @desc    Get task type statistics (tasks count, hours)
 * @access  Private
 */
router.get(
  '/:id/stats',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task type ID format'),
    validate,
  ],
  getTaskTypeStats
);

export default router;
