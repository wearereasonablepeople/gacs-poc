import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── 0. Application Roles ──────────────────────────────
  const platformAdminRole = await prisma.role.upsert({
    where: { name: 'platform_admin' },
    update: {},
    create: { name: 'platform_admin', description: 'Platform administrator – manages tenants and global settings' },
  });
  const tenantOwnerRole = await prisma.role.upsert({
    where: { name: 'tenant_owner' },
    update: {},
    create: { name: 'tenant_owner', description: 'Tenant owner – full control over a tenant' },
  });
  const tenantAdminRole = await prisma.role.upsert({
    where: { name: 'tenant_admin' },
    update: {},
    create: { name: 'tenant_admin', description: 'Tenant admin – manages questionnaires and users within a tenant' },
  });
  console.log('✅ Roles created: platform_admin, tenant_owner, tenant_admin');

  // ─── 1. Platform Admin ─────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@gacs.local' },
    update: {},
    create: {
      email: 'admin@gacs.local',
      passwordHash: adminPassword,
      displayName: 'Platform Admin',
      roleId: platformAdminRole.id,
      isActive: true,
    },
  });
  console.log('✅ Platform admin created: admin@gacs.local / Admin123!');

  // ─── 2. Tenant: company (migrate legacy croonwolterdros slug) ──
  const legacyTenant = await prisma.tenant.findUnique({ where: { slug: 'croonwolterdros' } });
  if (legacyTenant) {
    await prisma.questionnaire.updateMany({
      where: { tenantId: legacyTenant.id, slug: 'gacs-compliance-check' },
      data: { slug: 'questionnaire' },
    });
    await prisma.tenant.update({
      where: { id: legacyTenant.id },
      data: { slug: 'company', name: 'company' },
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'company' },
    update: { name: 'company' },
    create: {
      slug: 'company',
      name: 'company',
      primaryColor: '#003366',
      secondaryColor: '#FF6600',
      isActive: true,
      createdById: platformAdmin.id,
    },
  });
  console.log('✅ Tenant created: company');

  // ─── 3. Tenant Owner ──────────────────────────────────
  const ownerPassword = await bcrypt.hash('Owner123!', SALT_ROUNDS);
  const tenantOwner = await prisma.tenantUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@croonwolterdros.nl' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@croonwolterdros.nl',
      passwordHash: ownerPassword,
      displayName: 'Marc Hopman',
      roleId: tenantOwnerRole.id,
      isActive: true,
    },
  });
  console.log('✅ Tenant owner created: owner@croonwolterdros.nl / Owner123!');

  // ─── 4. Tenant Admin ──────────────────────────────────
  const tenantAdminPassword = await bcrypt.hash('TenantAdmin123!', SALT_ROUNDS);
  await prisma.tenantUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@croonwolterdros.nl' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@croonwolterdros.nl',
      passwordHash: tenantAdminPassword,
      displayName: 'Chris Beemster',
      roleId: tenantAdminRole.id,
      isActive: true,
    },
  });
  console.log('✅ Tenant admin created: admin@croonwolterdros.nl / TenantAdmin123!');

  // ─── 5. GACS Questionnaire ────────────────────────────
  const questionnaire = await prisma.questionnaire.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'questionnaire' } },
    update: {},
    create: {
      tenantId: tenant.id,
      slug: 'questionnaire',
      title: 'GACS Compliance Check',
      description:
        'Checklist technische eisen GACS conform NEN-EN-ISO 52120. Controleer of uw gebouwautomatisering- en controlesysteem voldoet aan de wettelijke eisen.',
      introTitle: 'Voldoet uw gebouw aan de GACS eisen voor 2026?',
      introDescription:
        'Vanaf 2026 moeten utiliteitsgebouwen met installaties >290kW voldoen aan strenge eisen voor gebouwautomatisering (GACS) conform het Bouwbesluit.\n\nGebruik deze tool om in 2 minuten te checken hoe ver u bent.',
      estimatedMinutes: 2,
      isPublished: true,
      publishedAt: new Date(),
      createdById: tenantOwner.id,
    },
  });
  console.log('✅ Questionnaire created: GACS Compliance Check');

  // ─── 6. Sections & Questions from GACS checklist ──────

  // Only seed sections if the questionnaire has none yet (idempotent)
  const existingSections = await prisma.section.count({ where: { questionnaireId: questionnaire.id } });

  if (existingSections === 0) {
    const gacsData = getGACSChecklistData();

    for (const sectionData of gacsData) {
      const section = await prisma.section.create({
        data: {
          questionnaireId: questionnaire.id,
          code: sectionData.code,
          title: sectionData.title,
          icon: sectionData.icon || null,
          description: sectionData.description || null,
          displayOrder: sectionData.displayOrder,
        },
      });

      for (const questionData of sectionData.questions) {
        const question = await prisma.question.create({
          data: {
            sectionId: section.id,
            code: questionData.code,
            prompt: questionData.prompt,
            helpText: questionData.helpText || null,
            isRequired: true,
            displayOrder: questionData.displayOrder,
          },
        });

        let optionOrder = 0;
        for (const optionData of questionData.options) {
          await prisma.questionOption.create({
            data: {
              questionId: question.id,
              label: optionData.label,
              groupLabel: optionData.groupLabel || null,
              isAllowed: resolveIsAllowed(questionData.code, optionData.label),
              displayOrder: optionOrder++,
            },
          });
        }
      }
    }

    console.log('✅ GACS checklist sections, questions and options seeded');
  } else {
    console.log('⏭️  GACS checklist already seeded, skipping');
  }

  // Keep existing seeded databases aligned with checklist allowed/not-allowed flags.
  await syncQuestionOptionAllowedFlags(questionnaire.id);
  console.log('✅ Question option allowed/not-allowed flags synchronized');

  // ─── 7. Sample respondent + submission ────────
  const respondent = await prisma.respondent.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'respondent@example.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'respondent@example.com',
      isEmailVerified: true,
      verifiedAt: new Date(),
    },
  });

  const existingSubmission = await prisma.submission.findFirst({
    where: { questionnaireId: questionnaire.id, respondentId: respondent.id },
  });

  if (!existingSubmission) {
    await prisma.submission.create({
      data: {
        questionnaireId: questionnaire.id,
        respondentId: respondent.id,
        startedAt: new Date(),
        submittedAt: new Date(),
      },
    });
  }
  console.log('✅ Sample respondent and submission created');

  console.log('\n🎉 Seeding complete!');
}

// ──────────────────────────────────────────────────────────
// GACS CHECKLIST DATA (from checklist-technische-eisen-gacs-v3.pdf)
// ──────────────────────────────────────────────────────────

interface OptionData {
  label: string;
  groupLabel?: string | null;
}

interface QuestionData {
  code: string;
  prompt: string;
  helpText?: string;
  displayOrder: number;
  options: OptionData[];
}

interface SectionData {
  code: string;
  title: string;
  icon?: string;
  description?: string;
  displayOrder: number;
  questions: QuestionData[];
}

const NOT_ALLOWED_LABELS_BY_QUESTION_CODE: Record<string, string[]> = {
  '1.1': [
    'Geen automatische temperatuurregeling',
    'Centrale automatische temperatuurregeling',
  ],
  '1.2': ['Geen automatische temperatuurregeling'],
  '1.3': ['Geen automatische temperatuurregeling'],
  '1.4': ['Geen automatische regeling'],
  '1.5': ['Geen automatische regeling'],
  '1.6': ['Vaste temperatuurinstelling'],
  '1.7': ['Vaste temperatuurinstelling'],
  '1.8': ['Aan-uit regeling'],
  '1.9': ['Vaste volgorde'],
  '1.10': ['Continubedrijf'],
  '2.1': ['Automatische aan-uit regeling'],
  '2.2': ['Automatische aan-uit regeling'],
  '2.3': ['Handmatige regeling'],
  '2.4': ['Geen regeling (continubedrijf)'],
  '3.1': [
    'Geen automatische temperatuurregeling',
    'Centrale automatische temperatuurregeling',
  ],
  '3.2': ['Geen automatische temperatuurregeling'],
  '3.3': ['Geen automatische temperatuurregeling'],
  '3.4': ['Geen automatische regeling'],
  '3.5': ['Geen automatische regeling'],
  '3.6': ['Geen interlock'],
  '3.7': ['Vaste temperatuurinstelling'],
  '3.8': ['Prioritering alleen op basis van draaiuren'],
  '3.9': ['Continubedrijf'],
  '4.1': ['Geen automatische controle'],
  '4.2': ['Aan-uit-regeling'],
  '4.3': ['Geen afstemming'],
  '4.4': ['Vaste verhouding buitenluchtstroom'],
  '4.5': ['Geen automatische regeling'],
  '4.6': ['Zonder vorstbescherming'],
  '4.7': ['Zonder oververhittingsbescherming'],
  '4.8': ['Geen automatische regeling'],
  '4.9': ['Geen automatische controle'],
  '4.10': ['Geen automatische controle'],
  '5.1': ['Handmatige aan-uit-schakeling'],
  '5.2': [],
  '6.1': ['Handmatige bediening', 'Handmatige bediening met motor'],
  '7.1': ['Handmatige instelling setpoint per ruimte'],
  '7.2': ['Handmatige instelling'],
  '7.3': ['Geen centrale detectie van storingen en alarmen'],
  '7.4': ['Alleen indicatie van gemeten waardes (zoals temperatuur, meterstanden)'],
  '7.5': [],
  '7.6': ['Direct hergebruik van restwarmte of verschuiving warmtevraag'],
  '7.7': [],
};

function resolveIsAllowed(questionCode: string, optionLabel: string): boolean {
  const notAllowedLabels = NOT_ALLOWED_LABELS_BY_QUESTION_CODE[questionCode];
  if (!notAllowedLabels) {
    throw new Error(`No checklist mapping found for question code "${questionCode}"`);
  }

  return !notAllowedLabels.includes(optionLabel);
}

async function syncQuestionOptionAllowedFlags(questionnaireId: string): Promise<void> {
  const questions = await prisma.question.findMany({
    where: { section: { questionnaireId } },
    select: {
      code: true,
      options: {
        select: {
          id: true,
          label: true,
        },
      },
    },
  });

  for (const question of questions) {
    if (!question.code) continue;

    for (const option of question.options) {
      await prisma.questionOption.update({
        where: { id: option.id },
        data: {
          isAllowed: resolveIsAllowed(question.code, option.label),
        },
      });
    }
  }
}

function getGACSChecklistData(): SectionData[] {
  return [
    // ── Section 1: Verwarmingssysteem onderdelen ──────────
    {
      code: '1',
      title: 'Verwarmingssysteem onderdelen',
      icon: 'flame',
      description: 'In dit onderdeel bekijken we de automatisering van uw verwarmingssysteem, van individuele ruimteregeling tot ketelsequenties.',
      displayOrder: 1,
      questions: [
        {
          code: '1.1',
          prompt: 'Welk type temperatuurregeling is aanwezig voor de warmteafgifte van het verwarmingssysteem?',
          helpText: 'Denk aan radiatoren, vloerverwarming, convectoren en andere warmteafgifte-units. Selecteer de optie die het beste past bij de huidige situatie.',
          displayOrder: 1,
          options: [
            { label: 'Geen automatische temperatuurregeling' },
            { label: 'Centrale automatische temperatuurregeling' },
            { label: 'Individuele temperatuurregeling per ruimte' },
            { label: 'Individuele temperatuurregeling per ruimte met communicatie naar centraal systeem' },
            { label: 'Individuele temperatuurregeling per ruimte met communicatie en aanwezigheidsdetectie' },
          ],
        },
        {
          code: '1.2',
          prompt: 'Welk type temperatuurregeling is aanwezig voor de warmteafgifte bij thermisch geactiveerde gebouwstructuren (TABS)?',
          helpText: 'Thermisch geactiveerde gebouwstructuren (TABS) zijn systemen waarbij verwarmings- of koelleidingen in de bouwconstructie (bijv. betonkern) zijn opgenomen.',
          displayOrder: 2,
          options: [
            { label: 'Geen automatische temperatuurregeling' },
            { label: 'Centrale automatische temperatuurregeling' },
            { label: 'Geavanceerde centrale temperatuurregeling' },
            { label: 'Geavanceerde centrale temperatuurregeling met niet-continu gebruik en/of ruimtetemperatuur terugkoppeling' },
          ],
        },
        {
          code: '1.3',
          prompt: 'Hoe wordt de watertemperatuur in het verwarmingsdistributienetwerk (aanvoer of retour) geregeld?',
          helpText: 'Dit betreft de regeling van de aanvoer- of retourwatertemperatuur in het leidingnetwerk van het verwarmingssysteem.',
          displayOrder: 3,
          options: [
            { label: 'Geen automatische temperatuurregeling' },
            { label: 'Buitentemperatuur-compensatie regeling' },
            { label: 'Vraag-gestuurde regeling' },
          ],
        },
        {
          code: '1.4',
          prompt: 'Hoe worden de distributiepompen van het verwarmingssysteem geregeld?',
          helpText: 'Dit betreft de circulatiepompen die het verwarmde water door het leidingnetwerk pompen.',
          displayOrder: 4,
          options: [
            { label: 'Geen automatische regeling' },
            { label: 'Aan-uit regeling' },
            { label: 'Multi-fase/ multi-stap regeling' },
            { label: 'Variabele snelheid regeling (intern of extern)' },
          ],
        },
        {
          code: '1.5',
          prompt: 'Hoe wordt het verwarmingssysteem als geheel in- en uitgeschakeld?',
          helpText: 'Dit betreft de wijze waarop het verwarmingssysteem wordt gestart en gestopt, bijvoorbeeld seizoensgebonden of op basis van buitentemperatuur.',
          displayOrder: 5,
          options: [
            { label: 'Geen automatische regeling' },
            { label: 'Automatische regeling met timer' },
            { label: 'Automatische regeling met start-stop optimalisatie' },
            { label: 'Automatische vraag-gestuurde regeling' },
          ],
        },
        {
          code: '1.6',
          prompt: 'Hoe wordt het verwarmingstoestel (verbrandingstoestellen of warmtelevering) geregeld?',
          helpText: 'Denk aan gasketels, stadsverwarming-aansluitingen of andere toestellen op basis van verbranding of externe warmtelevering.',
          displayOrder: 6,
          options: [
            { label: 'Vaste temperatuurinstelling' },
            { label: 'Variabele temperatuurinstelling gebaseerd op buitentemperatuur' },
            { label: 'Vraag-gestuurde variabele temperatuurinstelling' },
          ],
        },
        {
          code: '1.7',
          prompt: 'Hoe wordt het verwarmingstoestel (warmtepomp) geregeld?',
          helpText: 'Dit betreft de regeling van warmtepompen die als verwarmingstoestel worden ingezet.',
          displayOrder: 7,
          options: [
            { label: 'Vaste temperatuurinstelling' },
            { label: 'Variabele temperatuurinstelling gebaseerd op buitentemperatuur' },
            { label: 'Vraag-gestuurde variabele temperatuurinstelling' },
          ],
        },
        {
          code: '1.8',
          prompt: 'Hoe wordt het verwarmingstoestel (buiten-unit) geregeld?',
          helpText: 'Dit betreft de buiten-unit van split- of multi-splitsystemen die voor verwarming worden ingezet.',
          displayOrder: 8,
          options: [
            { label: 'Aan-uit regeling' },
            { label: 'Multi-stappen regeling' },
            { label: 'Variabele regeling' },
          ],
        },
        {
          code: '1.9',
          prompt: 'Hoe wordt de volgorde van inzet van meerdere warmte-opwekkers bepaald?',
          helpText: 'Als er meerdere warmtebronnen aanwezig zijn (bijv. ketel + warmtepomp), hoe wordt dan bepaald welke als eerste wordt ingezet?',
          displayOrder: 9,
          options: [
            { label: 'Vaste volgorde' },
            { label: 'Prioritering gebaseerd op belasting (warmtevraag)' },
            { label: 'Dynamische prioritering gebaseerd op efficiency en karakteristieken van de toestellen' },
            { label: 'Vraag-gestuurde prioritering (gebaseerd op meerdere parameters)' },
          ],
        },
        {
          code: '1.10',
          prompt: 'Hoe wordt de warmteopslag geregeld?',
          helpText: 'Dit betreft buffervaten of andere vormen van warmteopslag in het verwarmingssysteem.',
          displayOrder: 10,
          options: [
            { label: 'Continubedrijf' },
            { label: 'Twee-sensor gestuurde warmteopslag' },
            { label: 'Vraag-gestuurde warmteopslag' },
          ],
        },
      ],
    },
    // ── Section 2: Warm tapwater onderdelen ──────────────
    {
      code: '2',
      title: 'Warm tapwater onderdelen',
      icon: 'droplets',
      description: 'Hoe wordt uw warm tapwatersysteem aangestuurd? Bekijk de regeling en automatisering van warm tapwater.',
      displayOrder: 2,
      questions: [
        {
          code: '2.1',
          prompt: 'Hoe wordt de elektrische boiler of warmtepompboiler voor warm tapwater geregeld?',
          helpText: 'Dit betreft de regeling van de boiler die warm tapwater bereidt met elektriciteit of een warmtepomp.',
          displayOrder: 1,
          options: [
            { label: 'Automatische aan-uit regeling' },
            { label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming' },
            { label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming en multi-sensor regeling van warm wateropslag' },
          ],
        },
        {
          code: '2.2',
          prompt: 'Hoe wordt de warmwater-opslag met externe warmwateropwekking geregeld?',
          helpText: 'Dit betreft een warmwateropslagvat dat wordt verwarmd door een externe bron, zoals een ketel of stadsverwarming.',
          displayOrder: 2,
          options: [
            { label: 'Automatische aan-uit regeling' },
            { label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming' },
            { label: 'Automatische aan-uit regeling met tijd-gestuurde opwarming en vraag-gestuurde multi-sensor regeling van warm wateropslag' },
          ],
        },
        {
          code: '2.3',
          prompt: 'Hoe wordt de zonneboiler met back-up warmteopwekker geregeld?',
          helpText: 'Dit betreft een systeem met zonnecollectoren als primaire warmtebron en een conventionele back-up (bijv. gasketel).',
          displayOrder: 3,
          options: [
            { label: 'Handmatige regeling' },
            { label: 'Automatische regeling met zon-thermische opwekking (prioriteit 1) en additionele opwekking (prioriteit 2)' },
            { label: 'Automatische regeling met zon-thermische opwekking (prioriteit 1) en additionele opwekking (prioriteit 2) met vraag-gestuurde temperatuurregeling' },
          ],
        },
        {
          code: '2.4',
          prompt: 'Hoe wordt de warm tapwater distributiepomp (circulatiepomp) geregeld?',
          helpText: 'Dit betreft de pomp die het warme tapwater laat circuleren om wachttijd bij het tappunt te beperken.',
          displayOrder: 4,
          options: [
            { label: 'Geen regeling (continubedrijf)' },
            { label: 'Timer-gestuurd' },
          ],
        },
      ],
    },
    // ── Section 3: Airconditioningssysteem onderdelen ────
    {
      code: '3',
      title: 'Airconditioningssysteem onderdelen',
      icon: 'snowflake',
      description: 'Hoe wordt de koeling in uw gebouw geregeld? Controleer de automatisering van uw airconditioningssysteem.',
      displayOrder: 3,
      questions: [
        {
          code: '3.1',
          prompt: 'Welk type temperatuurregeling is aanwezig voor de koude-afgifte-units (koude-paneel, fan coil-unit, binnen-unit airco)?',
          helpText: 'Dit betreft de units die gekoelde lucht of koud water afgeven aan de ruimte, zoals koude-panelen, fan coil-units of split-unit binnenunits.',
          displayOrder: 1,
          options: [
            { label: 'Geen automatische temperatuurregeling' },
            { label: 'Centrale automatische temperatuurregeling' },
            { label: 'Individuele temperatuurregeling per ruimte' },
            { label: 'Individuele temperatuurregeling per ruimte met communicatie naar centraal systeem' },
            { label: 'Individuele temperatuurregeling per ruimte met communicatie en aanwezigheidsdetectie' },
          ],
        },
        {
          code: '3.2',
          prompt: 'Welk type temperatuurregeling is aanwezig voor de koude-afgifte bij thermisch geactiveerde gebouwstructuren (TABS)?',
          helpText: 'TABS-systemen die voor koeling worden ingezet, waarbij koelleidingen in de bouwconstructie zijn opgenomen.',
          displayOrder: 2,
          options: [
            { label: 'Geen automatische temperatuurregeling' },
            { label: 'Centrale automatische temperatuurregeling' },
            { label: 'Geavanceerde centrale temperatuurregeling' },
            { label: 'Geavanceerde centrale temperatuurregeling met niet-continu gebruik en/of ruimtetemperatuur terugkoppeling' },
          ],
        },
        {
          code: '3.3',
          prompt: 'Hoe wordt de watertemperatuur in het koeldistributienetwerk (aanvoer of retour) geregeld?',
          helpText: 'Dit betreft de regeling van de aanvoer- of retourwatertemperatuur in het leidingnetwerk van het koelsysteem.',
          displayOrder: 3,
          options: [
            { label: 'Geen automatische temperatuurregeling' },
            { label: 'Buitentemperatuur-compensatie regeling' },
            { label: 'Vraag-gestuurde regeling' },
          ],
        },
        {
          code: '3.4',
          prompt: 'Hoe worden de distributiepompen van het koelsysteem geregeld?',
          helpText: 'Dit betreft de circulatiepompen die het gekoelde water door het koelleidingnetwerk pompen.',
          displayOrder: 4,
          options: [
            { label: 'Geen automatische regeling' },
            { label: 'Aan-uit regeling' },
            { label: 'Multi-fase / multi-stap regeling' },
            { label: 'Variabele snelheid regeling (intern of extern)' },
          ],
        },
        {
          code: '3.5',
          prompt: 'Hoe wordt het koelsysteem als geheel in- en uitgeschakeld?',
          helpText: 'Dit betreft de wijze waarop het koelsysteem wordt gestart en gestopt, bijvoorbeeld seizoensgebonden of op basis van buitentemperatuur.',
          displayOrder: 5,
          options: [
            { label: 'Geen automatische regeling' },
            { label: 'Automatische regeling met timer' },
            { label: 'Automatische regeling met start-stop optimalisatie' },
            { label: 'Automatische vraag-gestuurde regeling' },
          ],
        },
        {
          code: '3.6',
          prompt: 'Welk type interlock (vergrendeling) is er tussen het verwarmings- en koelsysteem?',
          helpText: 'Een interlock voorkomt dat het verwarmings- en koelsysteem tegelijkertijd actief zijn in dezelfde zone.',
          displayOrder: 6,
          options: [
            { label: 'Geen interlock' },
            { label: 'Gedeeltelijke interlock' },
            { label: 'Volledige interlock' },
          ],
        },
        {
          code: '3.7',
          prompt: 'Hoe worden de koude-opwekkers (bijv. koelmachines, chillers) geregeld?',
          helpText: 'Dit betreft de temperatuurregeling van koude-opwekkers zoals koelmachines en chillers.',
          displayOrder: 7,
          options: [
            { label: 'Vaste temperatuurinstelling' },
            { label: 'Variabele temperatuurinstelling gebaseerd op buitentemperatuur' },
            { label: 'Vraag-gestuurde variabele temperatuurinstelling' },
          ],
        },
        {
          code: '3.8',
          prompt: 'Hoe wordt de volgorde van inzet van meerdere koude-opwekkers bepaald?',
          helpText: 'Als er meerdere koude-opwekkers aanwezig zijn, hoe wordt dan bepaald welke als eerste wordt ingezet?',
          displayOrder: 8,
          options: [
            { label: 'Prioritering alleen op basis van draaiuren' },
            { label: 'Prioritering gebaseerd op belasting (koude vraag)' },
            { label: 'Dynamische prioritering gebaseerd op efficiency en karakteristieken van de toestellen' },
            { label: 'Vraag-gestuurde prioritering (gebaseerd op meerdere parameters)' },
          ],
        },
        {
          code: '3.9',
          prompt: 'Hoe wordt de warmte-koudeopslag (WKO) geregeld?',
          helpText: 'Dit betreft de regeling van warmte-koudeopslag, zoals bodemenergiesystemen of seizoensopslag.',
          displayOrder: 9,
          options: [
            { label: 'Continubedrijf' },
            { label: 'Tijd gestuurde warmteopslag' },
            { label: 'Vraag-gestuurde warmteopslag' },
          ],
        },
      ],
    },
    // ── Section 4: Ventilatiesysteem onderdelen ──────────
    {
      code: '4',
      title: 'Ventilatiesysteem onderdelen',
      icon: 'wind',
      description: 'Bekijk hoe het ventilatiesysteem in uw gebouw geautomatiseerd is.',
      displayOrder: 4,
      questions: [
        {
          code: '4.1',
          prompt: 'Hoe wordt de ventilatiestroom in de ruimte geregeld?',
          helpText: 'Dit betreft de wijze waarop de hoeveelheid ventilatielucht per ruimte wordt aangestuurd.',
          displayOrder: 1,
          options: [
            { label: 'Geen automatische controle' },
            { label: 'Tijd gestuurde regeling' },
            { label: 'Aanwezigheidsdetectie' },
          ],
        },
        {
          code: '4.2',
          prompt: 'Hoe wordt de ruimtetemperatuur geregeld bij luchtsystemen?',
          helpText: 'Dit betreft de temperatuurregeling in ruimtes waar uitsluitend lucht als transport-medium wordt gebruikt voor verwarming/koeling.',
          displayOrder: 2,
          options: [
            { label: 'Aan-uit-regeling' },
            { label: 'Variabele regeling' },
            { label: 'Vraag gestuurde regeling' },
          ],
        },
        {
          code: '4.3',
          prompt: 'Is er afstemming van de temperatuurregeling bij gecombineerde lucht-watersystemen?',
          helpText: 'Bij gecombineerde lucht-watersystemen (bijv. luchtbehandeling + fan coil-units) is afstemming nodig om conflicten te voorkomen.',
          displayOrder: 3,
          options: [
            { label: 'Geen afstemming' },
            { label: 'Afstemming' },
          ],
        },
        {
          code: '4.4',
          prompt: 'Hoe wordt de verhouding buitenlucht in het ventilatiesysteem geregeld?',
          helpText: 'Dit betreft de verhouding tussen buitenlucht (verse lucht) en recirculatielucht in het ventilatiesysteem.',
          displayOrder: 4,
          options: [
            { label: 'Vaste verhouding buitenluchtstroom' },
            { label: 'Tijd gestuurde getrapte regeling verhouding buitenlucht' },
            { label: 'Vraag gestuurde getrapte regeling verhouding buitenlucht' },
          ],
        },
        {
          code: '4.5',
          prompt: 'Hoe wordt de luchtstroom of luchtdruk van de air handling unit (AHU) geregeld?',
          helpText: 'Dit betreft de regeling van ventilatoren in de luchtbehandelingskast (AHU) op basis van luchtstroom of kanaaldruk.',
          displayOrder: 5,
          options: [
            { label: 'Geen automatische regeling' },
            { label: 'Tijd gestuurde aan-uit-regeling' },
            { label: 'Multi-stap regeling' },
            { label: 'Automatische luchtstroom of -drukregeling (met of zonder reset)' },
          ],
        },
        {
          code: '4.6',
          prompt: 'Is er vorstbescherming aanwezig bij de warmteterugwinning?',
          helpText: 'Vorstbescherming voorkomt dat de warmtewisselaar bevriest bij lage buitentemperaturen, wat de luchttoevoer zou blokkeren.',
          displayOrder: 6,
          options: [
            { label: 'Zonder vorstbescherming' },
            { label: 'Met vorstbescherming' },
          ],
        },
        {
          code: '4.7',
          prompt: 'Is er oververhittingsbescherming aanwezig bij de warmteterugwinning?',
          helpText: 'Oververhittingsbescherming voorkomt dat de warmteterugwinning ongewenste opwarming veroorzaakt wanneer de buitenlucht al warm genoeg is.',
          displayOrder: 7,
          options: [
            { label: 'Zonder oververhittingsbescherming' },
            { label: 'Met oververhittingsbescherming' },
          ],
        },
        {
          code: '4.8',
          prompt: 'Hoe wordt vrije koeling (free cooling) toegepast en geregeld?',
          helpText: 'Vrije koeling maakt gebruik van koele buitenlucht om het gebouw te koelen zonder mechanische koeling.',
          displayOrder: 8,
          options: [
            { label: 'Geen automatische regeling' },
            { label: 'Nachtkoeling' },
            { label: 'Vrije koeling' },
            { label: 'H,x gestuurde regeling (= modulerende regeling)' },
          ],
        },
        {
          code: '4.9',
          prompt: 'Hoe wordt de temperatuur van de ventilatielucht (toevoerlucht) geregeld?',
          helpText: 'Dit betreft de regeling van de temperatuur van de lucht die door de luchtbehandeling aan het gebouw wordt geleverd.',
          displayOrder: 9,
          options: [
            { label: 'Geen automatische controle' },
            { label: 'Constante temperatuurinstelling' },
            { label: 'Variabele temperatuurinstelling met buitentemperatuurcorrectie' },
            { label: 'Variabele temperatuurinstelling met vraag-gestuurde correctie' },
          ],
        },
        {
          code: '4.10',
          prompt: 'Hoe wordt de luchtvochtigheid geregeld?',
          helpText: 'Dit betreft de regeling van de relatieve luchtvochtigheid in het gebouw via het ventilatiesysteem.',
          displayOrder: 10,
          options: [
            { label: 'Geen automatische controle' },
            { label: 'Dauwpuntregeling' },
            { label: 'Directe regeling luchtvochtigheid' },
          ],
        },
      ],
    },
    // ── Section 5: Verlichtingssysteem onderdelen ────────
    {
      code: '5',
      title: 'Verlichtingssysteem onderdelen',
      icon: 'lightbulb',
      description: 'Hoe wordt de verlichting in uw gebouw aangestuurd?',
      displayOrder: 5,
      questions: [
        {
          code: '5.1',
          prompt: 'Welk type aanwezigheidsdetectie is aanwezig voor de verlichtingsregeling?',
          helpText: 'Dit betreft de wijze waarop verlichting wordt geschakeld op basis van aanwezigheid van personen in de ruimte.',
          displayOrder: 1,
          options: [
            { label: 'Handmatige aan-uit-schakeling' },
            { label: 'Handmatige aan-uit-schakeling met veegschakeling' },
            { label: 'Aanwezigheidsdetectie (met automatische of handmatige aan-schakeling)' },
          ],
        },
        {
          code: '5.2',
          prompt: 'Welk type daglichtregeling is aanwezig voor de verlichting?',
          displayOrder: 2,
          helpText: 'Alle vormen van daglichtregeling zijn toegestaan. Dit betreft het automatisch aanpassen van kunstlicht op basis van beschikbaar daglicht.',
          options: [
            { label: 'Handmatig (centraal of per ruimte)' },
            { label: 'Automatisch (aan-uit of dimregeling)' },
          ],
        },
      ],
    },
    // ── Section 6: Zonweringssysteem onderdelen ──────────
    {
      code: '6',
      title: 'Zonweringssysteem onderdelen',
      icon: 'sun',
      description: 'Is de zonwering in uw gebouw automatisch geregeld?',
      displayOrder: 6,
      questions: [
        {
          code: '6.1',
          prompt: 'Hoe wordt de zonwering geregeld?',
          helpText: 'Dit betreft de wijze waarop zonwering (bijv. screens, lamellen, rolluiken) wordt bediend en aangestuurd.',
          displayOrder: 1,
          options: [
            { label: 'Handmatige bediening' },
            { label: 'Handmatige bediening met motor' },
            { label: 'Automatische regeling met motor' },
            { label: 'Gecombineerde verlichting/ zonwering/ verwarming en koeling regeling' },
          ],
        },
      ],
    },
    // ── Section 7: Technisch gebouwmanagement onderdelen ─
    {
      code: '7',
      title: 'Technisch gebouwmanagement onderdelen',
      icon: 'monitor-cog',
      description: 'Hoe worden de technisch gebouwmanagementfuncties in uw gebouw geautomatiseerd?',
      displayOrder: 7,
      questions: [
        {
          code: '7.1',
          prompt: 'Hoe worden de setpoints (instellingen) voor klimaatregeling beheerd?',
          helpText: 'Dit betreft de wijze waarop temperatuur-setpoints en andere klimaatinstellingen worden ingesteld en aangepast.',
          displayOrder: 1,
          options: [
            { label: 'Handmatige instelling setpoint per ruimte' },
            { label: 'Setpoint-instelling aangepast alleen van gedistribueerde technische ruimtes' },
            { label: 'Setpoint-instelling vanuit een centraal punt' },
            { label: 'Setpoint-instelling vanuit een centraal punt met regelmatige opheffing van gebruikersinstellingen' },
          ],
        },
        {
          code: '7.2',
          prompt: 'Hoe worden de bedrijfstijden (runtime) van de installaties geregeld?',
          helpText: 'Dit betreft de wijze waarop wordt bepaald wanneer installaties in- en uitgeschakeld worden gedurende de dag/week.',
          displayOrder: 2,
          options: [
            { label: 'Handmatige instelling' },
            { label: 'Individuele tijd gestuurde regeling met vaste schakelpunten' },
            { label: 'Individuele tijd gestuurde regeling met variabele schakelpunten' },
          ],
        },
        {
          code: '7.3',
          prompt: 'Welke mogelijkheden zijn er voor centrale storingsdetectie en foutdiagnose?',
          helpText: 'Dit betreft de mate waarin storingen en alarmen centraal worden gedetecteerd, gemeld en gediagnosticeerd.',
          displayOrder: 3,
          options: [
            { label: 'Geen centrale detectie van storingen en alarmen' },
            { label: 'Centrale indicatie van storingen of alarmen' },
            { label: 'Centrale indicatie van fouten of alarmen met diagnostische functies' },
          ],
        },
        {
          code: '7.4',
          prompt: 'Welk niveau van energieverbruik- en binnenklimaatrapportage is aanwezig?',
          helpText: 'Let op: voor dit onderdeel is labelklasse B of beter vereist. "Alleen indicatie van gemeten waardes" voldoet niet aan de GACS-eisen.',
          displayOrder: 4,
          options: [
            { label: 'Alleen indicatie van gemeten waardes (zoals temperatuur, meterstanden)' },
            { label: 'Rapportage van trends in gemeten waardes en energieverbruik' },
            { label: 'Analyse van gemeten waardes, bepaling van energieprestatie en benchmarking' },
          ],
        },
        {
          code: '7.5',
          prompt: 'Hoe wordt de lokale energieproductie en hernieuwbare energie geregeld?',
          helpText: 'Alle vormen van regeling van lokale energieproductie zijn toegestaan. Dit betreft zonnepanelen, WKK, windenergie en vergelijkbare lokale opwekking.',
          displayOrder: 5,
          options: [
            { label: 'Ongeregelde productie van energie, gebaseerd op beschikbaarheid van de energiebron met toevoer van energie-overschotten aan het net' },
            { label: 'Afstemming van WKK en lokale hernieuwbare energieproductie met energievraag inclusief regeling van energieopslag en optimalisatie van eigen verbruik van lokaal opgewekte energie' },
          ],
        },
        {
          code: '7.6',
          prompt: 'Hoe wordt restwarmte hergebruikt en de warmtevraag verschoven?',
          helpText: 'Dit betreft het benutten van restwarmte (bijv. van koelprocessen) en het verschuiven van warmtevraag naar gunstigere momenten.',
          displayOrder: 6,
          options: [
            { label: 'Direct hergebruik van restwarmte of verschuiving warmtevraag' },
            { label: 'Geregeld gebruik van restwarmte en verschuiving warmtevraag (inclusief gebruik warmte-koudeopslag)' },
          ],
        },
        {
          code: '7.7',
          prompt: 'Welk niveau van smart grid integratie is aanwezig?',
          helpText: 'Alle vormen van smart grid integratie zijn toegestaan. Dit betreft de afstemming tussen het gebouw en het energienetwerk.',
          displayOrder: 7,
          options: [
            { label: 'Geen afstemming tussen energienetten (grid) en gebouwsystemen' },
            { label: 'Afstemming tussen energienetten (grid) en gebouwsystemen met load shifting' },
          ],
        },
      ],
    },
  ];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
