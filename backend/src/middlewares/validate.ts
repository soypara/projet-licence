import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "./errorHandler";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".")} : ${issue.message}`)
        .join(" | ");
      return next(new AppError(`Données invalides — ${message}`, 422));
    }

    req.body = result.data;
    next();
  };
}
