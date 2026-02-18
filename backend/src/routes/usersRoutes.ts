import { Router } from 'express';
import { param } from 'express-validator';
import { getAllUsers, getUserById, deleteUser } from '../controllers/usersController';
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
