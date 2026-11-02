import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { supabase } from "./config/supabase";
//console.log("Supabase URL :", process.env.SUPABASE_URL); // test hijerevana hoe miconnect ve ny supabase

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "API touristique Madagascar opérationnelle 🇲🇬",
  });
});

app.get("/api/circuits", async (_req, res) => {
  const { data, error } = await supabase
    .from("circuits")
    .select("*");

  console.log("DATA :", data);
  console.log("ERROR :", error);

  if (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des circuits",
      error: error.message,
    });
  }

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Backend lancé sur http://localhost:${PORT}`);
});