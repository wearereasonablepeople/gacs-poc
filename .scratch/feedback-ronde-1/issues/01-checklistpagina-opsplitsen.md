# 01 — Checklistpagina opsplitsen in stap-componenten

**What to build:** Geen zichtbare verandering voor de respondent. De checklistpagina houdt nu in één component zowel de voortgang, een sectiestap als de e-mailstap bij. Split dat op zodat de pagina de state houdt (huidige sectie, gekozen options, e-mailadres, verzendstatus) en de weergave per stap in eigen componenten zit: voortgangsbalk, sectiestap en e-mailstap. Dit is een prefactor: de volgende tickets voegen een welkomststap, een sticky voortgangsbalk en een uitklapbaar detailblok toe, en dat past niet meer netjes in één bestand.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] De checklist doorlopen, een option kiezen, terug- en vooruitnavigeren en versturen werkt precies als daarvoor
- [x] De pagina bevat zelf geen opmaak van control points of van het e-mailformulier meer
- [x] Er is geen nieuwe state-bron bijgekomen; de gekozen options blijven op één plek staan
- [x] Typecheck en build zijn groen
