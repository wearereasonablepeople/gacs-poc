# Single-service deploy on existing droplet

v1 deploys as one Docker/Compose service on the existing DigitalOcean droplet (replacing the multi-app POC stack there), not a new host and not “local only.” Keeps ops familiar while the product itself stays a single process: static UI + API + SQLite.
