/**
 * Préparation de l'environnement de test (exécuté avant tout le reste).
 *
 * - Utilise une base de données ISOLÉE (`data/test.db`), jamais la base réelle.
 * - Fixe des mots de passe de démonstration déterministes.
 * - Neutralise l'envoi d'emails (les codes iront dans la console, aucun email
 *   réel n'est expédié pendant les tests).
 */
import fs from "fs";
import path from "path";

// Base de test dédiée, repartie de zéro à chaque exécution.
const testDbPath = path.join(process.cwd(), "data", "test.db");
process.env.DB_PATH = testDbPath;
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

// Identifiants de démonstration fixes (le seed et l'admin les utilisent).
process.env.ADMIN_PASSWORD = "Admin1234!";
process.env.DEMO_CLIENT_PASSWORD = "Test1234!";

// Chaînes vides = mailer non configuré -> repli console, aucun email envoyé.
// (dotenv ne réécrit pas une variable déjà définie, donc ceci a la priorité.)
process.env.GMAIL_USER = "";
process.env.GMAIL_APP_PASSWORD = "";
