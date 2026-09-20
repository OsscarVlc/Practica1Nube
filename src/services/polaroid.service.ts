// Este servicio encapsula la logica de procesar imagenes y componerlas
import sharp from "sharp";

// Constantes que definen el tamaño de la foto y del marco polaroid
const PHOTO_SIZE = 128; // tamaño de la foto reducida a 128x128 px
const FRAME_PADDING = 16;    // espacio entre la foto y el borde blanco
const TEXT_AREA_HEIGHT = 60;   // espacio abajo para el mensaje
const FRAME_WIDTH = PHOTO_SIZE + FRAME_PADDING * 2;  // ancho total del marco polaroid
const FRAME_HEIGHT = PHOTO_SIZE + FRAME_PADDING * 2 + TEXT_AREA_HEIGHT; // alto total del marco polaroid


// Esta funcion recibe un Buffer con la imagen original y la reduce a 128x128 px
// usando sharp, devuelve un Buffer con la imagen reducida en formato JPEG
export async function resizePicture(originalBuffer: Buffer): Promise<Buffer> {
  return sharp(originalBuffer) 
    .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: "cover" }) // .resize() cambia el tamaño de la imagen, fit: "cover" recorta si es necesario
    .jpeg() // convierte la imagen a formato JPEG
    .toBuffer(); // .toBuffer() ejecuta todo lo encadenado y regresa una Promise<Buffer>
}




// Esta funcion recibe un Buffer con la imagen reducida y un mensaje de texto,
// y devuelve un Buffer con la imagen final compuesta como una polaroid
export async function composePolaroid(
  resizedBuffer: Buffer,
  message: string
): Promise<Buffer> {
  // Escapamos el mensaje por si trae caracteres como & < >
  const safeMessage = escapeXml(message);

  // sharp no tiene una funcion nativa para escribir texto sobre una imagen
  //  se va a generar un SVG con un elemento <text> y componerlo como si fuera otra imagen mas.

  // Generamos un SVG con el mensaje de texto, centrado horizontal y verticalmente
  const textSvg = Buffer.from(`
    <svg width="${FRAME_WIDTH}" height="${TEXT_AREA_HEIGHT}">
      <text x="50%" y="50%"
            font-family="sans-serif" font-size="14"
            fill="#333333" text-anchor="middle" dominant-baseline="middle">
        ${safeMessage}
      </text>
    </svg>
  `);

  // Creamos un lienzo blanco del tamaño del marco polaroid y superponemos la foto y el texto
  return sharp({
    create: {
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }, // blanco
    },
  })
    // .composite() superpone capas encima del lienzo base, cada
    // una posicionada con left/top (coordenadas en pixeles).
    .composite([
      { input: resizedBuffer, left: FRAME_PADDING, top: FRAME_PADDING },
      { input: textSvg, left: 0, top: FRAME_PADDING * 2 + PHOTO_SIZE },
    ])
    .jpeg()
    .toBuffer();
}



// Esta funcion escapa caracteres especiales en un string para que puedan
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}