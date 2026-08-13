# 02 — Blauw als selectiekleur vastleggen en toepassen

**What to build:** De radio bij een option is nu een native browser-radio, dus de blauwe selectiekleur komt van het besturingssysteem en verschilt per bezoeker. Leg die kleur vast in het project en gebruik hem consequent: `#2563eb` als selectieblauw en `#dbeafe` als lichte tint daarvan.

Toepassen:

- De radio van een gekozen option krijgt expliciet het selectieblauw, ongeacht browser of OS.
- Een gekozen option krijgt de lichte tint als achtergrond, in plaats van het huidige grijsgroen.
- De knop naar de volgende sectie wordt blauw in plaats van pine-groen.
- De knop op de laatste sectie wordt blauw en krijgt de tekst "Afronden" in plaats van "Naar verzenden".
- De definitieve verzendknop in de e-mailstap wordt ook blauw; de oranje accentkleur wordt in de checklistflow niet meer gebruikt.

**Blocked by:** 01 — Checklistpagina opsplitsen in stap-componenten.

**Status:** done

- [x] Selectieblauw en de lichte tint staan als benoemde kleuren in de Tailwind-config, niet als losse hex-waarden in componenten
- [x] Een gekozen option toont een blauwe radio en een lichtblauwe achtergrond in Chrome, Safari en Firefox
- [x] Een niet-gekozen option ziet er ongewijzigd uit
- [x] De knoppen "Volgende", "Afronden" en de verzendknop zijn alle drie hetzelfde blauw
- [x] De laatste sectie toont "Afronden"
- [x] De oranje accentkleur komt in de checklistflow niet meer voor
