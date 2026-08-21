process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err && (err as any).stack ? (err as any).stack : err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason && (reason as any).stack ? (reason as any).stack : reason);
});

import { addAlias } from "module-alias";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
const projectRoot = path.resolve(__dirname, "..");
const aliasPath = path.join(projectRoot, isProduction ? "dist" : "src");
addAlias("@", aliasPath);

import { createApp } from "./app";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log("Starting server...");
    const { httpServer } = await createApp();
    console.log("App created successfully");

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    httpServer.on("error", (err) => {
      console.error("Server error:", err && (err as any).stack ? (err as any).stack : err);
      process.exit(1);
    });
  } catch (err) {
    console.error("BOOTSTRAP ERROR:", err && (err as any).stack ? (err as any).stack : err);
    process.exit(1);
  }
}

bootstrap();