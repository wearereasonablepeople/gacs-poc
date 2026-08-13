# Rebuild as a single app on a replacement branch

We chose a new git branch that replaces the multi-app POC (CMS, multi-tenant NestJS + three React SPAs) instead of a `simple/` subfolder or a new repository. Subfolder would keep two products entangled in one tree; a new repo would discard useful checklist seed/PDF history without enough gain. Old code remains recoverable on `master` until the branch is merged or the POC is retired.
