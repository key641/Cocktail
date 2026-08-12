import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { shareImageFilename } from "./shareImage";

describe("shareImageFilename", () => {
  it("creates a portable png filename", () => {
    const pinaColada = cocktails.find((cocktail) => cocktail.id === "pina-colada");
    if (!pinaColada) throw new Error("missing fixture");
    expect(shareImageFilename(pinaColada)).toBe("pina-colada-share.png");
  });
});

