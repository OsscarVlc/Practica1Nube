import { Request, Response } from "express";
import { randomUUID } from "crypto"; // randomUUID genera IDs aleatorios tipo UUID v4, nativo de Node
import { EventRecord, insertarEvento } from "../repositories/events.repository";
import { getPool } from "../db/pool";
import { countPhotosByEvent } from "../repositories/photos.repository";


// Este controller maneja la ruta POST /events, que crea un nuevo evento
export async function crearEvento(req: Request, res: Response): Promise<void> {

    // Extraemos los campos del body de la request
  const { client_name, event_type, event_date } = req.body;

    // Validamos que los campos requeridos esten presentes
  if (!client_name || !event_type || !event_date) {
    res.status(400).json({
      error: "Se requieren los siguientes datos:client_name, event_type y event_date",
    });
    return;
  }


  // Generamos un nuevo UUID para el evento
  const eventId = randomUUID();

  try {
    await insertarEvento(eventId, client_name, event_type, event_date);

    res.status(201).json({ event_id: eventId });
  } catch (err) {
    console.error("Error al crear evento:", err);
    res.status(500).json({ error: "No se pudo crear el evento" });
  }
}




    
// Este controller maneja la ruta GET /events/:eventId, que obtiene los detalles de un evento por su ID
export async function findEventById(eventId: string): Promise<EventRecord | null> {
  const pool = getPool();


  // Hacemos la query a la base de datos para buscar el evento por su ID
  const result = await pool.query(
    `SELECT event_id, client_name, event_type, event_date, created_at
     FROM events
     WHERE event_id = $1`,
    [eventId]
  );

  // pool.query regresa un objeto con .rows (un array). Si no hay
  // resultados, .rows[0] es undefined - el operador ?? lo convierte en null
  return result.rows[0] ?? null;
}



// Este controller maneja la ruta GET /events/:eventId, que obtiene los detalles de un evento por su ID
export async function getEvent(req: Request, res: Response): Promise<void> {

  // Extraemos el event_id de los parametros de la ruta
  const { event_id } = req.params;

  try {
    // Buscamos el evento en la base de datos
    const event = await findEventById(event_id);

    if (!event) {
      // Si no se encuentra el evento, respondemos con 404 Not Found
      res.status(404).json({ error: "El evento no existe" });
      return;
    }

    // Contamos cuantas fotos hay asociadas a este evento
    const photoCount = await countPhotosByEvent(event_id);

    // Respondemos con los detalles del evento y el conteo de fotos
    res.status(200).json({
      event_id: event.event_id,
      client_name: event.client_name,
      event_type: event.event_type,
      event_date: event.event_date,
      created_at: event.created_at,
      photo_count: photoCount,
    });
  } catch (err) {
    console.error("Error al consultar evento:", err);
    res.status(500).json({ error: "No se pudo consultar el evento" });
  }
}