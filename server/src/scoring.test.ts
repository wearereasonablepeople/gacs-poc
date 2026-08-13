import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeScore, getAdvice } from "../../shared/scoring.ts";

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
