export type CocktailSemanticProfile = {
  cocktailId: string;
  semanticDescription: string;
  semanticKeywords: string[];
};

export const cocktailSemanticProfiles: CocktailSemanticProfile[] = [
  {
    cocktailId: "french-75",
    semanticDescription: "清爽、酸爽、有起泡酒和庆祝感，适合夏天、约会、轻盈但有仪式感的场景。",
    semanticKeywords: ["气泡", "泡泡", "起泡", "香槟", "清爽", "酸爽", "夏天", "庆祝", "轻盈", "仪式感"]
  },
  {
    cocktailId: "john-collins",
    semanticDescription: "柠檬、苏打水、长饮结构，像清爽汽水，适合夏天和新手。",
    semanticKeywords: ["气泡", "苏打", "汽水", "长饮", "柠檬", "清爽", "夏天", "新手", "酸"]
  },
  {
    cocktailId: "paloma",
    semanticDescription: "葡萄柚、青柠和苏打水，明亮、微苦、清爽，适合夏天和轻松场景。",
    semanticKeywords: ["气泡", "苏打", "葡萄柚", "清爽", "夏天", "果味", "明亮", "微苦"]
  },
  {
    cocktailId: "aperol-spritz",
    semanticDescription: "低度、气泡、橙色、微苦甜，适合餐前、夏天、露台和轻松聊天。",
    semanticKeywords: ["气泡", "起泡", "低度", "橙色", "微苦", "夏天", "餐前", "轻松", "露台"]
  },
  {
    cocktailId: "gin-tonic",
    semanticDescription: "金酒和汤力水的极简气泡长饮，清冷、干净、轻松。",
    semanticKeywords: ["气泡", "汤力", "汽水", "极简", "清冷", "清爽", "轻松", "长饮"]
  },
  {
    cocktailId: "moscow-mule",
    semanticDescription: "姜汁汽水、青柠和伏特加，辛香、清爽、气泡感明显。",
    semanticKeywords: ["气泡", "姜味", "姜汁汽水", "清爽", "辛香", "青柠", "长饮"]
  },
  {
    cocktailId: "mojito",
    semanticDescription: "薄荷、青柠和苏打水，夏天、清爽、轻盈、适合入门。",
    semanticKeywords: ["气泡", "苏打", "薄荷", "青柠", "清爽", "夏天", "轻盈", "入门"]
  },
  {
    cocktailId: "margarita",
    semanticDescription: "龙舌兰、青柠和橙味利口酒，酸爽、明亮、经典，但没有气泡。",
    semanticKeywords: ["酸爽", "青柠", "龙舌兰", "橙香", "经典", "明亮"]
  }
];
