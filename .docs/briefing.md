Ontwikkeling GACS Compliance Check Tool

Projectnaam: GACS Compliance Check Tool (initieel voor Croonwolter&dros)

Datum: 1 februari 2026

Deadline: Binnen 1 week na kick-off (dus uiterlijk 8 februari 2026, afhankelijk van startdatum)

Opdrachtgever: Croonwolter&dros B.V.

Contact: Marc Hopman

Eigenaar bij ons: Chris Beemster

Doel en context

Vanaf 1 januari 2026 moeten eigenaren van utiliteitsgebouwen met verwarmings- of airconditioningsystemen >290 kW verplicht beschikken over een Gebouwautomatiserings- en Controlesysteem (GACS). Dit volgt uit de EPBD III en het Besluit bouwwerken leefomgeving (BBL). Het GACS moet permanent energieverbruik monitoren, analyseren, optimaliseren, inefficiënties signaleren en samenwerken met andere systemen (zonnepanelen, laadpalen, opslag etc.). Het systeem moet voldoen aan NEN-ISO-52120 niveau C (geheel systeem) en B (energiemanagement).

Croonwolter&dros positioneert zich als expert-integrator en wil gebouweigenaren helpen compliant te worden. We bouwen een online tool die leidt genereert én Croonwolter&dros als autoriteit neerzet. De tool is een doorontwikkeling van de bestaande mock-up/prototype (te zien op https://cwd-gacs-assessor-328951010499.us-west1.run.app/), die positief ontvangen is bij Croonwolter&dros, ABN AMRO, BDO en anderen.

De tool moet gebruikers (eigenaren, managers, accountmanagers) laten invoeren wat hun situatie is, compliance checken op basis van RVO-eisen en advies geven (bijv. “verplicht”, “mogelijk compliant”, “upgrade nodig”, “expert inschakelen”). Referentie: RVO-pagina https://www.rvo.nl/onderwerpen/wetten-en-regels-gebouwen/epbd-iii/systeemeisen-technische-bouwsystemen/gacs en de officiële checklist.

Belangrijke eisen voor de tool

White-labelbaar maken — Bouw de tool zo op dat we hem eenvoudig kunnen herbranden voor andere partijen (andere logo’s, kleuren, teksten, domein). Gebruik configuratiebestanden, environment variables of een simpele config-laag (geen hardcoding van Croonwolter&dros-elementen).

Responsive en gebruiksvriendelijk — Werkt goed in moderne browsers op laptop en mobiel.

Vragenflow — Baseer op RVO-checklist en prototype:

Organisatiegegevens (o.a. KvK-nummer voor eventuele auto-lookup).

Contactpersoon (naam, e-mail, functie).

Gebouw- en installatiegegevens: type gebouw, nominale vermogens verwarming/airco, bestaande systemen, monitoring, etc.

Output: duidelijke uitslag (verplicht ja/nee, klasse inschatting, aanbevelingen), korte samenvatting + optie voor PDF-download.

Data-opslag — Resultaten (incl. antwoorden en contactinfo) opslaan in een aparte database. Voor nu géén koppeling met CRM (vanwege aanstaande migratie).

E-mail flow

Bevestigingsmail met verificatie (spam-preventie en data-integriteit).

Korte terugkoppeling met resultaat. Gebruik een bestaande bewezen dienst: SendGrid, Mailgun, Postmark, Supabase Auth, Firebase Authentication of vergelijkbaar. Bouw dit niet zelf.

Admin-view — Simpele interface om ingevulde resultaten te bekijken (evt. met e-mailnotificatie bij nieuwe inzending).

Hosting — Standalone landingspagina, geen CMS-koppeling nodig. WeAreReasonablePeople host initieel; optie tot overdracht aan Croonwolter&dros later. Overleg met Jochem over waar we dit precies hosten (cloud-omgeving structureren), omdat hij daar nu mee bezig is.

Technische keuzes en aanpak

AI in ontwikkelproces — Dit project gebruiken we om te leren over bouwen met AI agents. Laat AI-bots (Copilot, custom agents etc.) zoveel mogelijk code schrijven, unit tests genereren, refactoren en reviewen. Documenteer wat goed werkt en wat niet (voor interne kennisopbouw). Let op: de tool zelf gebruikt géén AI; alleen het ontwikkelproces.

Backend & data — Houd bewust simpel voor snelheid: gebruik Supabase, Firebase of een serverless endpoint (bijv. Vercel functions + database). Focus op minimale setup: opslag, basis authenticatie voor admin, veilige opslag (GDPR-proof).

Frontend — React of Vue, Tailwind voor styling, responsive design.

CI/CD — Basis pipeline opzetten (GitHub Actions of vergelijkbaar).

Beveiliging — HTTPS, input validatie, e-mailverificatie, beperkte admin-toegang.

Proces en planning (strak!)

Kick-off (zo snel mogelijk): doelen, uitzonderingen, exacte datavelden, design-richting afstemmen. Technische keuzes (o.a. hosting met Jochem) vastleggen.

Week 1 (direct na kick-off): ontwerp + ontwikkeling starten. Wireframes / UX goedkeuren. Bouwen met zware AI-ondersteuning.

Eind week 1: oplevering + delivery meeting. Tool live, getest, werkend.

Afhankelijkheden

Assets corporate identity (kleuren, logo’s etc.).

Input Jochem voor hosting-locatie en cloud-setup.



