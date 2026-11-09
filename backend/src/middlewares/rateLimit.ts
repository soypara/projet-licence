import { Request, Response, NextFunction } from "express";

// Limiteur de requêtes simple, en mémoire (pas de dépendance à installer).
// rateLimit(30, 60) = au plus 30 requêtes par minute et par adresse IP.
// Suffisant pour un site unique ; redémarre à zéro si le serveur redémarre.
export function rateLimit(max: number, windowSeconds: number) {
  const hits = new Map<string, { count: number; reset: number }>();

  // nettoyage régulier pour ne pas grossir indéfiniment
  setInterval(() => {
    const now = Date.now();
    hits.forEach((v, k) => {
      if (v.reset < now) hits.delete(k);
    });
  }, 60_000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowSeconds * 1000 });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ message: "Trop de requêtes. Réessaie dans un instant." });
    }

    next();
  };
}
