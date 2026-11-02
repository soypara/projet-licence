import { Request, Response } from "express";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import * as commentService from "../services/comment.service";
import { AppError } from "../middlewares/errorHandler";

function getToken(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(
      "Token d'authentification manquant.",
      401
    );
  }

  return authorization.replace("Bearer ", "");
}

// Première lettre du nom (ou de l'adresse e-mail) : la seule chose montrée
// publiquement sur un avis.
function initialOf(req: Request) {
  const user = req.user;
  const meta = (user?.user_metadata || {}) as Record<string, unknown>;

  const source = String(
    meta.full_name || meta.name || user?.email || ""
  ).trim();

  const letter = source.match(/\p{L}|\d/u)?.[0];

  return letter ? letter.toUpperCase() : null;
}

export async function getAll(req: Request, res: Response) {
  const touristPlaceId = req.query.tourist_place_id
    ? String(req.query.tourist_place_id)
    : undefined;

  const circuitId = req.query.circuit_id
    ? String(req.query.circuit_id)
    : undefined;

  const comments =
    await commentService.listApprovedComments(
      touristPlaceId,
      circuitId
    );

  res.json(comments);
}

// MODIFIÉ : utilise le client authentifié pour que la RLS
// (policy admin) laisse voir TOUS les commentaires, pas seulement les approuvés.
export async function getAdminAll(
  req: Request,
  res: Response
) {
  const client = createAuthenticatedSupabase(
    getToken(req)
  );

  const comments = await commentService.listComments(client);
  res.json(comments);
}

export async function create(
  req: Request,
  res: Response
) {
  if (!req.user?.id) {
    throw new AppError("Utilisateur non authentifié.", 401);
  }

  const client = createAuthenticatedSupabase(
    getToken(req)
  );

  const comment = await commentService.createComment(
    client,
    req.user.id,
    req.body,
    initialOf(req)
  );

  res.status(201).json(comment);
}

export async function update(
  req: Request,
  res: Response
) {
  const client = createAuthenticatedSupabase(
    getToken(req)
  );

  const comment = await commentService.updateComment(
    client,
    String(req.params.id),
    req.body
  );

  res.json(comment);
}

export async function updateStatus(
  req: Request,
  res: Response
) {
  const client = createAuthenticatedSupabase(
    getToken(req)
  );

  const comment =
    await commentService.updateCommentStatus(
      client,
      String(req.params.id),
      req.body.status
    );

  res.json(comment);
}

export async function remove(
  req: Request,
  res: Response
) {
  const client = createAuthenticatedSupabase(
    getToken(req)
  );

  await commentService.deleteComment(
    client,
    String(req.params.id)
  );

  res.status(204).send();
}

