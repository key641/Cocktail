import type { Cocktail } from "../domain/types";

export const cocktails: Cocktail[] = [
  {
    id: "gin-sour",
    name: "金酒酸",
    englishName: "Gin Sour",
    intro: "酸甜平衡、清爽直接，是新手最容易成功的经典酸酒。",
    base: "gin",
    tags: ["清爽", "酸甜", "入门"],
    strength: "medium",
    glass: "古典杯",
    garnish: "柠檬片",
    ingredients: [
      { ingredientId: "gin", amount: "45 ml" },
      { ingredientId: "lemon-juice", amount: "25 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" }
    ],
    steps: ["把所有材料加入摇壶。", "加满冰块，用力摇 12 秒。", "滤入装冰的古典杯，放上柠檬片。"],
    tasteProfile: { sweet: 2, sour: 5, bitter: 1, fresh: 4, strong: 2, fruity: 1, herbal: 1, bubbly: 0 },
    bartenderTip: "如果没有现成糖浆，用等量蜂蜜和温水调开也可以。"
  },
  {
    id: "margarita",
    name: "玛格丽特",
    englishName: "Margarita",
    intro: "龙舌兰、青柠和橙香的锋利组合，明亮又有精神。",
    base: "tequila",
    tags: ["酸爽", "橙香", "经典"],
    strength: "medium",
    glass: "鸡尾酒杯",
    garnish: "盐边与青柠角",
    ingredients: [
      { ingredientId: "tequila", amount: "45 ml" },
      { ingredientId: "lime-juice", amount: "25 ml" },
      { ingredientId: "orange-liqueur", amount: "20 ml" },
      { ingredientId: "salt", amount: "少许", optional: true }
    ],
    steps: ["杯口抹青柠并沾半圈盐。", "龙舌兰、青柠汁、橙味利口酒加冰摇匀。", "滤入杯中，用青柠角装饰。"],
    tasteProfile: { sweet: 2, sour: 5, bitter: 1, fresh: 5, strong: 3, fruity: 2, herbal: 1, bubbly: 0 },
    bartenderTip: "盐边只沾半圈更稳，第一口能自己选择要不要盐感。"
  },
  {
    id: "mojito",
    name: "莫吉托",
    englishName: "Mojito",
    intro: "薄荷、青柠和气泡感，是最适合热天的轻松选择。",
    base: "white-rum",
    tags: ["薄荷", "清爽", "低负担"],
    strength: "light",
    glass: "高球杯",
    garnish: "薄荷枝与青柠角",
    ingredients: [
      { ingredientId: "white-rum", amount: "45 ml" },
      { ingredientId: "lime-juice", amount: "25 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" },
      { ingredientId: "mint", amount: "8 片" },
      { ingredientId: "soda-water", amount: "补满" }
    ],
    steps: ["薄荷和糖浆在杯中轻压出香气。", "加入朗姆、青柠汁和冰块。", "补苏打水，轻轻搅拌。"],
    tasteProfile: { sweet: 2, sour: 3, bitter: 1, fresh: 5, strong: 1, fruity: 1, herbal: 5, bubbly: 5 },
    bartenderTip: "薄荷只要轻压出香气，不要捣碎，否则会有草腥味。"
  },
  {
    id: "gin-tonic",
    name: "金汤力",
    englishName: "Gin & Tonic",
    intro: "最少材料换来干净利落的高级感，适合不想复杂的时候。",
    base: "gin",
    tags: ["简洁", "清冷", "气泡"],
    strength: "light",
    glass: "高球杯",
    garnish: "青柠角",
    ingredients: [
      { ingredientId: "gin", amount: "45 ml" },
      { ingredientId: "tonic-water", amount: "120 ml" },
      { ingredientId: "lime-juice", amount: "5 ml", optional: true }
    ],
    steps: ["杯中放满冰块。", "倒入金酒和汤力水。", "轻轻搅拌，挤入少量青柠。"],
    tasteProfile: { sweet: 1, sour: 2, bitter: 2, fresh: 5, strong: 1, fruity: 1, herbal: 3, bubbly: 5 },
    bartenderTip: "杯子和汤力水提前冰一下，清爽感会明显提升。"
  },
  {
    id: "old-fashioned",
    name: "古典鸡尾酒",
    englishName: "Old Fashioned",
    intro: "威士忌爱好者的仪式感，厚重、缓慢、耐喝。",
    base: "bourbon",
    tags: ["醇厚", "慢饮", "经典"],
    strength: "strong",
    glass: "古典杯",
    garnish: "橙皮",
    ingredients: [
      { ingredientId: "bourbon", amount: "60 ml" },
      { ingredientId: "sugar", amount: "1 块" },
      { ingredientId: "angostura-bitters", amount: "2 dash" }
    ],
    steps: ["方糖和苦精在杯中压散。", "加入威士忌和大冰块。", "缓慢搅拌至微微稀释，挤橙皮油。"],
    tasteProfile: { sweet: 2, sour: 0, bitter: 3, fresh: 1, strong: 5, fruity: 1, herbal: 1, bubbly: 0 },
    bartenderTip: "搅拌到杯壁变冷即可，不要过度稀释。"
  },
  {
    id: "negroni",
    name: "尼格罗尼",
    englishName: "Negroni",
    intro: "苦甜、草本、成熟，是一杯很有态度的经典。",
    base: "gin",
    tags: ["苦甜", "草本", "成熟"],
    strength: "strong",
    glass: "古典杯",
    garnish: "橙皮",
    ingredients: [
      { ingredientId: "gin", amount: "30 ml" },
      { ingredientId: "campari", amount: "30 ml" },
      { ingredientId: "sweet-vermouth", amount: "30 ml" }
    ],
    steps: ["所有材料加入装冰调酒杯。", "搅拌至冰冷。", "滤入古典杯，挤橙皮油。"],
    tasteProfile: { sweet: 2, sour: 0, bitter: 5, fresh: 1, strong: 4, fruity: 1, herbal: 4, bubbly: 0 },
    bartenderTip: "如果怕苦，可以先把金巴利用量减到 20 ml。"
  },
  {
    id: "daiquiri",
    name: "代基里",
    englishName: "Daiquiri",
    intro: "朗姆酸酒的标准答案，清爽、简洁、明快。",
    base: "white-rum",
    tags: ["酸甜", "朗姆", "清爽"],
    strength: "medium",
    glass: "鸡尾酒杯",
    garnish: "青柠角",
    ingredients: [
      { ingredientId: "white-rum", amount: "50 ml" },
      { ingredientId: "lime-juice", amount: "25 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "双重过滤进冰镇杯。", "用青柠角装饰。"],
    tasteProfile: { sweet: 2, sour: 5, bitter: 1, fresh: 4, strong: 2, fruity: 1, herbal: 1, bubbly: 0 },
    bartenderTip: "酸度是灵魂，青柠汁尽量现榨。"
  },
  {
    id: "cosmopolitan",
    name: "大都会",
    englishName: "Cosmopolitan",
    intro: "蔓越莓、青柠和橙香让伏特加变得明亮有层次。",
    base: "vodka",
    tags: ["果味", "酸甜", "漂亮"],
    strength: "medium",
    glass: "鸡尾酒杯",
    garnish: "橙皮",
    ingredients: [
      { ingredientId: "vodka", amount: "45 ml" },
      { ingredientId: "cranberry-juice", amount: "30 ml" },
      { ingredientId: "lime-juice", amount: "15 ml" },
      { ingredientId: "orange-liqueur", amount: "15 ml" }
    ],
    steps: ["所有材料加入摇壶。", "加冰摇至充分冰冷。", "滤入冰镇鸡尾酒杯。"],
    tasteProfile: { sweet: 3, sour: 3, bitter: 1, fresh: 3, strong: 2, fruity: 5, herbal: 1, bubbly: 0 },
    bartenderTip: "蔓越莓汁不要太甜，保留一点酸感会更干净。"
  },
  {
    id: "bloody-mary",
    name: "血腥玛丽",
    englishName: "Bloody Mary",
    intro: "番茄和香料感十足，像一杯带酒精的咸鲜早午餐。",
    base: "vodka",
    tags: ["咸鲜", "番茄", "低甜"],
    strength: "light",
    glass: "高球杯",
    garnish: "柠檬片",
    ingredients: [
      { ingredientId: "vodka", amount: "45 ml" },
      { ingredientId: "tomato-juice", amount: "120 ml" },
      { ingredientId: "lemon-juice", amount: "15 ml" },
      { ingredientId: "worcestershire", amount: "2 dash" },
      { ingredientId: "salt", amount: "少许" }
    ],
    steps: ["所有材料倒入杯中。", "加冰后上下滚动混合。", "按口味补盐和柠檬。"],
    tasteProfile: { sweet: 0, sour: 2, bitter: 2, fresh: 2, strong: 1, fruity: 2, herbal: 2, bubbly: 0 },
    bartenderTip: "先少放盐和伍斯特酱，最后按口味补。"
  },
  {
    id: "martini",
    name: "马天尼",
    englishName: "Martini",
    intro: "极简、冷冽、强烈，适合想要一杯干净利落的酒。",
    base: "gin",
    tags: ["极简", "冷冽", "烈"],
    strength: "strong",
    glass: "马天尼杯",
    garnish: "橄榄",
    ingredients: [
      { ingredientId: "gin", amount: "60 ml" },
      { ingredientId: "dry-vermouth", amount: "10 ml" },
      { ingredientId: "olive", amount: "1 颗", optional: true }
    ],
    steps: ["金酒和干味美思加冰搅拌。", "滤入冰镇马天尼杯。", "放入橄榄。"],
    tasteProfile: { sweet: 0, sour: 0, bitter: 1, fresh: 2, strong: 5, fruity: 0, herbal: 2, bubbly: 0 },
    bartenderTip: "先做湿一点的比例更适合新手，干味美思不要省到没有。"
  },
  {
    id: "tequila-sunrise",
    name: "龙舌兰日出",
    englishName: "Tequila Sunrise",
    intro: "橙汁和龙舌兰的轻松组合，颜色很有假日感。",
    base: "tequila",
    tags: ["果味", "明亮", "轻松"],
    strength: "light",
    glass: "高球杯",
    garnish: "橙片",
    ingredients: [
      { ingredientId: "tequila", amount: "45 ml" },
      { ingredientId: "orange-juice", amount: "120 ml" },
      { ingredientId: "simple-syrup", amount: "10 ml" }
    ],
    steps: ["杯中加冰，倒入龙舌兰和橙汁。", "轻轻搅拌。", "沿杯壁加入少量糖浆形成渐层。"],
    tasteProfile: { sweet: 4, sour: 1, bitter: 0, fresh: 3, strong: 1, fruity: 5, herbal: 0, bubbly: 0 },
    bartenderTip: "糖浆沿杯壁慢慢倒，颜色分层会更自然。"
  },
  {
    id: "whiskey-sour",
    name: "威士忌酸",
    englishName: "Whiskey Sour",
    intro: "酸甜托起威士忌的木质香，稳重但不难入口。",
    base: "bourbon",
    tags: ["酸甜", "醇厚", "经典"],
    strength: "medium",
    glass: "古典杯",
    garnish: "柠檬片和樱桃",
    ingredients: [
      { ingredientId: "bourbon", amount: "50 ml" },
      { ingredientId: "lemon-juice", amount: "25 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" },
      { ingredientId: "angostura-bitters", amount: "1 dash", optional: true }
    ],
    steps: ["威士忌、柠檬汁、糖浆加冰摇匀。", "滤入装冰古典杯。", "可加一滴苦精增加香气。"],
    tasteProfile: { sweet: 2, sour: 4, bitter: 1, fresh: 2, strong: 3, fruity: 1, herbal: 1, bubbly: 0 },
    bartenderTip: "如果想口感更绵密，可以后续再尝试蛋白版本。"
  },
  {
    id: "tommys-margarita",
    name: "汤米玛格丽特",
    englishName: "Tommy's Margarita",
    intro: "把橙酒换成龙舌兰糖浆，酸甜更柔和，龙舌兰本身更突出。",
    base: "tequila",
    tags: ["酸爽", "柔和", "龙舌兰"],
    strength: "medium",
    glass: "古典杯",
    garnish: "青柠片",
    ingredients: [
      { ingredientId: "tequila", amount: "60 ml" },
      { ingredientId: "lime-juice", amount: "30 ml" },
      { ingredientId: "agave-nectar", amount: "15 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入装冰的古典杯。", "用青柠片装饰。"],
    tasteProfile: { sweet: 2, sour: 5, bitter: 0, fresh: 4, strong: 3, fruity: 1, herbal: 1, bubbly: 0 },
    bartenderTip: "龙舌兰糖浆先少放，摇完尝一口再决定要不要补甜。"
  },
  {
    id: "john-collins",
    name: "约翰柯林斯",
    englishName: "John Collins",
    intro: "金酒、柠檬和苏打水组成的清爽长饮，像一杯更有骨架的柠檬汽水。",
    base: "gin",
    tags: ["清爽", "气泡", "长饮"],
    strength: "light",
    glass: "高球杯",
    garnish: "柠檬片与樱桃",
    ingredients: [
      { ingredientId: "gin", amount: "45 ml" },
      { ingredientId: "lemon-juice", amount: "30 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" },
      { ingredientId: "soda-water", amount: "60 ml" }
    ],
    steps: ["金酒、柠檬汁和糖浆倒入装冰高球杯。", "补苏打水。", "轻轻搅拌，用柠檬片和樱桃装饰。"],
    tasteProfile: { sweet: 2, sour: 4, bitter: 0, fresh: 5, strong: 1, fruity: 1, herbal: 1, bubbly: 5 },
    bartenderTip: "如果用 Old Tom Gin，就更接近 Tom Collins 的甜润感。"
  },
  {
    id: "moscow-mule",
    name: "莫斯科骡子",
    englishName: "Moscow Mule",
    intro: "伏特加、青柠和姜汁汽水，辛香、清爽、特别适合入门。",
    base: "vodka",
    tags: ["姜味", "清爽", "气泡"],
    strength: "light",
    glass: "铜杯",
    garnish: "青柠角",
    ingredients: [
      { ingredientId: "vodka", amount: "45 ml" },
      { ingredientId: "lime-juice", amount: "10 ml" },
      { ingredientId: "ginger-beer", amount: "120 ml" }
    ],
    steps: ["杯中加满冰。", "倒入伏特加和青柠汁。", "补姜汁汽水，轻轻搅拌。"],
    tasteProfile: { sweet: 2, sour: 2, bitter: 0, fresh: 4, strong: 1, fruity: 1, herbal: 2, bubbly: 5 },
    bartenderTip: "姜汁汽水决定性格，喜欢辛辣就选姜味更明显的。"
  },
  {
    id: "paloma",
    name: "帕洛玛",
    englishName: "Paloma",
    intro: "龙舌兰和葡萄柚的明亮长饮，比玛格丽特更轻松。",
    base: "tequila",
    tags: ["果味", "清爽", "微苦"],
    strength: "light",
    glass: "高球杯",
    garnish: "青柠角",
    ingredients: [
      { ingredientId: "tequila", amount: "50 ml" },
      { ingredientId: "lime-juice", amount: "10 ml" },
      { ingredientId: "grapefruit-juice", amount: "60 ml" },
      { ingredientId: "soda-water", amount: "60 ml" },
      { ingredientId: "salt", amount: "少许", optional: true }
    ],
    steps: ["杯口可轻沾盐。", "杯中加冰，倒入龙舌兰、青柠汁和葡萄柚汁。", "补苏打水，轻轻搅拌。"],
    tasteProfile: { sweet: 2, sour: 3, bitter: 2, fresh: 5, strong: 1, fruity: 4, herbal: 0, bubbly: 5 },
    bartenderTip: "葡萄柚汁偏苦时，多一点苏打水会让整体更轻盈。"
  },
  {
    id: "americano",
    name: "美式鸡尾酒",
    englishName: "Americano",
    intro: "金巴利、甜味美思和苏打水，低酒精但苦甜层次很清楚。",
    base: "campari",
    tags: ["苦甜", "餐前", "低度"],
    strength: "light",
    glass: "古典杯",
    garnish: "橙片",
    ingredients: [
      { ingredientId: "campari", amount: "30 ml" },
      { ingredientId: "sweet-vermouth", amount: "30 ml" },
      { ingredientId: "soda-water", amount: "适量" }
    ],
    steps: ["杯中加冰。", "倒入金巴利和甜味美思。", "补苏打水，轻轻搅拌。"],
    tasteProfile: { sweet: 2, sour: 0, bitter: 5, fresh: 3, strong: 1, fruity: 2, herbal: 3, bubbly: 5 },
    bartenderTip: "这是理解 Negroni 之前很好的低度入口。"
  },
  {
    id: "aperol-spritz",
    name: "阿佩罗思普瑞兹",
    englishName: "Aperol Spritz",
    intro: "橙色、气泡、轻微苦甜，是最有假日感的餐前酒之一。",
    base: "aperol",
    tags: ["气泡", "苦甜", "轻盈"],
    strength: "light",
    glass: "葡萄酒杯",
    garnish: "橙片",
    ingredients: [
      { ingredientId: "aperol", amount: "60 ml" },
      { ingredientId: "sparkling-wine", amount: "90 ml" },
      { ingredientId: "soda-water", amount: "30 ml" }
    ],
    steps: ["杯中加冰。", "倒入起泡酒、阿佩罗和苏打水。", "轻轻搅拌，用橙片装饰。"],
    tasteProfile: { sweet: 2, sour: 1, bitter: 3, fresh: 5, strong: 1, fruity: 3, herbal: 2, bubbly: 5 },
    bartenderTip: "先倒起泡酒再倒阿佩罗，颜色会更轻盈。"
  },
  {
    id: "french-75",
    name: "法兰西75",
    englishName: "French 75",
    intro: "金酒、柠檬和起泡酒，清亮但很有庆祝感。",
    base: "gin",
    tags: ["气泡", "酸爽", "庆祝"],
    strength: "medium",
    glass: "香槟杯",
    garnish: "柠檬皮",
    ingredients: [
      { ingredientId: "gin", amount: "30 ml" },
      { ingredientId: "lemon-juice", amount: "15 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" },
      { ingredientId: "sparkling-wine", amount: "60 ml" }
    ],
    steps: ["金酒、柠檬汁和糖浆加冰摇匀。", "滤入杯中。", "补起泡酒并轻轻提拉混合。"],
    tasteProfile: { sweet: 2, sour: 3, bitter: 0, fresh: 5, strong: 2, fruity: 2, herbal: 1, bubbly: 5 },
    bartenderTip: "起泡酒最后加，气泡和香气会保留得更好。"
  },
  {
    id: "bellini",
    name: "贝里尼",
    englishName: "Bellini",
    intro: "白桃和起泡酒，柔软、果味明显，是很友好的低度选择。",
    base: "sparkling-wine",
    tags: ["桃子", "气泡", "低度"],
    strength: "light",
    glass: "香槟杯",
    garnish: "无",
    ingredients: [
      { ingredientId: "peach-puree", amount: "50 ml" },
      { ingredientId: "sparkling-wine", amount: "100 ml" }
    ],
    steps: ["杯中加入冷藏白桃泥。", "缓慢倒入起泡酒。", "轻轻搅匀即可。"],
    tasteProfile: { sweet: 3, sour: 1, bitter: 0, fresh: 4, strong: 1, fruity: 5, herbal: 0, bubbly: 5 },
    bartenderTip: "白桃泥越细，口感越像酒吧里的柔滑版本。"
  },
  {
    id: "pina-colada",
    name: "椰林飘香",
    englishName: "Pina Colada",
    intro: "朗姆、菠萝和椰浆，热带感很强，甜润又有奶油感。",
    base: "white-rum",
    tags: ["热带", "椰香", "甜润"],
    strength: "light",
    glass: "飓风杯",
    garnish: "樱桃",
    ingredients: [
      { ingredientId: "white-rum", amount: "50 ml" },
      { ingredientId: "coconut-cream", amount: "30 ml" },
      { ingredientId: "pineapple-juice", amount: "50 ml" }
    ],
    steps: ["所有材料和冰块一起搅打。", "倒入大杯。", "用樱桃装饰。"],
    tasteProfile: { sweet: 4, sour: 1, bitter: 0, fresh: 2, strong: 1, fruity: 5, herbal: 0, bubbly: 0 },
    bartenderTip: "如果太甜，可以补几滴青柠汁让它更清爽。"
  },
  {
    id: "caipirinha",
    name: "凯匹林纳",
    englishName: "Caipirinha",
    intro: "卡沙萨、青柠和糖的巴西经典，简单直接但非常有生命力。",
    base: "cachaca",
    tags: ["青柠", "酸甜", "直接"],
    strength: "medium",
    glass: "古典杯",
    garnish: "青柠块",
    ingredients: [
      { ingredientId: "cachaca", amount: "60 ml" },
      { ingredientId: "lime-juice", amount: "25 ml" },
      { ingredientId: "sugar", amount: "2 茶匙" }
    ],
    steps: ["青柠和糖在杯中轻压。", "加入碎冰和卡沙萨。", "搅拌到杯壁微微结霜。"],
    tasteProfile: { sweet: 2, sour: 5, bitter: 1, fresh: 4, strong: 3, fruity: 2, herbal: 1, bubbly: 0 },
    bartenderTip: "青柠只要压出香气，不要把白瓤压到太苦。"
  },
  {
    id: "mai-tai",
    name: "迈泰",
    englishName: "Mai Tai",
    intro: "朗姆、青柠、橙香和杏仁糖浆，热带但不只是甜。",
    base: "white-rum",
    tags: ["热带", "坚果", "酸甜"],
    strength: "medium",
    glass: "古典杯",
    garnish: "薄荷与青柠",
    ingredients: [
      { ingredientId: "white-rum", amount: "30 ml" },
      { ingredientId: "dark-rum", amount: "30 ml" },
      { ingredientId: "lime-juice", amount: "25 ml" },
      { ingredientId: "orange-liqueur", amount: "15 ml" },
      { ingredientId: "orgeat", amount: "15 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入装碎冰的古典杯。", "用薄荷和青柠装饰。"],
    tasteProfile: { sweet: 3, sour: 4, bitter: 1, fresh: 3, strong: 3, fruity: 3, herbal: 1, bubbly: 0 },
    bartenderTip: "杏仁糖浆是灵魂，别用普通糖浆完全替代。"
  },
  {
    id: "espresso-martini",
    name: "浓缩马天尼",
    englishName: "Espresso Martini",
    intro: "伏特加、咖啡利口酒和浓缩咖啡，精神、丝滑、适合餐后。",
    base: "vodka",
    tags: ["咖啡", "餐后", "顺滑"],
    strength: "medium",
    glass: "鸡尾酒杯",
    garnish: "咖啡豆",
    ingredients: [
      { ingredientId: "vodka", amount: "50 ml" },
      { ingredientId: "coffee-liqueur", amount: "30 ml" },
      { ingredientId: "espresso", amount: "30 ml" },
      { ingredientId: "simple-syrup", amount: "10 ml", optional: true }
    ],
    steps: ["所有材料加冰用力摇匀。", "滤入冷却的杯中。", "用咖啡豆装饰。"],
    tasteProfile: { sweet: 2, sour: 0, bitter: 3, fresh: 1, strong: 3, fruity: 0, herbal: 0, bubbly: 0 },
    bartenderTip: "咖啡要冷却一下再摇，泡沫会更细。"
  },
  {
    id: "sidecar",
    name: "边车",
    englishName: "Sidecar",
    intro: "干邑、橙味利口酒和柠檬，经典酸酒结构里更温暖的一杯。",
    base: "cognac",
    tags: ["酸甜", "橙香", "温暖"],
    strength: "medium",
    glass: "鸡尾酒杯",
    garnish: "糖边",
    ingredients: [
      { ingredientId: "cognac", amount: "50 ml" },
      { ingredientId: "orange-liqueur", amount: "20 ml" },
      { ingredientId: "lemon-juice", amount: "20 ml" }
    ],
    steps: ["杯口可做一圈糖边。", "所有材料加冰摇匀。", "滤入杯中。"],
    tasteProfile: { sweet: 2, sour: 4, bitter: 1, fresh: 2, strong: 3, fruity: 2, herbal: 0, bubbly: 0 },
    bartenderTip: "如果觉得锋利，糖边能让入口柔和很多。"
  },
  {
    id: "manhattan",
    name: "曼哈顿",
    englishName: "Manhattan",
    intro: "威士忌和甜味美思构成的经典短饮，浓郁、成熟、带草本甜香。",
    base: "rye-whiskey",
    tags: ["浓郁", "草本", "经典"],
    strength: "strong",
    glass: "鸡尾酒杯",
    garnish: "樱桃",
    ingredients: [
      { ingredientId: "rye-whiskey", amount: "50 ml" },
      { ingredientId: "sweet-vermouth", amount: "20 ml" },
      { ingredientId: "angostura-bitters", amount: "1 dash" }
    ],
    steps: ["所有材料加冰搅拌至充分冷却。", "滤入冷却的杯中。", "用樱桃装饰。"],
    tasteProfile: { sweet: 2, sour: 0, bitter: 2, fresh: 0, strong: 5, fruity: 1, herbal: 3, bubbly: 0 },
    bartenderTip: "这是 spirit-forward 酒款，新手可以先做小杯。"
  },
  {
    id: "aviation",
    name: "飞行",
    englishName: "Aviation",
    intro: "金酒、柠檬、樱桃和紫罗兰，花香很轻，是漂亮但不甜腻的经典。",
    base: "gin",
    tags: ["花香", "酸爽", "优雅"],
    strength: "medium",
    glass: "鸡尾酒杯",
    garnish: "樱桃",
    ingredients: [
      { ingredientId: "gin", amount: "45 ml" },
      { ingredientId: "lemon-juice", amount: "15 ml" },
      { ingredientId: "maraschino-liqueur", amount: "15 ml" },
      { ingredientId: "creme-de-violette", amount: "5 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入冷却的杯中。", "用樱桃装饰。"],
    tasteProfile: { sweet: 2, sour: 3, bitter: 1, fresh: 3, strong: 3, fruity: 2, herbal: 2, bubbly: 0 },
    bartenderTip: "紫罗兰利口酒只要一点，太多会像香水。"
  },
  {
    id: "clover-club",
    name: "三叶草俱乐部",
    englishName: "Clover Club",
    intro: "金酒、覆盆子、柠檬和蛋白，粉色、柔滑，但酸度依然清楚。",
    base: "gin",
    tags: ["莓果", "柔滑", "酸甜"],
    strength: "medium",
    glass: "鸡尾酒杯",
    garnish: "无",
    ingredients: [
      { ingredientId: "gin", amount: "45 ml" },
      { ingredientId: "lemon-juice", amount: "15 ml" },
      { ingredientId: "raspberry-syrup", amount: "15 ml" },
      { ingredientId: "egg-white", amount: "15 ml" }
    ],
    steps: ["先不加冰干摇，让蛋白起泡。", "加冰再摇至充分冷却。", "滤入冷却的杯中。"],
    tasteProfile: { sweet: 3, sour: 4, bitter: 0, fresh: 3, strong: 2, fruity: 4, herbal: 1, bubbly: 0 },
    bartenderTip: "介意生蛋白的话，可以后续换成无蛋白版本。"
  },
  {
    id: "boulevardier",
    name: "林荫大道",
    englishName: "Boulevardier",
    intro: "像威士忌版尼格罗尼，苦甜更厚，木质感更明显。",
    base: "bourbon",
    tags: ["苦甜", "浓郁", "威士忌"],
    strength: "strong",
    glass: "古典杯",
    garnish: "橙皮",
    ingredients: [
      { ingredientId: "bourbon", amount: "45 ml" },
      { ingredientId: "campari", amount: "30 ml" },
      { ingredientId: "sweet-vermouth", amount: "30 ml" }
    ],
    steps: ["所有材料加冰搅拌。", "滤入装大冰块的古典杯。", "用橙皮表达香气。"],
    tasteProfile: { sweet: 2, sour: 0, bitter: 5, fresh: 0, strong: 5, fruity: 2, herbal: 3, bubbly: 0 },
    bartenderTip: "如果怕苦，先把金巴利减到 20 ml。"
  },
  {
    id: "black-russian",
    name: "黑俄罗斯",
    englishName: "Black Russian",
    intro: "伏特加和咖啡利口酒的极简组合，甜苦直接，适合餐后慢慢喝。",
    base: "vodka",
    tags: ["咖啡", "餐后", "简单"],
    strength: "strong",
    glass: "古典杯",
    garnish: "无",
    ingredients: [
      { ingredientId: "vodka", amount: "50 ml" },
      { ingredientId: "coffee-liqueur", amount: "20 ml" }
    ],
    steps: ["杯中加入大冰块。", "倒入伏特加和咖啡利口酒。", "轻轻搅拌即可。"],
    tasteProfile: { sweet: 3, sour: 0, bitter: 3, fresh: 0, strong: 4, fruity: 0, herbal: 0, bubbly: 0 },
    bartenderTip: "这杯很简单但酒精感直接，适合小口慢喝。"
  }
];
