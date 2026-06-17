import express from "express";
import cors from "cors";
import path from "path";
import { getDb, closeDb } from "./database/database";
import routes from "./routes";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Serve frontend build in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "..", "..", "out");
  app.use(express.static(frontendPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

async function start() {
  await getDb();
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
}

app.listen(PORT, () => {
  start().catch(console.error);
});

process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});
