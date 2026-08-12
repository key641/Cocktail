import { describe, expect, it } from "vitest";
import { cocktails } from "./cocktails";
import { getRecipeAuditEntry } from "./recipeAudit";

describe("recipe audit coverage", () => {
  it("provides an audit state for every menu cocktail", () => {
    expect(cocktails.every((cocktail) => Boolean(getRecipeAuditEntry(cocktail.id).note))).toBe(true);
  });

  it("only marks recipes matching the current IBA method as verified", () => {
    expect(getRecipeAuditEntry("pina-colada")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("aviation")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("manhattan")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("martini")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("french-75")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("john-collins")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("moscow-mule")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("espresso-martini")).toMatchObject({ status: "verified", source: "IBA" });
    expect(getRecipeAuditEntry("mojito").status).toBe("reviewed");
    expect(getRecipeAuditEntry("bloody-mary").status).toBe("reviewed");
  });
});
