import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Prépare l'environnement de test (base isolée, mots de passe, pas d'email)
    // AVANT le chargement du code applicatif.
    setupFiles: ["./src/__tests__/setup.ts"],
    // Un seul fichier à la fois : la base sql.js est une instance partagée.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
