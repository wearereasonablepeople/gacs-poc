import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checklistSections } from "../../shared/checklist.ts";
import { config } from "./config.ts";
import { handleSubmission } from "./submit.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      config.publicWebOrigin,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4000",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/checklist", (c) =>
  c.json({
    sections: checklistSections,
    controlPointCount: checklistSections.reduce(
      (n, s) => n + s.controlPoints.length,
      0,
    ),
    provider: {
      name: config.provider.name,
      url: config.provider.url ?? null,
      email: config.provider.email ?? null,
      phone: config.provider.phone ?? null,
    },
  }),
);

app.post("/api/submit", async (c) => {
  try {
    const body = await c.req.json();
    const result = await handleSubmission({
      email: body.email,
      answers: body.answers ?? {},
    });
    return c.json({ ok: true, ...result });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message =
      err instanceof Error ? err.message : "Er ging iets mis bij het versturen";
    console.error(err);
    return c.json({ ok: false, error: message }, status as 400 | 500);
  }
});

const webDist = path.join(repoRoot, "web/dist");

if (fs.existsSync(webDist)) {
  app.use("/*", serveStatic({ root: webDist }));
  app.notFound(async (c) => {
    if (c.req.path.startsWith("/api/")) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.html(fs.readFileSync(path.join(webDist, "index.html"), "utf8"));
  });
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`GACS server listening on http://localhost:${info.port}`);
});
