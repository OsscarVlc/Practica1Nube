import express, { Express } from "express";
import routes from "./routes";


export function createApp(): Express {
  const app = express();

  app.use(express.json());

    // Configuramos las rutas de la app
  app.use("/", routes);

  return app;
}