import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";

import apiRoutes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

// import { supabase } from "./config/supabase";
// ↑ Vient du code 1.
// La connexion Supabase est maintenant utilisée dans les routes,
// donc cet import n'est plus nécessaire directement dans server.ts.
// On le conserve ici en commentaire pour garder la trace de l'ancien fonctionnement.

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://192.168.1.126:3000",
        "http://192.168.56.1:3000"
    ],
}));

app.use(helmet());

app.use(express.json());


// ============================================================
// ROUTE PRINCIPALE
// ============================================================

app.get("/", (_req, res) => {
  res.json({
    message: "Mandeha lessy ahhh 🇲🇬",
  });
});


// ============================================================
// ROUTES API
// ============================================================

app.use("/api", apiRoutes);


// ============================================================
// ANCIENNE ROUTE /api/circuits — CODE 1
// ============================================================

// Cette route était directement définie dans server.ts dans le code 1.
// Dans le code 2, elle a été déléguée à ./routes.
// On la conserve donc en commentaire pour ne pas perdre l'ancien code.

// app.get("/api/circuits", async (_req, res) => {
//   const { data, error } = await supabase
//     .from("circuits")
//     .select("*");

//   console.log("DATA :", data);
//   console.log("ERROR :", error);

//   if (error) {
//     return res.status(500).json({
//       message: "Erreur lors de la récupération des circuits",
//       error: error.message,
//     });
//   }

//   res.json(data);
// });


// ============================================================
// GESTION GLOBALE DES ERREURS
// ============================================================

// Toujours en dernier : capte les erreurs de toutes les routes ci-dessus

app.use(errorHandler);


// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================

app.listen(PORT, () => {
  console.log(`Backend lancé sur http://localhost:${PORT}`);
});