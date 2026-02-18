import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authorize admin-only routes.
 * Must be used after the `authenticate` middleware.
 */
export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado!' });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
    return;
  }

  next();
};
