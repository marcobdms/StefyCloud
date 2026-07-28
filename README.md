# Stefany Cloud

Nube personal construida con Next.js y FastAPI. Incluye notas, imágenes,
documentos, recordatorios y notificaciones Web Push.

## Desarrollo local

Frontend:

```bash
npm ci
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Variables mínimas del frontend:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid-public-key>
JWT_SECRET_KEY=<same-jwt-secret-as-backend>
```

Variables del backend:

```dotenv
DATABASE_URL=sqlite:///./stefany_cloud.db
APP_PASSWORD=<app-password>
JWT_SECRET_KEY=<jwt-secret>
FRONTEND_URL=http://localhost:3000
VAPID_PUBLIC_KEY=<vapid-public-key>
VAPID_PRIVATE_KEY=<vapid-private-key>
VAPID_EMAIL=<contact-email>
DEFAULT_TIMEZONE=America/Caracas
REMINDER_GRACE_MINUTES=15
UPLOAD_DIR=uploads
MAX_UPLOAD_BYTES=26214400
```

Los recordatorios nuevos guardan la zona IANA enviada por el dispositivo.
`DEFAULT_TIMEZONE` solo se usa como respaldo para recordatorios antiguos que
todavía no tengan zona.

## Pruebas

```bash
PYTHONPATH=backend python -m unittest discover -s backend/tests
npm run lint
npm run build
```

## Despliegue

### Vercel

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` se inserta durante `next build`. Si cambia esta
variable hay que desplegar de nuevo el frontend. La clave pública debe ser la
pareja exacta de `VAPID_PRIVATE_KEY` en Coolify.

### Coolify

Los cambios del backend requieren un redeploy. Al arrancar, la API aplica una
migración aditiva que incorpora las columnas de notificaciones; no elimina ni
recrea la tabla `notes`.

Antes de desplegar, comprobar `DATABASE_URL`:

- Una URL de PostgreSQL apunta a una base externa y el redeploy del contenedor
  no debería borrar las notas.
- Con SQLite, el archivo de la URL debe estar dentro de un volumen persistente
  de Coolify. Sin ese volumen, un redeploy puede borrar la base completa.

Los archivos siguen guardándose en `UPLOAD_DIR`. Mientras no se use un bucket,
esa carpeta también necesita un volumen persistente para sobrevivir a un
redeploy.

El scheduler está pensado para una sola réplica del backend. Si se escala a
varias réplicas, debe moverse a un worker único.

## Activar notificaciones en iPhone

1. Añadir Stefany Cloud a la pantalla de inicio.
2. Abrir la aplicación desde ese icono.
3. Iniciar sesión y entrar en Recordatorios.
4. Activar el toggle `Notificaciones`.
5. Aceptar el permiso de iOS.
