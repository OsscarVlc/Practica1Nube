# Practica 1 Nube
## Oscar Emanuel Velasco Casas — Expediente 754888


## Arquitectura

- **EC2** — corre el backend en TypeScript/Express, con el instance profile `LabInstanceProfile`
- **S3** — almacena las fotos originales reducidas (`pictures/`) y las polaroids  (`polaroids/`).
- **RDS (PostgreSQL)** — tablas `events` y `photos`, relacionadas por `event_id`.
- **Secrets Manager** — guarda las credenciales de RDS (usuario/password); la app las lee en tiempo de ejecución, nunca hardcodeadas ni en variables de ambiente.


## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/events` | Crea un evento. Body: `{ client_name, event_type, event_date }`. Regresa `event_id`. |
| `POST` | `/upload` | Sube una foto. `form-data`: `event_id`, `message`, `photo` (archivo). |
| `GET` | `/events/:event_id` | Regresa metadata del evento y número de fotos asociadas. |
| `POST` | `/finish` | Empaqueta las polaroids del evento en un `.zip` descargable y borra las fotos originales de S3. Body: `{ event_id }`. |

## Requisitos

- Node.js 20+
- Una instancia RDS PostgreSQL con las tablas creadas (ver `schema.sql`)
- Un bucket S3
- Un secret en Secrets Manager con las credenciales de RDS
- Una instancia EC2 con el instance profile `LabInstanceProfile` asignado

## Cómo correrlo

1. Clona el repositorio y entra a la carpeta del proyecto:
```bash
   git clone https://github.com/OsscarVlc/Practica1Nube.git
   cd Practica1Nube
```

2. Instala las dependencias:
```bash
   npm install
```

3. Crea un archivo `.env` en la raíz con las siguientes variables:
PORT=3000
AWS_REGION=<tu-region>
RDS_SECRET_NAME=<ARN o nombre del secret en Secrets Manager>
DB_HOST=<endpoint de tu RDS>
DB_PORT=5432
DB_NAME=<nombre de la base de datos>
S3_BUCKET_NAME=<nombre de tu bucket>



4. Corre el schema contra tu RDS (una sola vez, para crear las tablas):
```bash
   PGPASSWORD='<password>' psql -h <endpoint> -p 5432 -U <usuario> -d <dbname> -f schema.sql
```

5. Levanta el servidor (debe correr en una EC2 con el instance profile asignado, ya que lee las credenciales de RDS desde Secrets Manager usando ese rol):
```bash
   npm run dev
```
   O, para producción:
```bash
   npm run build
   npm start
```

## Eliminar los recursos (teardown)

El script `teardown.sh` elimina la instancia EC2, la instancia RDS, y vacía/elimina el bucket S3.

1. Crea un archivo `.env.teardown` en la raíz con:
AWS_REGION=<tu-region>
EC2_INSTANCE_ID=<id de tu instancia EC2>
RDS_INSTANCE_ID=<identificador de tu instancia RDS>
S3_BUCKET_NAME=<nombre de tu bucket>


2. Corre el script (requiere AWS CLI configurado con credenciales válidas):
```bash
   chmod +x teardown.sh
   ./teardown.sh
```

El secret de Secrets Manager, al estar vinculado al ciclo de vida de la RDS, se elimina automáticamente al borrar la instancia.



