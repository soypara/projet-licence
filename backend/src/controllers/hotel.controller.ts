import { Request, Response } from "express";
import * as hotelService from "../services/hotel.service";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";

function getAuthenticatedClient(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Token d'authentification manquant.");
  }

  const token = authorization.replace("Bearer ", "");

  return createAuthenticatedSupabase(token);
}

export async function getAll(_req: Request, res: Response) {
  const hotels = await hotelService.listHotels();
  res.json(hotels);
}

export async function getOne(req: Request, res: Response) {
  const hotel = await hotelService.getHotelById(
    String(req.params.id)
  );

  res.json(hotel);
}

export async function create(req: Request, res: Response) {
  const client = getAuthenticatedClient(req);

  const hotel = await hotelService.createHotel(
    client,
    req.body
  );

  res.status(201).json(hotel);
}

export async function update(req: Request, res: Response) {
  const client = getAuthenticatedClient(req);

  const hotel = await hotelService.updateHotel(
    client,
    String(req.params.id),
    req.body
  );

  res.json(hotel);
}

export async function remove(req: Request, res: Response) {
  const client = getAuthenticatedClient(req);

  await hotelService.deleteHotel(
    client,
    String(req.params.id)
  );

  res.status(204).send();
}