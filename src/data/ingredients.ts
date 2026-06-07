import type { Ingredient } from "../domain/types";

export const ingredients: Ingredient[] = [
  { id: "gin", name: "金酒", category: "spirit", aliases: ["gin", "杜松子酒"], common: true },
  { id: "vodka", name: "伏特加", category: "spirit", aliases: ["vodka"], common: true },
  { id: "white-rum", name: "白朗姆", category: "spirit", aliases: ["white rum", "rum", "朗姆", "白兰姆"], common: true },
  { id: "tequila", name: "龙舌兰", category: "spirit", aliases: ["tequila"], common: true },
  { id: "bourbon", name: "波本威士忌", category: "spirit", aliases: ["bourbon", "whiskey", "威士忌"], common: true },
  { id: "rye-whiskey", name: "黑麦威士忌", category: "spirit", aliases: ["rye", "rye whiskey", "黑麦"], common: false },
  { id: "cognac", name: "干邑", category: "spirit", aliases: ["cognac", "brandy", "白兰地"], common: false },
  { id: "cachaca", name: "卡沙萨", category: "spirit", aliases: ["cachaca", "cachaça", "巴西朗姆"], common: false },
  { id: "dark-rum", name: "黑朗姆", category: "spirit", aliases: ["dark rum", "黑朗姆"], common: false },
  { id: "coffee-liqueur", name: "咖啡利口酒", category: "liqueur", aliases: ["coffee liqueur", "kahlua", "咖啡酒"], common: false },
  { id: "maraschino-liqueur", name: "黑樱桃利口酒", category: "liqueur", aliases: ["maraschino", "maraschino liqueur"], common: false },
  { id: "creme-de-violette", name: "紫罗兰利口酒", category: "liqueur", aliases: ["creme de violette", "violette", "紫罗兰酒"], common: false },
  { id: "campari", name: "金巴利", category: "bitter", aliases: ["campari"], common: false },
  { id: "aperol", name: "阿佩罗", category: "bitter", aliases: ["aperol"], common: false },
  { id: "sweet-vermouth", name: "甜味美思", category: "liqueur", aliases: ["sweet vermouth", "红味美思"], common: false },
  { id: "dry-vermouth", name: "干味美思", category: "liqueur", aliases: ["dry vermouth"], common: false },
  { id: "orange-liqueur", name: "橙味利口酒", category: "liqueur", aliases: ["cointreau", "triple sec", "君度", "橙酒"], common: true },
  { id: "agave-nectar", name: "龙舌兰糖浆", category: "sweetener", aliases: ["agave", "agave nectar", "龙舌兰蜜"], common: false },
  { id: "orgeat", name: "杏仁糖浆", category: "sweetener", aliases: ["orgeat", "杏仁糖浆"], common: false },
  { id: "grenadine", name: "红石榴糖浆", category: "sweetener", aliases: ["grenadine", "石榴糖浆", "红石榴"], common: false },
  { id: "raspberry-syrup", name: "覆盆子糖浆", category: "sweetener", aliases: ["raspberry syrup", "覆盆子糖浆", "树莓糖浆"], common: false },
  { id: "lemon-juice", name: "柠檬汁", category: "citrus", aliases: ["lemon", "柠檬", "柠檬汁"], common: true },
  { id: "lime-juice", name: "青柠汁", category: "citrus", aliases: ["lime", "青柠", "莱姆", "青柠汁"], common: true },
  { id: "simple-syrup", name: "糖浆", category: "sweetener", aliases: ["simple syrup", "syrup", "糖水", "糖浆"], common: true },
  { id: "sugar", name: "方糖", category: "sweetener", aliases: ["sugar", "方糖", "白糖"], common: true },
  { id: "mint", name: "薄荷", category: "herb", aliases: ["mint", "薄荷叶", "薄荷"], common: true },
  { id: "soda-water", name: "苏打水", category: "mixer", aliases: ["soda", "soda water", "气泡水", "苏打水"], common: true },
  { id: "tonic-water", name: "汤力水", category: "mixer", aliases: ["tonic", "tonic water", "汤力水"], common: true },
  { id: "ginger-beer", name: "姜汁汽水", category: "mixer", aliases: ["ginger beer", "姜汁啤酒", "姜汁汽水"], common: false },
  { id: "sparkling-wine", name: "起泡酒", category: "mixer", aliases: ["prosecco", "champagne", "sparkling wine", "起泡酒", "香槟"], common: false },
  { id: "cranberry-juice", name: "蔓越莓汁", category: "juice", aliases: ["cranberry", "蔓越莓"], common: false },
  { id: "tomato-juice", name: "番茄汁", category: "juice", aliases: ["tomato juice", "番茄汁"], common: false },
  { id: "orange-juice", name: "橙汁", category: "juice", aliases: ["orange juice", "橙汁"], common: true },
  { id: "grapefruit-juice", name: "葡萄柚汁", category: "juice", aliases: ["grapefruit", "grapefruit juice", "西柚汁", "葡萄柚汁"], common: false },
  { id: "pineapple-juice", name: "菠萝汁", category: "juice", aliases: ["pineapple juice", "菠萝汁"], common: false },
  { id: "peach-puree", name: "白桃泥", category: "juice", aliases: ["peach puree", "white peach", "桃泥", "白桃"], common: false },
  { id: "espresso", name: "浓缩咖啡", category: "mixer", aliases: ["espresso", "咖啡", "浓缩"], common: false },
  { id: "coconut-cream", name: "椰浆", category: "mixer", aliases: ["coconut cream", "椰浆", "椰奶"], common: false },
  { id: "angostura-bitters", name: "安格斯图拉苦精", category: "bitter", aliases: ["bitters", "angostura", "苦精"], common: false },
  { id: "worcestershire", name: "伍斯特酱", category: "bitter", aliases: ["worcestershire", "伍斯特"], common: false },
  { id: "egg-white", name: "蛋白", category: "mixer", aliases: ["egg white", "蛋白"], common: false },
  { id: "olive", name: "橄榄", category: "garnish", aliases: ["olive", "橄榄"], common: false },
  { id: "salt", name: "盐", category: "garnish", aliases: ["salt", "盐"], common: true }
];

export const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

export function getIngredientName(id: string) {
  return ingredientById.get(id)?.name ?? id;
}
