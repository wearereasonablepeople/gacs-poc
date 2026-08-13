# Vite SPA + small Node server

The product is a Vite React frontend plus a small Node HTTP server (Hono or Express) with SQLite and Nodemailer, not Next.js and not serverless. That keeps the UI close to the existing respondent SPA, makes Gmail app-password SMTP straightforward, and deploys as one process serving the built static files and `/api`.
