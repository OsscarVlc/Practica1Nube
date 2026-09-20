import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";


const SECRET_NAME = process.env.RDS_SECRET_NAME || "wedding-photo-rds-secret"; // Nombre del secret en AWS Secrets Manager
const REGION = process.env.AWS_REGION || "us-east-1"; //Region donde esta el secret

// Estas variables de entorno son para la conexion a la base de datos, pero no las usamos directamente
const DB_HOST = process.env.DB_HOST as string;
const DB_PORT = Number(process.env.DB_PORT) || 5432;
const DB_NAME = process.env.DB_NAME || "postgres";


// Definimos una interfaz para los datos que esperamos recibir del secret
export interface DbCredentials {
  host: string;
  port: number;
  dbname: string;
  username: string;
  password: string;
}

// Variable para cachear las credenciales una vez que las leemos por primera vez
let cachedCredentials: DbCredentials | null = null;

// Esta funcion es la que exportamos para que otras partes de la app puedan obtener 
// las credenciales de la base de datos. Es async porque hace una llamada de red a AWS Secrets Manager.
export async function getDbCredentials(): Promise<DbCredentials> {
 
  // Validamos si ya tenemos las credenciales cacheadas, para no hacer la llamada de red cada vez que se necesiten
  if (cachedCredentials) {
    return cachedCredentials;
  }

  // Creamos un cliente de AWS Secrets Manager, indicando la region donde esta el secret
  const client = new SecretsManagerClient({ region: REGION });

 // Creamos un comando para obtener el valor del secret, indicando el nombre del secret que queremos leer
  const command = new GetSecretValueCommand({ SecretId: SECRET_NAME });

  // Ejecutamos el comando y esperamos la respuesta
  const response = await client.send(command);

  // Validamos que la respuesta tenga un SecretString, que es donde vienen los datos del secret en formato JSON
  if (!response.SecretString) {
    throw new Error(`El secret ${SECRET_NAME} no tiene SecretString`);
  }

  // El secret viene como un string de texto que contiene JSON
  // se converte a JSON.parse.
  const parsed = JSON.parse(response.SecretString);

  cachedCredentials = {
    host: parsed.host,
    port: Number(parsed.port) || 5432, // Si no viene el puerto, usamos el 5432 por defecto
    dbname: parsed.dbname,
    username: parsed.username,
    password: parsed.password,
  };

  // Retornamos las credenciales cacheadas para que puedan ser usadas por otras partes de la app
  return cachedCredentials;
}