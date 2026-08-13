# SQLite for submission storage

Submissions are stored in SQLite rather than JSON files or PostgreSQL. Files would make a later admin list awkward; Postgres reintroduces ops the simplified product does not need. One file on disk is enough to log submissions and query them later if an admin UI is added.
