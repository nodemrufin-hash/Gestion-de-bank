/**
 * Construction de l'application Express (sans écoute réseau).
 *
 * Séparé de `index.ts` pour être importable par les tests automatisés : ceux-ci
 * exercent l'application directement (via Supertest) sans démarrer de serveur.
 *
 * `dotenv/config` charge le fichier `.env` — importé en premier pour que les
 * variables soient disponibles partout.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDb } from "./database/database";
import { ensureAuthSetup } from "./controllers/auth";
import { seed } from "./database/seed";
import routes from "./routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use("/api", routes);

/** Point de santé : vérifie que l'API répond (Render, tests). */
app.get("/", (_req, res) => {
  res.json({ service: "API Banque Libéo", status: "ok" });
});

/**
 * Prépare la base : applique le schéma, la remplit avec les données de
 * démonstration si elle est vide (`seed` est idempotent), puis applique les
 * migrations et crée le compte administrateur.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await seed(); // avant ensureAuthSetup : les clients créés y reçoivent leur mot de passe
  await ensureAuthSetup(db);
}
