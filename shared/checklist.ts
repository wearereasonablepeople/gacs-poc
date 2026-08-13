export type ChecklistOption = {
  id: string;
  label: string;
  isAllowed: boolean;
};

export type ControlPoint = {
  code: string;
  title: string;
  prompt: string;
  helpText?: string;
  options: ChecklistOption[];
};

export type ChecklistSection = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  controlPoints: ControlPoint[];
};

export const checklistSections: ChecklistSection[] = [
  {
    id: 'verwarmingssysteem-onderdelen',
    title: 'Verwarmingssysteem onderdelen',
    description: 'In dit onderdeel bekijken we de automatisering van uw verwarmingssysteem, van individuele ruimteregeling tot ketelsequenties.',
    icon: 'flame',
    controlPoints: [
      {
        code: '1.1',
        title: 'Warmteafgifte',
        prompt: 'Welk type temperatuurregeling is aanwezig voor de warmteafgifte van het verwarmingssysteem?',
        helpText: 'Denk aan radiatoren, vloerverwarming, convectoren en andere warmteafgifte-units. Selecteer de optie die het beste past bij de huidige situatie.',
        options: [
          {
            id: '1.1-0',
            label: 'Geen automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '1.1-1',
            label: 'Centrale automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '1.1-2',
            label: 'Individuele temperatuurregeling per ruimte',
            isAllowed: true,
          },
          {
            id: '1.1-3',
            label: 'Individuele temperatuurregeling per ruimte met communicatie naar centraal systeem',
            isAllowed: true,
          },
          {
            id: '1.1-4',
            label: 'Individuele temperatuurregeling per ruimte met communicatie en aanwezigheidsdetectie',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.2',
        title: 'Warmteafgifte bij TABS',
        prompt: 'Welk type temperatuurregeling is aanwezig voor de warmteafgifte bij thermisch geactiveerde gebouwstructuren (TABS)?',
        helpText: 'Thermisch geactiveerde gebouwstructuren (TABS) zijn systemen waarbij verwarmings- of koelleidingen in de bouwconstructie (bijv. betonkern) zijn opgenomen.',
        options: [
          {
            id: '1.2-0',
            label: 'Geen automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '1.2-1',
            label: 'Centrale automatische temperatuurregeling',
            isAllowed: true,
          },
          {
            id: '1.2-2',
            label: 'Geavanceerde centrale temperatuurregeling',
            isAllowed: true,
          },
          {
            id: '1.2-3',
            label: 'Geavanceerde centrale temperatuurregeling met niet-continu gebruik en/of ruimtetemperatuur terugkoppeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.3',
        title: 'Distributienetwerk watertemperatuur',
        prompt: 'Hoe wordt de watertemperatuur in het verwarmingsdistributienetwerk (aanvoer of retour) geregeld?',
        helpText: 'Dit betreft de regeling van de aanvoer- of retourwatertemperatuur in het leidingnetwerk van het verwarmingssysteem.',
        options: [
          {
            id: '1.3-0',
            label: 'Geen automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '1.3-1',
            label: 'Buitentemperatuur-compensatie regeling',
            isAllowed: true,
          },
          {
            id: '1.3-2',
            label: 'Vraag-gestuurde regeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.4',
        title: 'Distributiepompen',
        prompt: 'Hoe worden de distributiepompen van het verwarmingssysteem geregeld?',
        helpText: 'Dit betreft de circulatiepompen die het verwarmde water door het leidingnetwerk pompen.',
        options: [
          {
            id: '1.4-0',
            label: 'Geen automatische regeling',
            isAllowed: false,
          },
          {
            id: '1.4-1',
            label: 'Aan-uit regeling',
            isAllowed: true,
          },
          {
            id: '1.4-2',
            label: 'Multi-fase/ multi-stap regeling',
            isAllowed: true,
          },
          {
            id: '1.4-3',
            label: 'Variabele snelheid regeling (intern of extern)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.5',
        title: 'Aan/uit-regeling verwarmingssysteem',
        prompt: 'Hoe wordt het verwarmingssysteem als geheel in- en uitgeschakeld?',
        helpText: 'Dit betreft de wijze waarop het verwarmingssysteem wordt gestart en gestopt, bijvoorbeeld seizoensgebonden of op basis van buitentemperatuur.',
        options: [
          {
            id: '1.5-0',
            label: 'Geen automatische regeling',
            isAllowed: false,
          },
          {
            id: '1.5-1',
            label: 'Automatische regeling met timer',
            isAllowed: true,
          },
          {
            id: '1.5-2',
            label: 'Automatische regeling met start-stop optimalisatie',
            isAllowed: true,
          },
          {
            id: '1.5-3',
            label: 'Automatische vraag-gestuurde regeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.6',
        title: 'Verwarmingstoestel (verbranding/warmtelevering)',
        prompt: 'Hoe wordt het verwarmingstoestel (verbrandingstoestellen of warmtelevering) geregeld?',
        helpText: 'Denk aan gasketels, stadsverwarming-aansluitingen of andere toestellen op basis van verbranding of externe warmtelevering.',
        options: [
          {
            id: '1.6-0',
            label: 'Vaste temperatuurinstelling',
            isAllowed: false,
          },
          {
            id: '1.6-1',
            label: 'Variabele temperatuurinstelling gebaseerd op buitentemperatuur',
            isAllowed: true,
          },
          {
            id: '1.6-2',
            label: 'Vraag-gestuurde variabele temperatuurinstelling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.7',
        title: 'Verwarmingstoestel (warmtepomp)',
        prompt: 'Hoe wordt het verwarmingstoestel (warmtepomp) geregeld?',
        helpText: 'Dit betreft de regeling van warmtepompen die als verwarmingstoestel worden ingezet.',
        options: [
          {
            id: '1.7-0',
            label: 'Vaste temperatuurinstelling',
            isAllowed: false,
          },
          {
            id: '1.7-1',
            label: 'Variabele temperatuurinstelling gebaseerd op buitentemperatuur',
            isAllowed: true,
          },
          {
            id: '1.7-2',
            label: 'Vraag-gestuurde variabele temperatuurinstelling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.8',
        title: 'Verwarmingstoestel (buiten-unit)',
        prompt: 'Hoe wordt het verwarmingstoestel (buiten-unit) geregeld?',
        helpText: 'Dit betreft de buiten-unit van split- of multi-splitsystemen die voor verwarming worden ingezet.',
        options: [
          {
            id: '1.8-0',
            label: 'Aan-uit regeling',
            isAllowed: false,
          },
          {
            id: '1.8-1',
            label: 'Multi-stappen regeling',
            isAllowed: true,
          },
          {
            id: '1.8-2',
            label: 'Variabele regeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.9',
        title: 'Sequentieregeling warmte-opwekkers',
        prompt: 'Hoe wordt de volgorde van inzet van meerdere warmte-opwekkers bepaald?',
        helpText: 'Als er meerdere warmtebronnen aanwezig zijn (bijv. ketel + warmtepomp), hoe wordt dan bepaald welke als eerste wordt ingezet?',
        options: [
          {
            id: '1.9-0',
            label: 'Vaste volgorde',
            isAllowed: false,
          },
          {
            id: '1.9-1',
            label: 'Prioritering gebaseerd op belasting (warmtevraag)',
            isAllowed: true,
          },
          {
            id: '1.9-2',
            label: 'Dynamische prioritering gebaseerd op efficiency en karakteristieken van de toestellen',
            isAllowed: true,
          },
          {
            id: '1.9-3',
            label: 'Vraag-gestuurde prioritering (gebaseerd op meerdere parameters)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '1.10',
        title: 'Warmteopslag',
        prompt: 'Hoe wordt de warmteopslag geregeld?',
        helpText: 'Dit betreft buffervaten of andere vormen van warmteopslag in het verwarmingssysteem.',
        options: [
          {
            id: '1.10-0',
            label: 'Continubedrijf',
            isAllowed: false,
          },
          {
            id: '1.10-1',
            label: 'Twee-sensor gestuurde warmteopslag',
            isAllowed: true,
          },
          {
            id: '1.10-2',
            label: 'Vraag-gestuurde warmteopslag',
            isAllowed: true,
          }
        ],
      },
    ],
  },
  {
    id: 'warm-tapwater-onderdelen',
    title: 'Warm tapwater onderdelen',
    description: 'Hoe wordt uw warm tapwatersysteem aangestuurd? Bekijk de regeling en automatisering van warm tapwater.',
    icon: 'droplets',
    controlPoints: [
      {
        code: '2.1',
        title: 'Elektrische boiler / warmtepompboiler',
        prompt: 'Hoe wordt de elektrische boiler of warmtepompboiler voor warm tapwater geregeld?',
        helpText: 'Dit betreft de regeling van de boiler die warm tapwater bereidt met elektriciteit of een warmtepomp.',
        options: [
          {
            id: '2.1-0',
            label: 'Automatische aan-uit regeling',
            isAllowed: false,
          },
          {
            id: '2.1-1',
            label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming',
            isAllowed: true,
          },
          {
            id: '2.1-2',
            label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming en multi-sensor regeling van warm wateropslag',
            isAllowed: true,
          }
        ],
      },
      {
        code: '2.2',
        title: 'Warmwater-opslag met externe opwekking',
        prompt: 'Hoe wordt de warmwater-opslag met externe warmwateropwekking geregeld?',
        helpText: 'Dit betreft een warmwateropslagvat dat wordt verwarmd door een externe bron, zoals een ketel of stadsverwarming.',
        options: [
          {
            id: '2.2-0',
            label: 'Automatische aan-uit regeling',
            isAllowed: false,
          },
          {
            id: '2.2-1',
            label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming',
            isAllowed: true,
          },
          {
            id: '2.2-2',
            label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming en vraag-gestuurde multi-sensor regeling van warm wateropslag',
            isAllowed: true,
          }
        ],
      },
      {
        code: '2.3',
        title: 'Zonneboiler met back-up',
        prompt: 'Hoe wordt de zonneboiler met back-up warmteopwekker geregeld?',
        helpText: 'Dit betreft een systeem met zonnecollectoren als primaire warmtebron en een conventionele back-up (bijv. gasketel).',
        options: [
          {
            id: '2.3-0',
            label: 'Handmatige regeling',
            isAllowed: false,
          },
          {
            id: '2.3-1',
            label: 'Automatische regeling met zon-thermische opwekking (prioriteit 1) en additionele opwekking (prioriteit 2)',
            isAllowed: true,
          },
          {
            id: '2.3-2',
            label: 'Automatische regeling met zon-thermische opwekking (prioriteit 1) en additionele opwekking (prioriteit 2) met vraag-gestuurde temperatuurregeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '2.4',
        title: 'Warm tapwater distributiepomp',
        prompt: 'Hoe wordt de warm tapwater distributiepomp (circulatiepomp) geregeld?',
        helpText: 'Dit betreft de pomp die het warme tapwater laat circuleren om wachttijd bij het tappunt te beperken.',
        options: [
          {
            id: '2.4-0',
            label: 'Geen regeling (continubedrijf)',
            isAllowed: false,
          },
          {
            id: '2.4-1',
            label: 'Timer-gestuurd',
            isAllowed: true,
          }
        ],
      },
    ],
  },
  {
    id: 'airconditioningssysteem-onderdelen',
    title: 'Airconditioningssysteem onderdelen',
    description: 'Hoe wordt de koeling in uw gebouw geregeld? Controleer de automatisering van uw airconditioningssysteem.',
    icon: 'snowflake',
    controlPoints: [
      {
        code: '3.1',
        title: 'Koude-afgifte',
        prompt: 'Welk type temperatuurregeling is aanwezig voor de koude-afgifte-units (koude-paneel, fan coil-unit, binnen-unit airco)?',
        helpText: 'Dit betreft de units die gekoelde lucht of koud water afgeven aan de ruimte, zoals koude-panelen, fan coil-units of split-unit binnenunits.',
        options: [
          {
            id: '3.1-0',
            label: 'Geen automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '3.1-1',
            label: 'Centrale automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '3.1-2',
            label: 'Individuele temperatuurregeling per ruimte',
            isAllowed: true,
          },
          {
            id: '3.1-3',
            label: 'Individuele temperatuurregeling per ruimte met communicatie naar centraal systeem',
            isAllowed: true,
          },
          {
            id: '3.1-4',
            label: 'Individuele temperatuurregeling per ruimte met communicatie en aanwezigheidsdetectie',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.2',
        title: 'Koude-afgifte bij TABS',
        prompt: 'Welk type temperatuurregeling is aanwezig voor de koude-afgifte bij thermisch geactiveerde gebouwstructuren (TABS)?',
        helpText: 'TABS-systemen die voor koeling worden ingezet, waarbij koelleidingen in de bouwconstructie zijn opgenomen.',
        options: [
          {
            id: '3.2-0',
            label: 'Geen automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '3.2-1',
            label: 'Centrale automatische temperatuurregeling',
            isAllowed: true,
          },
          {
            id: '3.2-2',
            label: 'Geavanceerde centrale temperatuurregeling',
            isAllowed: true,
          },
          {
            id: '3.2-3',
            label: 'Geavanceerde centrale temperatuurregeling met niet-continu gebruik en/of ruimtetemperatuur terugkoppeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.3',
        title: 'Koeldistributienetwerk watertemperatuur',
        prompt: 'Hoe wordt de watertemperatuur in het koeldistributienetwerk (aanvoer of retour) geregeld?',
        helpText: 'Dit betreft de regeling van de aanvoer- of retourwatertemperatuur in het leidingnetwerk van het koelsysteem.',
        options: [
          {
            id: '3.3-0',
            label: 'Geen automatische temperatuurregeling',
            isAllowed: false,
          },
          {
            id: '3.3-1',
            label: 'Buitentemperatuur-compensatie regeling',
            isAllowed: true,
          },
          {
            id: '3.3-2',
            label: 'Vraag-gestuurde regeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.4',
        title: 'Distributiepompen koeling',
        prompt: 'Hoe worden de distributiepompen van het koelsysteem geregeld?',
        helpText: 'Dit betreft de circulatiepompen die het gekoelde water door het koelleidingnetwerk pompen.',
        options: [
          {
            id: '3.4-0',
            label: 'Geen automatische regeling',
            isAllowed: false,
          },
          {
            id: '3.4-1',
            label: 'Aan-uit regeling',
            isAllowed: true,
          },
          {
            id: '3.4-2',
            label: 'Multi-fase / multi-stap regeling',
            isAllowed: true,
          },
          {
            id: '3.4-3',
            label: 'Variabele snelheid regeling (intern of extern)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.5',
        title: 'Aan/uit-regeling koelsysteem',
        prompt: 'Hoe wordt het koelsysteem als geheel in- en uitgeschakeld?',
        helpText: 'Dit betreft de wijze waarop het koelsysteem wordt gestart en gestopt, bijvoorbeeld seizoensgebonden of op basis van buitentemperatuur.',
        options: [
          {
            id: '3.5-0',
            label: 'Geen automatische regeling',
            isAllowed: false,
          },
          {
            id: '3.5-1',
            label: 'Automatische regeling met timer',
            isAllowed: true,
          },
          {
            id: '3.5-2',
            label: 'Automatische regeling met start-stop optimalisatie',
            isAllowed: true,
          },
          {
            id: '3.5-3',
            label: 'Automatische vraag-gestuurde regeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.6',
        title: 'Interlock verwarming/koeling',
        prompt: 'Welk type interlock (vergrendeling) is er tussen het verwarmings- en koelsysteem?',
        helpText: 'Een interlock voorkomt dat het verwarmings- en koelsysteem tegelijkertijd actief zijn in dezelfde zone.',
        options: [
          {
            id: '3.6-0',
            label: 'Geen interlock',
            isAllowed: false,
          },
          {
            id: '3.6-1',
            label: 'Gedeeltelijke interlock',
            isAllowed: true,
          },
          {
            id: '3.6-2',
            label: 'Volledige interlock',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.7',
        title: 'Koude-opwekkers',
        prompt: 'Hoe worden de koude-opwekkers (bijv. koelmachines, chillers) geregeld?',
        helpText: 'Dit betreft de temperatuurregeling van koude-opwekkers zoals koelmachines en chillers.',
        options: [
          {
            id: '3.7-0',
            label: 'Vaste temperatuurinstelling',
            isAllowed: false,
          },
          {
            id: '3.7-1',
            label: 'Variabele temperatuurinstelling gebaseerd op buitentemperatuur',
            isAllowed: true,
          },
          {
            id: '3.7-2',
            label: 'Vraag-gestuurde variabele temperatuurinstelling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.8',
        title: 'Sequentieregeling koude-opwekkers',
        prompt: 'Hoe wordt de volgorde van inzet van meerdere koude-opwekkers bepaald?',
        helpText: 'Als er meerdere koude-opwekkers aanwezig zijn, hoe wordt dan bepaald welke als eerste wordt ingezet?',
        options: [
          {
            id: '3.8-0',
            label: 'Prioritering alleen op basis van draaiuren',
            isAllowed: false,
          },
          {
            id: '3.8-1',
            label: 'Prioritering gebaseerd op belasting (koude vraag)',
            isAllowed: true,
          },
          {
            id: '3.8-2',
            label: 'Dynamische prioritering gebaseerd op efficiency en karakteristieken van de toestellen',
            isAllowed: true,
          },
          {
            id: '3.8-3',
            label: 'Vraag-gestuurde prioritering (gebaseerd op meerdere parameters)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '3.9',
        title: 'Warmte-koudeopslag (WKO)',
        prompt: 'Hoe wordt de warmte-koudeopslag (WKO) geregeld?',
        helpText: 'Dit betreft de regeling van warmte-koudeopslag, zoals bodemenergiesystemen of seizoensopslag.',
        options: [
          {
            id: '3.9-0',
            label: 'Continubedrijf',
            isAllowed: false,
          },
          {
            id: '3.9-1',
            label: 'Tijd gestuurde warmteopslag',
            isAllowed: true,
          },
          {
            id: '3.9-2',
            label: 'Vraag-gestuurde warmteopslag',
            isAllowed: true,
          }
        ],
      },
    ],
  },
  {
    id: 'ventilatiesysteem-onderdelen',
    title: 'Ventilatiesysteem onderdelen',
    description: 'Bekijk hoe het ventilatiesysteem in uw gebouw geautomatiseerd is.',
    icon: 'wind',
    controlPoints: [
      {
        code: '4.1',
        title: 'Ventilatiestroom',
        prompt: 'Hoe wordt de ventilatiestroom in de ruimte geregeld?',
        helpText: 'Dit betreft de wijze waarop de hoeveelheid ventilatielucht per ruimte wordt aangestuurd.',
        options: [
          {
            id: '4.1-0',
            label: 'Geen automatische controle',
            isAllowed: false,
          },
          {
            id: '4.1-1',
            label: 'Tijd gestuurde regeling',
            isAllowed: true,
          },
          {
            id: '4.1-2',
            label: 'Aanwezigheidsdetectie',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.2',
        title: 'Ruimtetemperatuur luchtsystemen',
        prompt: 'Hoe wordt de ruimtetemperatuur geregeld bij luchtsystemen?',
        helpText: 'Dit betreft de temperatuurregeling in ruimtes waar uitsluitend lucht als transport-medium wordt gebruikt voor verwarming/koeling.',
        options: [
          {
            id: '4.2-0',
            label: 'Aan-uit-regeling',
            isAllowed: false,
          },
          {
            id: '4.2-1',
            label: 'Variabele regeling',
            isAllowed: true,
          },
          {
            id: '4.2-2',
            label: 'Vraag gestuurde regeling',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.3',
        title: 'Afstemming lucht-watersystemen',
        prompt: 'Is er afstemming van de temperatuurregeling bij gecombineerde lucht-watersystemen?',
        helpText: 'Bij gecombineerde lucht-watersystemen (bijv. luchtbehandeling + fan coil-units) is afstemming nodig om conflicten te voorkomen.',
        options: [
          {
            id: '4.3-0',
            label: 'Geen afstemming',
            isAllowed: false,
          },
          {
            id: '4.3-1',
            label: 'Afstemming',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.4',
        title: 'Verhouding buitenlucht',
        prompt: 'Hoe wordt de verhouding buitenlucht in het ventilatiesysteem geregeld?',
        helpText: 'Dit betreft de verhouding tussen buitenlucht (verse lucht) en recirculatielucht in het ventilatiesysteem.',
        options: [
          {
            id: '4.4-0',
            label: 'Vaste verhouding buitenluchtstroom',
            isAllowed: false,
          },
          {
            id: '4.4-1',
            label: 'Tijd gestuurde getrapte regeling verhouding buitenlucht',
            isAllowed: true,
          },
          {
            id: '4.4-2',
            label: 'Vraag gestuurde getrapte regeling verhouding buitenlucht',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.5',
        title: 'AHU luchtstroom of luchtdruk',
        prompt: 'Hoe wordt de luchtstroom of luchtdruk van de air handling unit (AHU) geregeld?',
        helpText: 'Dit betreft de regeling van ventilatoren in de luchtbehandelingskast (AHU) op basis van luchtstroom of kanaaldruk.',
        options: [
          {
            id: '4.5-0',
            label: 'Geen automatische regeling',
            isAllowed: false,
          },
          {
            id: '4.5-1',
            label: 'Tijd gestuurde aan-uit-regeling',
            isAllowed: true,
          },
          {
            id: '4.5-2',
            label: 'Multi-stap regeling',
            isAllowed: true,
          },
          {
            id: '4.5-3',
            label: 'Automatische luchtstroom of -drukregeling (met of zonder reset)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.6',
        title: 'Vorstbescherming warmteterugwinning',
        prompt: 'Is er vorstbescherming aanwezig bij de warmteterugwinning?',
        helpText: 'Vorstbescherming voorkomt dat de warmtewisselaar bevriest bij lage buitentemperaturen, wat de luchttoevoer zou blokkeren.',
        options: [
          {
            id: '4.6-0',
            label: 'Zonder vorstbescherming',
            isAllowed: false,
          },
          {
            id: '4.6-1',
            label: 'Met vorstbescherming',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.7',
        title: 'Oververhittingsbescherming warmteterugwinning',
        prompt: 'Is er oververhittingsbescherming aanwezig bij de warmteterugwinning?',
        helpText: 'Oververhittingsbescherming voorkomt dat de warmteterugwinning ongewenste opwarming veroorzaakt wanneer de buitenlucht al warm genoeg is.',
        options: [
          {
            id: '4.7-0',
            label: 'Zonder oververhittingsbescherming',
            isAllowed: false,
          },
          {
            id: '4.7-1',
            label: 'Met oververhittingsbescherming',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.8',
        title: 'Vrije koeling',
        prompt: 'Hoe wordt vrije koeling (free cooling) toegepast en geregeld?',
        helpText: 'Vrije koeling maakt gebruik van koele buitenlucht om het gebouw te koelen zonder mechanische koeling.',
        options: [
          {
            id: '4.8-0',
            label: 'Geen automatische regeling',
            isAllowed: false,
          },
          {
            id: '4.8-1',
            label: 'Nachtkoeling',
            isAllowed: true,
          },
          {
            id: '4.8-2',
            label: 'Vrije koeling',
            isAllowed: true,
          },
          {
            id: '4.8-3',
            label: 'H,x gestuurde regeling (= modulerende regeling)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.9',
        title: 'Toevoerluchttemperatuur',
        prompt: 'Hoe wordt de temperatuur van de ventilatielucht (toevoerlucht) geregeld?',
        helpText: 'Dit betreft de regeling van de temperatuur van de lucht die door de luchtbehandeling aan het gebouw wordt geleverd.',
        options: [
          {
            id: '4.9-0',
            label: 'Geen automatische controle',
            isAllowed: false,
          },
          {
            id: '4.9-1',
            label: 'Constante temperatuurinstelling',
            isAllowed: true,
          },
          {
            id: '4.9-2',
            label: 'Variabele temperatuurinstelling met buitentemperatuurcorrectie',
            isAllowed: true,
          },
          {
            id: '4.9-3',
            label: 'Variabele temperatuurinstelling met vraag-gestuurde correctie',
            isAllowed: true,
          }
        ],
      },
      {
        code: '4.10',
        title: 'Luchtvochtigheid',
        prompt: 'Hoe wordt de luchtvochtigheid geregeld?',
        helpText: 'Dit betreft de regeling van de relatieve luchtvochtigheid in het gebouw via het ventilatiesysteem.',
        options: [
          {
            id: '4.10-0',
            label: 'Geen automatische controle',
            isAllowed: false,
          },
          {
            id: '4.10-1',
            label: 'Dauwpuntregeling',
            isAllowed: true,
          },
          {
            id: '4.10-2',
            label: 'Directe regeling luchtvochtigheid',
            isAllowed: true,
          }
        ],
      },
    ],
  },
  {
    id: 'verlichtingssysteem-onderdelen',
    title: 'Verlichtingssysteem onderdelen',
    description: 'Hoe wordt de verlichting in uw gebouw aangestuurd?',
    icon: 'lightbulb',
    controlPoints: [
      {
        code: '5.1',
        title: 'Aanwezigheidsdetectie verlichting',
        prompt: 'Welk type aanwezigheidsdetectie is aanwezig voor de verlichtingsregeling?',
        helpText: 'Dit betreft de wijze waarop verlichting wordt geschakeld op basis van aanwezigheid van personen in de ruimte.',
        options: [
          {
            id: '5.1-0',
            label: 'Handmatige aan-uit-schakeling',
            isAllowed: false,
          },
          {
            id: '5.1-1',
            label: 'Handmatige aan-uit-schakeling met veegschakeling',
            isAllowed: true,
          },
          {
            id: '5.1-2',
            label: 'Aanwezigheidsdetectie (met automatische of handmatige aan-schakeling)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '5.2',
        title: 'Daglichtregeling',
        prompt: 'Welk type daglichtregeling is aanwezig voor de verlichting?',
        helpText: 'Alle vormen van daglichtregeling zijn toegestaan. Dit betreft het automatisch aanpassen van kunstlicht op basis van beschikbaar daglicht.',
        options: [
          {
            id: '5.2-0',
            label: 'Handmatig (centraal of per ruimte)',
            isAllowed: true,
          },
          {
            id: '5.2-1',
            label: 'Automatisch (aan-uit of dimregeling)',
            isAllowed: true,
          }
        ],
      },
    ],
  },
  {
    id: 'zonweringssysteem-onderdelen',
    title: 'Zonweringssysteem onderdelen',
    description: 'Is de zonwering in uw gebouw automatisch geregeld?',
    icon: 'sun',
    controlPoints: [
      {
        code: '6.1',
        title: 'Zonwering',
        prompt: 'Hoe wordt de zonwering geregeld?',
        helpText: 'Dit betreft de wijze waarop zonwering (bijv. screens, lamellen, rolluiken) wordt bediend en aangestuurd.',
        options: [
          {
            id: '6.1-0',
            label: 'Handmatige bediening',
            isAllowed: false,
          },
          {
            id: '6.1-1',
            label: 'Handmatige bediening met motor',
            isAllowed: false,
          },
          {
            id: '6.1-2',
            label: 'Automatische regeling met motor',
            isAllowed: true,
          },
          {
            id: '6.1-3',
            label: 'Gecombineerde verlichting/ zonwering/ verwarming en koeling regeling',
            isAllowed: true,
          }
        ],
      },
    ],
  },
  {
    id: 'technisch-gebouwmanagement-onderdelen',
    title: 'Technisch gebouwmanagement onderdelen',
    description: 'Hoe worden de technisch gebouwmanagementfuncties in uw gebouw geautomatiseerd?',
    icon: 'monitor-cog',
    controlPoints: [
      {
        code: '7.1',
        title: 'Setpoint-beheer',
        prompt: 'Hoe worden de setpoints (instellingen) voor klimaatregeling beheerd?',
        helpText: 'Dit betreft de wijze waarop temperatuur-setpoints en andere klimaatinstellingen worden ingesteld en aangepast.',
        options: [
          {
            id: '7.1-0',
            label: 'Handmatige instelling setpoint per ruimte',
            isAllowed: false,
          },
          {
            id: '7.1-1',
            label: 'Setpoint-instelling aangepast alleen van gedistribueerde technische ruimtes',
            isAllowed: true,
          },
          {
            id: '7.1-2',
            label: 'Setpoint-instelling vanuit een centraal punt',
            isAllowed: true,
          },
          {
            id: '7.1-3',
            label: 'Setpoint-instelling vanuit een centraal punt met regelmatige opheffing van gebruikersinstellingen',
            isAllowed: true,
          }
        ],
      },
      {
        code: '7.2',
        title: 'Bedrijfstijden',
        prompt: 'Hoe worden de bedrijfstijden (runtime) van de installaties geregeld?',
        helpText: 'Dit betreft de wijze waarop wordt bepaald wanneer installaties in- en uitgeschakeld worden gedurende de dag/week.',
        options: [
          {
            id: '7.2-0',
            label: 'Handmatige instelling',
            isAllowed: false,
          },
          {
            id: '7.2-1',
            label: 'Individuele tijd gestuurde regeling met vaste schakelpunten',
            isAllowed: true,
          },
          {
            id: '7.2-2',
            label: 'Individuele tijd gestuurde regeling met variabele schakelpunten',
            isAllowed: true,
          }
        ],
      },
      {
        code: '7.3',
        title: 'Storingsdetectie en foutdiagnose',
        prompt: 'Welke mogelijkheden zijn er voor centrale storingsdetectie en foutdiagnose?',
        helpText: 'Dit betreft de mate waarin storingen en alarmen centraal worden gedetecteerd, gemeld en gediagnosticeerd.',
        options: [
          {
            id: '7.3-0',
            label: 'Geen centrale detectie van storingen en alarmen',
            isAllowed: false,
          },
          {
            id: '7.3-1',
            label: 'Centrale indicatie van storingen of alarmen',
            isAllowed: true,
          },
          {
            id: '7.3-2',
            label: 'Centrale indicatie van fouten of alarmen met diagnostische functies',
            isAllowed: true,
          }
        ],
      },
      {
        code: '7.4',
        title: 'Energieverbruik- en binnenklimaatrapportage',
        prompt: 'Welk niveau van energieverbruik- en binnenklimaatrapportage is aanwezig?',
        helpText: 'Let op: voor dit onderdeel is labelklasse B of beter vereist. "Alleen indicatie van gemeten waardes" voldoet niet aan de GACS-eisen.',
        options: [
          {
            id: '7.4-0',
            label: 'Alleen indicatie van gemeten waardes (zoals temperatuur, meterstanden)',
            isAllowed: false,
          },
          {
            id: '7.4-1',
            label: 'Rapportage van trends in gemeten waardes en energieverbruik',
            isAllowed: true,
          },
          {
            id: '7.4-2',
            label: 'Analyse van gemeten waardes, bepaling van energieprestatie en benchmarking',
            isAllowed: true,
          }
        ],
      },
      {
        code: '7.5',
        title: 'Lokale energieproductie',
        prompt: 'Hoe wordt de lokale energieproductie en hernieuwbare energie geregeld?',
        helpText: 'Alle vormen van regeling van lokale energieproductie zijn toegestaan. Dit betreft zonnepanelen, WKK, windenergie en vergelijkbare lokale opwekking.',
        options: [
          {
            id: '7.5-0',
            label: 'Ongeregelde productie van energie, gebaseerd op beschikbaarheid van de energiebron met toevoer van energie-overschotten aan het net',
            isAllowed: true,
          },
          {
            id: '7.5-1',
            label: 'Afstemming van WKK en lokale hernieuwbare energieproductie met energievraag inclusief regeling van energieopslag en optimalisatie van eigen verbruik van lokaal opgewekte energie',
            isAllowed: true,
          }
        ],
      },
      {
        code: '7.6',
        title: 'Restwarmte en warmtevraagverschuiving',
        prompt: 'Hoe wordt restwarmte hergebruikt en de warmtevraag verschoven?',
        helpText: 'Dit betreft het benutten van restwarmte (bijv. van koelprocessen) en het verschuiven van warmtevraag naar gunstigere momenten.',
        options: [
          {
            id: '7.6-0',
            label: 'Direct hergebruik van restwarmte of verschuiving warmtevraag',
            isAllowed: false,
          },
          {
            id: '7.6-1',
            label: 'Geregeld gebruik van restwarmte en verschuiving warmtevraag (inclusief gebruik warmte-koudeopslag)',
            isAllowed: true,
          }
        ],
      },
      {
        code: '7.7',
        title: 'Smart grid integratie',
        prompt: 'Welk niveau van smart grid integratie is aanwezig?',
        helpText: 'Alle vormen van smart grid integratie zijn toegestaan. Dit betreft de afstemming tussen het gebouw en het energienetwerk.',
        options: [
          {
            id: '7.7-0',
            label: 'Geen afstemming tussen energienetten (grid) en gebouwsystemen',
            isAllowed: true,
          },
          {
            id: '7.7-1',
            label: 'Afstemming tussen energienetten (grid) en gebouwsystemen met load shifting',
            isAllowed: true,
          }
        ],
      },
    ],
  },
];

export const CHECKLIST_CONTROL_POINT_COUNT = 43 as const;
