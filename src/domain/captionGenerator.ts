import type { Cocktail } from "./types";

export type CaptionStyle = "casual_share" | "achievement" | "professional_note" | "lyric_mood";

export type CaptionInput = {
  cocktail: Cocktail;
  style: CaptionStyle;
  occasion?: string;
  photoMood?: string;
  userLevel?: string;
};

export type ShareCaption = {
  moodTitle: string;
  captionShort: string;
  captionFull: string;
  shareTags: string[];
  copyrightSafe: boolean;
};

function tagsFor(cocktail: Cocktail) {
  return cocktail.tags.slice(0, 3);
}

export function generateShareCaption({ cocktail, style, occasion, userLevel }: CaptionInput): ShareCaption {
  const tags = tagsFor(cocktail);

  if (style === "achievement") {
    return {
      moodTitle: "完成感",
      captionShort: `今日调酒成就达成：${cocktail.name}。`,
      captionFull: `今日调酒成就达成：${cocktail.name}。\n${userLevel ?? "这次尝试"}比想象中更顺手。`,
      shareTags: tags,
      copyrightSafe: true
    };
  }

  if (style === "professional_note") {
    return {
      moodTitle: "风味点评",
      captionShort: `${cocktail.englishName} 的重点是${tags.join("、")}。`,
      captionFull: `这杯以经典配方为基础，${tags.join("、")}构成主要风味。\n${cocktail.bartenderTip}`,
      shareTags: tags,
      copyrightSafe: true
    };
  }

  if (style === "lyric_mood") {
    const scene = occasion ?? "今晚";
    const firstTag = tags[0] ?? "风味";
    const secondTag = tags[1] ?? "微光";
    return {
      moodTitle: `${scene}微光感`,
      captionShort: `把${firstTag}留在杯沿，把${secondTag}放进今晚。`,
      captionFull: `把${firstTag}留在杯沿，\n把${secondTag}放进今晚。\n这一杯，是自己调出来的。`,
      shareTags: tags,
      copyrightSafe: true
    };
  }

  return {
    moodTitle: "轻松分享",
    captionShort: `今天的快乐是自己调出来的：${cocktail.name}。`,
    captionFull: `今天的快乐是自己调出来的。\n${cocktail.name} 的${tags.join("、")}一出来，整杯酒就有了状态。`,
    shareTags: tags,
    copyrightSafe: true
  };
}
