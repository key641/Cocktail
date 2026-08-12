import { describe, expect, it } from "vitest";
import { addRecentCocktail, defaultUserProfile, toggleFavoriteCocktail } from "./userProfile";

describe("userProfile", () => {
  it("toggles favorites without duplicates", () => {
    const added = toggleFavoriteCocktail(defaultUserProfile, "mojito");
    expect(added.favoriteCocktailIds).toEqual(["mojito"]);
    expect(toggleFavoriteCocktail(added, "mojito").favoriteCocktailIds).toEqual([]);
  });

  it("keeps recent cocktails unique and bounded", () => {
    let profile = defaultUserProfile;
    for (let index = 0; index < 15; index += 1) profile = addRecentCocktail(profile, `drink-${index}`);
    profile = addRecentCocktail(profile, "drink-8");
    expect(profile.recentCocktailIds).toHaveLength(12);
    expect(profile.recentCocktailIds[0]).toBe("drink-8");
    expect(profile.recentCocktailIds.filter((id) => id === "drink-8")).toHaveLength(1);
  });
});

