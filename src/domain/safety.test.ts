import { describe, expect, it } from "vitest";
import { checkAlcoholSafety } from "./safety";

describe("checkAlcoholSafety", () => {
  it("recommends avoiding alcohol for driving or medication contexts", () => {
    const result = checkAlcoholSafety("我等下要开车，还在吃药，有没有适合的酒");

    expect(result.shouldAvoidAlcohol).toBe(true);
    expect(result.riskFlags).toEqual(expect.arrayContaining(["driving", "medication"]));
    expect(result.message).toContain("无酒精");
  });

  it("does not block normal adult cocktail recommendation requests", () => {
    const result = checkAlcoholSafety("今晚在家想喝一杯清爽的莫吉托");

    expect(result.shouldAvoidAlcohol).toBe(false);
    expect(result.riskFlags).toEqual([]);
  });
});
