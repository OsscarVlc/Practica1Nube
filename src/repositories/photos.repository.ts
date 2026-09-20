import { getPool } from "../db/pool";


// Esta interfaz describe la forma de un registro de foto tal como
// aparece en la tabla photos de la base de datos
export interface PhotoRecord {
  photo_id: string;
  event_id: string;
  message: string;
  picture_path: string; // La ruta en S3 donde se guardo la foto original
  polaroid_path: string; // La ruta en S3 donde se guardo la version polaroid
  created_at: string; // La fecha de creacion del registro en la base de datos
}


// Esta funcion inserta un nuevo registro de foto en la tabla photos
export async function insertPhoto(
  photoId: string,
  eventId: string,
  message: string,
  picturePath: string,
  polaroidPath: string
): Promise<void> {
  const pool = getPool();

  // Hacemos la query de insercion usando parametros para evitar SQL injection
  await pool.query(
    `INSERT INTO photos (photo_id, event_id, message, picture_path, polaroid_path)
     VALUES ($1, $2, $3, $4, $5)`,
    [photoId, eventId, message, picturePath, polaroidPath]
  );
}



// Esta funcion cuenta cuantas fotos hay asociadas a un evento 
export async function countPhotosByEvent(eventId: string): Promise<number> {
  const pool = getPool();

  // Hacemos la query de conteo usando parametros para evitar SQL injection
  const result = await pool.query(
    `SELECT COUNT(*) AS count FROM photos WHERE event_id = $1`,
    [eventId]
  );

  // Retornamos el conteo como un numero
  // result.rows[0].count es un string, asi que lo convertimos a numero antes de retornar
  return Number(result.rows[0].count);
}



// Esta funcion obtiene las rutas de las polaroids asociadas a un evento
export async function findPolaroidPathsByEvent(eventId: string): Promise<string[]> {
  const pool = getPool();

  // Hacemos la query para obtener las rutas de las polaroids usando parametros para evitar SQL injection
  const result = await pool.query(
    `SELECT polaroid_path FROM photos WHERE event_id = $1`,
    [eventId]
  );


  // Retornamos un array de strings con las rutas de las polaroids
  return result.rows.map((row) => row.polaroid_path);
}



// Esta funcion obtiene las rutas de las fotos originales asociadas a un evento
export async function findPicturePathsByEvent(eventId: string): Promise<string[]> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT picture_path FROM photos WHERE event_id = $1`,
    [eventId]
  );


  // Retornamos un array de strings con las rutas de las fotos originales
  return result.rows.map((row) => row.picture_path);
}