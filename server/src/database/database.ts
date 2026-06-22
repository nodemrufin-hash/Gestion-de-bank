/**
 * Couche d'accès à la base de données (sql.js / SQLite en mémoire).
 *
 * La base est entièrement chargée en mémoire puis persistée sur disque
 * (`data/banque.db`) après chaque écriture via `saveDb`. Une seule instance
 * partagée est conservée dans le module.
 */
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { SCHEMA } from "./schema";

const DB_PATH = path.join(__dirname, "..", "..", "data", "banque.db");

let db: SqlJsDatabase | null = null;

/**
 * Renvoie l'instance de base de données, en la créant/chargeant au premier appel.
 * Charge le fichier existant s'il est présent, applique le schéma puis sauvegarde.
 * @returns L'instance sql.js partagée.
 */
export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(SCHEMA);
  saveDb();
  return db;
}

/** Exporte la base en mémoire et l'écrit sur disque (`data/banque.db`). */
export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/** Sauvegarde puis ferme la base et libère l'instance (arrêt du serveur). */
export function closeDb(): void {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

/** Ferme l'instance et supprime le fichier de base (utilisé par la réinit. globale). */
export function resetDb(): void {
  if (db) {
    db.close();
    db = null;
  }
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
}
