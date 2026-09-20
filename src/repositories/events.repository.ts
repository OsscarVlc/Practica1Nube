// Este archivo contiene la logica para hacer queries a la tabla events de la base de datos
import { getPool } from "../db/pool";

// Esta interfaz describe la forma de un registro de evento tal como
// aparece en la tabla events de la base de datos
export interface EventRecord {
  event_id: string;
  client_name: string;
  event_type: string;
  event_date: string;
  created_at: string;
}

// Esta funcion inserta un nuevo registro de evento en la tabla events
export async function insertarEvento(
  eventId: string,
  clientName: string,
  eventType: string,
  eventDate: string
): Promise<void> {
  const pool = getPool();

// Hacemos la query de insercion usando parametros para evitar SQL injection
  await pool.query(
    `INSERT INTO events (event_id, client_name, event_type, event_date)
     VALUES ($1, $2, $3, $4)`,
    [eventId, clientName, eventType, eventDate]
  );
}
