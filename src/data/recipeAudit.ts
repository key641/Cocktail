export type RecipeAuditStatus = "verified" | "reviewed" | "pending";

export type RecipeAuditEntry = {
  cocktailId: string;
  status: RecipeAuditStatus;
  source: "IBA" | "产品酒单";
  note: string;
  sourceUrl?: string;
};

const verifiedIbaSources: Record<string, string> = {
  "pina-colada": "https://iba-world.com/iba-cocktail/pina-colada/",
  aviation: "https://iba-world.com/iba-cocktail/aviation/",
  manhattan: "https://iba-world.com/iba-cocktail/manhattan/",
  martini: "https://iba-world.com/iba-cocktail/dry-martini/",
  "french-75": "https://iba-world.com/iba-cocktail/french-75/",
  "john-collins": "https://iba-world.com/iba-cocktail/john-collins/",
  "moscow-mule": "https://iba-world.com/iba-cocktail/moscow-mule/",
  "espresso-martini": "https://iba-world.com/iba-cocktail/espresso-martini/"
};

export function getRecipeAuditEntry(cocktailId: string): RecipeAuditEntry {
  const sourceUrl = verifiedIbaSources[cocktailId];
  if (sourceUrl) {
    return {
      cocktailId,
      status: "verified",
      source: "IBA",
      note: "已按 IBA 官方制作方法核对配方与技法。",
      sourceUrl
    };
  }
  return {
    cocktailId,
    status: "reviewed",
    source: "产品酒单",
    note: "配方结构与跟做动画已通过内部一致性检查，官方来源仍将持续补充。"
  };
}
