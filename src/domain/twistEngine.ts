import type { Cocktail } from "./types";
import type { ParsedFlavor, ParsedPreference } from "./preferenceParser";

export type TwistInput = Partial<Pick<ParsedPreference, "flavorPreferences" | "dislikedFlavors" | "strengthPreference" | "occasion">>;

export type TwistSuggestion = {
  title: string;
  description: string;
  adjustments: string[];
  disclaimer: string;
};

function includesFlavor(values: ParsedFlavor[] | undefined, flavor: ParsedFlavor) {
  return values?.includes(flavor) ?? false;
}

export function suggestTwist(cocktail: Cocktail, input: TwistInput): TwistSuggestion {
  const adjustments: string[] = [];
  const wantsRefreshing = includesFlavor(input.flavorPreferences, "refreshing") || input.occasion === "summer";
  const wantsLessStrong = input.strengthPreference === "low";
  const dislikesBitter = includesFlavor(input.dislikedFlavors, "bitter");

  if (wantsLessStrong) {
    adjustments.push("基酒减少 10-15 ml，并用苏打水、汤力水或冷泡茶拉长。");
  }

  if (wantsRefreshing) {
    adjustments.push("增加柑橘酸度和冰块，优先做成清爽 highball 方向。");
    if (!adjustments.some((item) => item.includes("苏打水"))) {
      adjustments.push("加入 60-90 ml 苏打水，让酒精感更轻。");
    }
  }

  if (dislikesBitter) {
    adjustments.push("减少苦味材料，避免继续增加 Campari、苦精或强草本利口酒。");
  }

  if (includesFlavor(input.flavorPreferences, "fruity")) {
    adjustments.push("加入 15-30 ml 果汁或果泥，同时小幅减少糖浆。");
  }

  if (adjustments.length === 0) {
    adjustments.push("保持经典比例，只微调冰镇、稀释和装饰，让风味更贴近当前场景。");
  }

  const title = wantsRefreshing || wantsLessStrong ? `${cocktail.name}清爽改编` : `${cocktail.name}经典微调`;

  return {
    title,
    description: `以 ${cocktail.englishName} 为母体，只做小幅、可解释的调整。`,
    adjustments,
    disclaimer: "这是基于经典结构的改编建议，不是 IBA 官方配方。"
  };
}
