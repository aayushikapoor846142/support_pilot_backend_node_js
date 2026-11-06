# support_pilot_backend_node_js

## Deployment configuration

Vercel uses `server.js` as the Express entry point; it exports the Express app as
the module default. Keep the app export separate from the local `npm start`
listener.

Set `CLIENT_URL` in the deployment environment to the exact frontend origin
(scheme and hostname, with no path). Multiple origins can be comma-separated,
for example `https://app.example.com,http://localhost:5173`.

Set `MONGO_URI` in Vercel's Production environment to the MongoDB connection
string. Database-backed API routes connect on demand; the health endpoint does
not require MongoDB.

Swagger UI uses the current host and protocol automatically. If the API is behind
a reverse proxy or needs a different target, optionally set `API_BASE_URL` to the
public API base URL (for example, `https://api.example.com`).