import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientClosures,
} from '../controllers/clientsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/clients
 * @desc    Get all clients for authenticated user
 * @access  Private
 */
router.get('/', getAllClients);

/**
 * @route   GET /api/clients/:id
 * @desc    Get a single client by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid client ID format'),
    validate,
  ],
  getClientById
);

/**
 * @route   POST /api/clients
 * @desc    Create a new client
 * @access  Private
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Client name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Client name must be between 2 and 100 characters'),
    validate,
  ],
  createClient
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update a client
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid client ID format'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Client name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Client name must be between 2 and 100 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    validate,
  ],
  updateClient
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete a client (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid client ID format'),
    validate,
  ],
  deleteClient
);

/**
 * @route   GET /api/clients/:id/closures
 * @desc    Get client's monthly closures history
 * @access  Private
 */
router.get(
  '/:id/closures',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid client ID format'),
    validate,
  ],
  getClientClosures
);

export default router;
