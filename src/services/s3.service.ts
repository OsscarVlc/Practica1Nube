// Este servicio encapsula la logica de subir archivos a S3
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";



const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "wedding-photo-bucket";

// Creamos un cliente de S3 que usaremos para subir archivos
const s3Client = new S3Client({ region: REGION });


// Esta funcion sube un archivo a S3
export async function uploadToS3(
  key: string, // La "key" es el nombre del archivo en S3
  buffer: Buffer, // El "buffer" es el contenido del archivo en memoria
  contentType: string // El "contentType" es el tipo MIME del archivo 
): Promise<void> {

    // Creamos un comando de S3 para subir el archivo
    //  PutObjectCommand es la clase que representa la operacion de subir un objeto a S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  // Enviamos el comando al cliente de S3 para que ejecute la operacion
  await s3Client.send(command);
}





// Esta funcion descarga un archivo de S3 y lo devuelve como un Buffer
// Un buffer es un objeto de Node.js que representa datos binarios en memoria, como un archivo o una imagen
export async function downloadFromS3(key: string): Promise<Buffer> {

  // Creamos un comando de S3 para obtener el archivo
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // Enviamos el comando al cliente de S3 para que ejecute la operacion
  const response = await s3Client.send(command);

  // response.Body es un stream de Node.js que representa el contenido del archivo
  // Lo convertimos a un Buffer para poder manipularlo en memoria
  const stream = response.Body as NodeJS.ReadableStream;

  // Creamos un array de chunks (pedazos) de datos que vamos a ir llenando con cada pedazo que llega del stream
  const chunks: Buffer[] = [];

  // for await es un bucle asincrono que itera sobre cada chunk que llega del stream
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  // Buffer.concat junta todos los pedazos en un solo Buffer final.
  return Buffer.concat(chunks);
}


// Esta funcion elimina un archivo de S3
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}