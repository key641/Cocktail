import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { generateShareCaption } from "./captionGenerator";

describe("generateShareCaption", () => {
  const mojito = cocktails.find((cocktail) => cocktail.id === "mojito");
  if (!mojito) throw new Error("missing fixture");

  it("generates short Chinese captions for achievement sharing", () => {
    const caption = generateShareCaption({
      cocktail: mojito,
      style: "achievement",
      userLevel: "第一次尝试"
    });

    expect(caption.moodTitle).toBe("完成感");
    expect(caption.captionFull).toContain("今日调酒成就达成");
    expect(caption.shareTags).toEqual(expect.arrayContaining(["薄荷", "清爽"]));
    expect(caption.copyrightSafe).toBe(true);
  });

  it("keeps lyric mood captions original and compact", () => {
    const caption = generateShareCaption({
      cocktail: mojito,
      style: "lyric_mood",
      occasion: "夏夜"
    });

    expect(caption.captionFull.split("\n").length).toBeLessThanOrEqual(3);
    expect(caption.captionFull).not.toMatch(/真实歌词|歌名|歌手/);
    expect(caption.copyrightSafe).toBe(true);
  });
});
