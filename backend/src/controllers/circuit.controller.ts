import { Request, Response } from "express";
import * as circuitService from "../services/circuit.service";
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
  const circuits = await circuitService.listCircuits();
  res.json(circuits);
}

export async function getOne(req: Request, res: Response) {
  const circuit = await circuitService.getCircuitById(
    String(req.params.id)
  );

  res.json(circuit);
}

export async function create(req: Request, res: Response) {
  const client = getAuthenticatedClient(req);

  const circuit = await circuitService.createCircuit(
    client,
    req.body
  );

  res.status(201).json(circuit);
}

export async function update(req: Request, res: Response) {
  const client = getAuthenticatedClient(req);

  const circuit = await circuitService.updateCircuit(
    client,
    String(req.params.id),
    req.body
  );

  res.json(circuit);
}

export async function remove(req: Request, res: Response) {
  const client = getAuthenticatedClient(req);

  await circuitService.deleteCircuit(
    client,
    String(req.params.id)
  );

  res.status(204).send();
}

export async function replacePlaces(
  req: Request,
  res: Response
) {
  const client = getAuthenticatedClient(req);

  await circuitService.replaceTouristPlaces(
    client,
    String(req.params.id),
    req.body.place_ids
  );

  res.json({ message: "Étapes du circuit enregistrées." });
}

export async function replaceDepartures(
  req: Request,
  res: Response
) {
  const client = getAuthenticatedClient(req);

  await circuitService.replaceDepartures(
    client,
    String(req.params.id),
    req.body.dates
  );

  res.json({ message: "Dates de départ enregistrées." });
}

export async function linkTouristPlace(
  req: Request,
  res: Response
) {
  const client = getAuthenticatedClient(req);

  await circuitService.attachTouristPlace(
    client,
    String(req.params.id),
    String(req.params.placeId)
  );

  res.status(201).json({
    message: "Lieu ajouté au circuit.",
  });
}

export async function unlinkTouristPlace(
  req: Request,
  res: Response
) {
  const client = getAuthenticatedClient(req);

  await circuitService.detachTouristPlace(
    client,
    String(req.params.id),
    String(req.params.placeId)
  );

  res.status(204).send();
}
