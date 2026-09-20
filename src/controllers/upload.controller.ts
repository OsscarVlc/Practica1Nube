import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { uploadToS3 } from "../services/s3.service";
import { resizePicture, composePolaroid } from "../services/polaroid.service";
import { insertPhoto } from "../repositories/photos.repository";
import { findEventById } from "../controllers/events.controller";
import archiver from "archiver";
import { downloadFromS3, deleteFromS3 } from "../services/s3.service";
import {findPolaroidPathsByEvent,findPicturePathsByEvent} from "../repositories/photos.repository";



// function uploadPhoto maneja la ruta POST /upload, que recibe un archivo de foto y un mensaje para un evento
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  const { event_id, message } = req.body;

    // req.file es el archivo subido por multer, que lo almacena en memoria como un Buffer
  const file = req.file;

  // Validamos que los campos requeridos esten presentes
  if (!event_id || !message || !file) {
    res.status(400).json({
      error: "Se requieren event_id, message y un archivo photo",
    });
    return;
  }

  // Validamos que el evento exista antes de procesar la foto
  const event = await findEventById(event_id);
  if (!event) {
    res.status(404).json({ error: "El evento no existe" });
    return;
  }

  try {

    // genera un nuevo UUID para la foto y definir las rutas en S3
    const photoId = uuidv4();
    const picturePath = `pictures/${photoId}.jpg`;
    const polaroidPath = `polaroids/${photoId}.jpg`;

    //  reducir y subir la foto original
    const resizedBuffer = await resizePicture(file.buffer);
    await uploadToS3(picturePath, resizedBuffer, "image/jpeg");

    // componer y subir la polaroid
    const polaroidBuffer = await composePolaroid(resizedBuffer, message);
    await uploadToS3(polaroidPath, polaroidBuffer, "image/jpeg");

    // insertar un nuevo registro de foto en la base de datos
    await insertPhoto(photoId, event_id, message, picturePath, polaroidPath);

    // responder con los detalles de la foto subida
    res.status(201).json({
      photo_id: photoId,
      picture_path: picturePath,
      polaroid_path: polaroidPath,
    });
  } catch (err) {
    console.error("Error al procesar upload:", err);
    res.status(500).json({ error: "No se pudo procesar la foto" });
  }
}



// function finishEvent maneja la ruta POST /finish, que finaliza un evento y devuelve un zip con todas las polaroids asociadas
export async function finishEvent(req: Request, res: Response): Promise<void> {
  // extraemos event_id del body de la solicitud
  const { event_id } = req.body;


  if (!event_id) {
    res.status(400).json({ error: "Se requiere event_id" });
    return;
  }

  const event = await findEventById(event_id);
  if (!event) {
    res.status(404).json({ error: "El evento no existe" });
    return;
  }

  try {
    // obtenemos las rutas de las polaroids asociadas al evento
    const polaroidPaths = await findPolaroidPathsByEvent(event_id);

    if (polaroidPaths.length === 0) {
      res.status(404).json({ error: "El evento no tiene fotos asociadas" });
      return;
    }
  
    // configuramos los headers de la respuesta para indicar que es un archivo zip
    res.setHeader("Content-Type", "application/zip");
    // Content-Disposition indica al navegador que debe descargar el archivo con el nombre especificado
    res.setHeader("Content-Disposition", `attachment; filename="event-${event_id}.zip"`);

    // creamos un stream de zip usando archiver
    //un stream es un flujo de datos que se puede leer o escribir de manera continua,
    //  sin necesidad de cargar todo en memoria
    const archive = archiver("zip", { zlib: { level: 9 } });

    // archive.pipe(res) conecta el stream del zip con la respuesta HTTP,
    // de modo que todo lo que se agregue al zip se enviara al cliente en tiempo real
    archive.pipe(res);

    // iteramos sobre las rutas de las polaroids, descargamos cada una desde S3 y la agregamos al zip
    for (const polaroidPath of polaroidPaths) {
      const buffer = await downloadFromS3(polaroidPath);

      // extraemos el nombre del archivo de la ruta completa para usarlo dentro del zip
      const fileName = polaroidPath.split("/").pop() as string;

      // agregamos el buffer de la polaroid al zip con el nombre de archivo correspondiente
      archive.append(buffer, { name: fileName });
    }

    // finalizamos el zip, lo que indica que no se agregaran mas archivos
    await archive.finalize();

    // eliminamos las fotos originales del bucket S3 para liberar espacio
    const picturePaths = await findPicturePathsByEvent(event_id);
    for (const picturePath of picturePaths) {
      await deleteFromS3(picturePath);
    }
  } catch (err) {
    console.error("Error al finalizar evento:", err);

    // si ocurre un error, respondemos con un error 500 y un mensaje
    if (!res.headersSent) {
      res.status(500).json({ error: "No se pudo finalizar el evento" });
    }
  }
}