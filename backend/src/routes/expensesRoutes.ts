import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expensesController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/expenses
 * Get all expenses for authenticated user
 */
router.get(
  '/',
  [
    query('includeInactive')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('includeInactive must be true or false')
  ],
  validate,
  getAllExpenses
);

/**
 * GET /api/expenses/:id
 * Get expense by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID de despesa inválido')
  ],
  validate,
  getExpenseById
);

/**
 * POST /api/expenses
 * Create new expense
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Nome da despesa é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome da despesa deve ter entre 2 e 100 caracteres'),
    body('description')
      .optional()
      .isString()
      .withMessage('Descrição deve ser uma string')
      .isLength({ max: 5000 })
      .withMessage('Descrição deve ter no máximo 5000 caracteres'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser um número positivo'),
    body('isRecurring')
      .optional()
      .isBoolean()
      .withMessage('isRecurring deve ser um booleano')
  ],
  validate,
  createExpense
);

/**
 * PUT /api/expenses/:id
 * Update expense
 */
router.put(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID de despesa inválido'),
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
      .withMessage('Descrição deve ser uma string')
      .isLength({ max: 5000 })
      .withMessage('Descrição deve ter no máximo 5000 caracteres'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser um número positivo'),
    body('isRecurring')
      .optional()
      .isBoolean()
      .withMessage('isRecurring deve ser um booleano'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive deve ser um booleano')
  ],
  validate,
  updateExpense
);

/**
 * DELETE /api/expenses/:id
 * Delete expense (soft delete)
 */
router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID de despesa inválido')
  ],
  validate,
  deleteExpense
);

export default router;
