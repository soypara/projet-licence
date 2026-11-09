import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    // Erreurs serveur (500+) : le détail technique (base de données...) reste dans
    // la console du serveur, le visiteur ne voit qu'un message général.
    if (err.statusCode >= 500) {
      console.error("Erreur serveur :", err.message);
      return res.status(err.statusCode).json({ message: "Erreur interne du serveur." });
    }

    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Erreur inattendue :", err);
  return res.status(500).json({ message: "Erreur interne du serveur." });
}
