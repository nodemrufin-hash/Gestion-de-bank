/**
 * Point d'entrée du serveur Express.
 *
 * Configure les middlewares (CORS, parsing JSON/urlencoded), monte les routes
 * de l'API sous `/api`, puis démarre l'écoute HTTP et initialise la base.
 *
 * `dotenv/config` charge les variables du fichier `.env` (ex: ANTHROPIC_API_KEY)
 * — importé en premier pour qu'elles soient disponibles partout.
 *
 * Le frontend est servi séparément (application Next.js autonome) : ce serveur
 * n'expose que l'API.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDb, closeDb } from "./database/database";
import { ensureAuthSetup } from "./controllers/auth";
import { seed } from "./database/seed";
import routes from "./routes";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

/** Petit point de santé : utile pour vérifier que l'API répond (Render, tests). */
app.get("/", (_req, res) => {
  res.json({ service: "API Banque Libéo", status: "ok" });
});

/**
 * Prépare la base au démarrage :
 *  1. crée/charge la base et applique le schéma ;
 *  2. la remplit avec les données de démonstration si elle est vide (`seed` est
 *     idempotent : il ne fait rien si des clients existent déjà) ;
 *  3. applique les migrations et crée le compte administrateur.
 *
 * L'étape 2 rend le déploiement autonome : sur un hébergement au disque
 * éphémère (palier gratuit), la base est recréée à chaque démarrage et les
 * comptes de démonstration sont donc toujours disponibles.
 */
async function start() {
  const db = await getDb();
  await seed(); // avant ensureAuthSetup : les clients créés y reçoivent leur mot de passe
  await ensureAuthSetup(db);
  console.log(`Serveur démarré sur le port ${PORT}`);
}

app.listen(PORT, () => {
  start().catch(console.error);
});

process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});
