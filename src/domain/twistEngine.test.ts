import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { suggestTwist } from "./twistEngine";

describe("suggestTwist", () => {
  it("makes a strong cocktail easier to drink by adding highball-style dilution", () => {
    const negroni = cocktails.find((cocktail) => cocktail.id === "negroni");
    if (!negroni) throw new Error("missing fixture");

    const twist = suggestTwist(negroni, {
      flavorPreferences: ["refreshing"],
      strengthPreference: "low",
      occasion: "summer"
    });

    expect(twist.title).toContain("清爽");
    expect(twist.adjustments.join(" ")).toContain("苏打水");
    expect(twist.disclaimer).toContain("经典结构的改编建议");
  });

  it("avoids bitter modifiers when the user dislikes bitterness", () => {
    const negroni = cocktails.find((cocktail) => cocktail.id === "negroni");
    if (!negroni) throw new Error("missing fixture");

    const twist = suggestTwist(negroni, {
      dislikedFlavors: ["bitter"],
      strengthPreference: "medium"
    });

    expect(twist.adjustments.join(" ")).toContain("减少苦味材料");
  });
});
