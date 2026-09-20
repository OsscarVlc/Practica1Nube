//Este archivo se llama pool porque contiene la logica para crear y manejar un "pool" de conexiones a la base de datos
//  Un pool es un conjunto de conexiones que se mantienen abiertas y se reutilizan,
//  en lugar de abrir y cerrar una conexion nueva cada vez que se necesita acceder a la DB
//  Esto mejora el rendimiento y la eficiencia de la app.

import { Pool } from "pg"; // Importamos la clase Pool del driver de PostgreSQL
import { getDbCredentials } from "../config/secrets"; // Importamos la funcion que obtiene las credenciales de la DB desde AWS Secrets Manager

// Variable para cachear el pool una vez que lo creamos por primera vez
//  Esto es importante porque queremos que TODA la app use el mismo pool (singleton)
let pool: Pool | null = null;


// Esta funcion es la que se llama desde server.ts para inicializar el pool de conexiones
//  Es async porque hace una llamada de red a AWS Secrets Manager para obtener las credenciales de la DB
export async function initPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

// Llamamos a la funcion que obtiene las credenciales de la DB desde AWS Secrets Manager
  const creds = await getDbCredentials();


  // Creamos el pool de conexiones usando las credenciales obtenidas
  //  max: 10 significa que el pool puede tener hasta 10 conexiones abiertas al mismo tiempo
  pool = new Pool({
    host: creds.host,
    port: creds.port,
    database: creds.dbname,
    user: creds.username,
    password: creds.password,
    max: 10, // maximo de conexiones simultaneas en el pool
    ssl:{
      rejectUnauthorized: false // Esto es necesario para conectarse a RDS con SSL, pero en produccion deberia ser true
    }
  });

  return pool;
}


// Esta funcion es la que se llama desde los controllers para obtener el pool de conexiones
//  Si el pool no ha sido inicializado (osea que initPool() no se ha llamado), lanza un error
export function getPool(): Pool {
  if (!pool) {
    throw new Error("El pool de DB no ha sido inicializado. Llama a initPool() primero.");
  }
  return pool;
}