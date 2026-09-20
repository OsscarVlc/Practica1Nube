import { Router } from "express";
import multer from "multer";
import {crearEvento, getEvent} from "../controllers/events.controller";
import { finishEvent, uploadPhoto } from "../controllers/upload.controller";

const router = Router();

// Configuramos multer para almacenar los archivos en memoria (no en disco)
// Esto nos permite acceder al archivo subido como un Buffer en req.file.buffer
const upload = multer({ storage: multer.memoryStorage() });


// Definimos las rutas de la API


// Ruta POST /events para crear un nuevo evento
router.post("/events", crearEvento);

// Ruta POST /upload para subir una foto y un mensaje para un evento
//.single("photo") indica que esperamos un solo archivo con el campo "photo" en el form-data
router.post("/upload", upload.single("photo"), uploadPhoto); 

// Ruta GET /events/:event_id para obtener los detalles de un evento
router.get("/events/:event_id", getEvent);

// Ruta POST /finish para finalizar un evento y descargar todas las polaroids en un zip
router.post("/finish", finishEvent);


export default router;