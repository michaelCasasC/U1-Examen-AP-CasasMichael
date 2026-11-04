# PrimeVideoDB CRUD

Aplicación académica sobre la tabla `content` de `primevideodb`, con Node.js, Express, SQL Server, React, Vite, Socket.IO y `worker_threads`.

## 1. Iniciar SQL Server

Requiere Docker:

```powershell
docker compose up -d
```

Ejecuta `database/PrimeVideoDB_SQLServer.sql` en SQL Server Management Studio, Azure Data Studio o `sqlcmd`. El script crea y carga `primevideodb`.

Verifica la carga:

```sql
USE primevideodb;
SELECT COUNT(*) AS total_content FROM content;
SELECT TOP 10 * FROM content ORDER BY id;
```

## 2. Iniciar backend

```powershell
cd backend
npm install
$env:DB_PASSWORD="PrimeVideoDB_2026!"
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
