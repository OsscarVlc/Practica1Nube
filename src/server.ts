import { createApp } from "./app";
import { initPool } from "./db/pool";

const PORT = process.env.PORT || 3000;


async function main() {


  await initPool();


  const app = createApp();

  
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}


main().catch((err) => {
  console.error("Error fatal al arrancar el servidor:", err);
  process.exit(1);
});