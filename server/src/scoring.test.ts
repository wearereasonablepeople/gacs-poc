import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ChecklistSection } from "../../shared/checklist.ts";
import {
  computeScore,
  getAdvice,
  getUnansweredSections,
} from "../../shared/scoring.ts";

const fixtureSections: ChecklistSection[] = [
  {
    id: "sectie-a",
    title: "Sectie A",
    controlPoints: [
      {
        code: "A.1",
        title: "Punt A1",
        prompt: "Vraag A1?",
        options: [{ id: "A.1-0", label: "Nee", isAllowed: false }],
      },
      {
        code: "A.2",
        title: "Punt A2",
        prompt: "Vraag A2?",
        options: [{ id: "A.2-0", label: "Nee", isAllowed: false }],
      },
    ],
  },
  {
    id: "sectie-b",
    title: "Sectie B",
    controlPoints: [
      {
        code: "B.1",
        title: "Punt B1",
        prompt: "Vraag B1?",
        options: [{ id: "B.1-0", label: "Nee", isAllowed: false }],
      },
    ],
  },
];

describe("computeScore", () => {
  it("excludes unanswered control points from the denominator", () => {
    const result = computeScore({
      "1.1": "1.1-2", // allowed
      "1.2": "1.2-0", // not allowed
    });
    assert.equal(result.answeredCount, 2);
    assert.equal(result.allowedCount, 1);
    assert.equal(result.overall, 50);
    assert.equal(result.totalCount, 43);
  });

  it("returns null overall when nothing is answered", () => {
    const result = computeScore({});
    assert.equal(result.overall, null);
    assert.equal(result.answeredCount, 0);
  });
});

describe("getAdvice", () => {
  it("includes provider name and uses score bands", () => {
    const contact = { providerName: "Acme" };
    assert.match(getAdvice(100, contact), /Acme/);
    assert.match(getAdvice(85, contact), /Goed resultaat/);
    assert.match(getAdvice(60, contact), /verbetering/);
    assert.match(getAdvice(20, contact), /urgente aandacht/);
  });
});

describe("getUnansweredSections", () => {
  it("returns every control point grouped by section when nothing is answered", () => {
    assert.deepEqual(getUnansweredSections({}, fixtureSections), [
      {
        sectionId: "sectie-a",
        sectionIndex: 0,
        sectionTitle: "Sectie A",
        controlPoints: [
          { code: "A.1", title: "Punt A1" },
          { code: "A.2", title: "Punt A2" },
        ],
      },
      {
        sectionId: "sectie-b",
        sectionIndex: 1,
        sectionTitle: "Sectie B",
        controlPoints: [{ code: "B.1", title: "Punt B1" }],
      },
    ]);
  });

  it("returns an empty list when every control point is answered", () => {
    assert.deepEqual(
      getUnansweredSections(
        { "A.1": "A.1-0", "A.2": "A.2-0", "B.1": "B.1-0" },
        fixtureSections,
      ),
      [],
    );
  });

  it("omits answered points and drops fully answered sections", () => {
    assert.deepEqual(
      getUnansweredSections(
        { "A.1": "A.1-0", "B.1": "B.1-0" },
        fixtureSections,
      ),
      [
        {
          sectionId: "sectie-a",
          sectionIndex: 0,
          sectionTitle: "Sectie A",
          controlPoints: [{ code: "A.2", title: "Punt A2" }],
        },
      ],
    );
  });
});
