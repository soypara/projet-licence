import { Request, Response } from "express";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import * as reservationService from "../services/reservation.service";
import { AppError } from "../middlewares/errorHandler";

function getClient(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("Token d'authentification manquant.", 401);
  }

  return createAuthenticatedSupabase(authorization.replace("Bearer ", ""));
}

export async function create(req: Request, res: Response) {
  const reservation = await reservationService.createReservation(
    getClient(req),
    req.user!.id,
    req.body
  );

  res.status(201).json(reservation);
}

export async function getMine(req: Request, res: Response) {
  const reservations = await reservationService.listMyReservations(
    getClient(req),
    req.user!.id
  );

  res.json(reservations);
}

export async function getAll(req: Request, res: Response) {
  const reservations = await reservationService.listAllReservations(
    getClient(req)
  );

  res.json(reservations);
}

export async function updateStatus(req: Request, res: Response) {
  const reservation = await reservationService.updateReservationStatus(
    getClient(req),
    String(req.params.id),
    req.body.status
  );

  res.json(reservation);
}

export async function pay(req: Request, res: Response) {
  const reservation = await reservationService.payReservation(
    getClient(req),
    String(req.params.id),
    req.body
  );

  res.json(reservation);
}
