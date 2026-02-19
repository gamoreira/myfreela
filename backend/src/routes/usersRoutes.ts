import { Router } from 'express';
import { param, body } from 'express-validator';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/usersController';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/adminAuth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication + admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @route   GET /api/users
 * @desc    Get all users with data counts
 * @access  Admin
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Admin
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    validate,
  ],
  getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user's data (name, email, isAdmin, password)
 * @access  Admin
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user and all their data
 * @access  Admin
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    validate,
  ],
  deleteUser
);

export default router;
