# support_pilot_backend_node_js

## Deployment configuration

Vercel uses `server.js` as the Express entry point; it exports the Express app as
the module default. Keep the app export separate from the local `npm start`
listener.

Swagger UI uses the current host and protocol automatically. If the API is behind
a reverse proxy or needs a different target, optionally set `API_BASE_URL` to the
public API base URL (for example, `https://api.example.com`).