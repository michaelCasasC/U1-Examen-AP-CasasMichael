# PrimeVideoDB CRUD

Aplicación académica sobre la tabla `content` de `primevideodb`, con Node.js, Express, PostgreSQL local, React, Vite, Socket.IO y `worker_threads`.

## 1. Verificar PostgreSQL

Inicia el servicio local de PostgreSQL y asegúrate de que la base `primevideodb` y el usuario `primevideo_admin` existan.

En `psql` verifica la carga:

```sql
\c primevideodb
SELECT COUNT(*) AS total_content FROM content;
SELECT * FROM content LIMIT 10;
```

## 2. Iniciar backend

```powershell
cd backend
npm install
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="primevideodb"
$env:DB_USER="primevideo_admin"
$env:DB_PASSWORD="<tu contraseña local>"
npm run dev
```

La API queda disponible en `http://localhost:3000`.

## 3. Iniciar frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre la URL mostrada por Vite. El CRUD está en `/api/content`. El botón **Calcular estadísticas** usa `worker_threads` para procesar películas y series fuera del hilo principal. Abre dos ventanas del frontend para comprobar la sincronización de Socket.IO al crear, editar o eliminar contenido.
