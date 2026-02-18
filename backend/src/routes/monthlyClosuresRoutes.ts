import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getAllClosures,
  getClosureById,
  createClosure,
  updateClosure,
  closeClosure,
  reopenClosure,
  deleteClosure,
  addExpenseToClosure,
  updateClosureExpense,
  removeExpenseFromClosure
} from '../controllers/monthlyClosuresController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/monthly-closures
 * Get all monthly closures for authenticated user
 */
router.get('/', getAllClosures);

/**
 * GET /api/monthly-closures/:id
 * Get monthly closure by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID')
  ],
  validate,
  getClosureById
);

/**
 * POST /api/monthly-closures
 * Create new monthly closure
 */
router.post(
  '/',
  [
    body('month')
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    body('year')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100'),
    body('taxPercentage')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Tax percentage must be between 0 and 100'),
    body('hourlyRate')
      .isFloat({ min: 0.01 })
      .withMessage('Hourly rate must be a positive number'),
    body('notes')
      .optional()
      .isString()
      .withMessage('Notes must be a string')
      .isLength({ max: 5000 })
      .withMessage('Notes must be at most 5000 characters'),
    body('expenseIds')
      .optional()
      .isArray()
      .withMessage('expenseIds must be an array'),
    body('expenseIds.*')
      .optional()
      .isUUID()
      .withMessage('Each expenseId must be a valid UUID')
  ],
  validate,
  createClosure
);

/**
 * PUT /api/monthly-closures/:id
 * Update monthly closure (notes and taxPercentage)
 */
router.put(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID'),
    body('taxPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Tax percentage must be between 0 and 100'),
    body('hourlyRate')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Hourly rate must be a positive number'),
    body('notes')
      .optional()
      .isString()
      .withMessage('Notes must be a string')
      .isLength({ max: 5000 })
      .withMessage('Notes must be at most 5000 characters')
  ],
  validate,
  updateClosure
);

/**
 * PATCH /api/monthly-closures/:id/close
 * Close monthly closure
 */
router.patch(
  '/:id/close',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID')
  ],
  validate,
  closeClosure
);

/**
 * PATCH /api/monthly-closures/:id/reopen
 * Reopen monthly closure
 */
router.patch(
  '/:id/reopen',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID')
  ],
  validate,
  reopenClosure
);

/**
 * DELETE /api/monthly-closures/:id
 * Delete monthly closure
 */
router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID')
  ],
  validate,
  deleteClosure
);

/**
 * POST /api/monthly-closures/:id/expenses
 * Add expense to monthly closure
 */
router.post(
  '/:id/expenses',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID'),
    body('expenseId')
      .optional()
      .isUUID()
      .withMessage('Invalid expense ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Nome da despesa não pode ser vazio')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome da despesa deve ter entre 2 e 100 caracteres'),
    body('description')
      .optional()
      .isString()
      .withMessage('Descrição deve ser uma string'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser um número positivo')
  ],
  validate,
  addExpenseToClosure
);

/**
 * PUT /api/monthly-closures/:id/expenses/:expenseId
 * Update expense in monthly closure
 */
router.put(
  '/:id/expenses/:expenseId',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID'),
    param('expenseId')
      .isUUID()
      .withMessage('Invalid expense ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Nome da despesa não pode ser vazio')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome da despesa deve ter entre 2 e 100 caracteres'),
    body('description')
      .optional()
      .isString()
      .withMessage('Descrição deve ser uma string'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser um número positivo')
  ],
  validate,
  updateClosureExpense
);

/**
 * DELETE /api/monthly-closures/:id/expenses/:expenseId
 * Remove expense from monthly closure
 */
router.delete(
  '/:id/expenses/:expenseId',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid closure ID'),
    param('expenseId')
      .isUUID()
      .withMessage('Invalid expense ID')
  ],
  validate,
  removeExpenseFromClosure
);

export default router;
