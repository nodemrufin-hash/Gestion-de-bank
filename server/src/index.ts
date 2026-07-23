/**
 * Point d'entrée du serveur : démarre l'écoute HTTP et initialise la base.
 *
 * L'application elle-même est définie dans `app.ts` (pour rester testable sans
 * ouvrir de port).
 */
import { app, initDatabase } from "./app";
import { closeDb } from "./database/database";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  initDatabase()
    .then(() => console.log(`Serveur démarré sur le port ${PORT}`))
    .catch(console.error);
});

process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});
