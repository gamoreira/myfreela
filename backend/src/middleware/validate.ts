import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * Should be used after validation chains
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    interface ValidationError {
      field?: string;
      message: string;
    }

    interface ValidationErrorResponse {
      error: string;
      details: ValidationError[];
    }

    const response: ValidationErrorResponse = {
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    };
    res.status(400).json(response);
    return;
  }

  next();
};
