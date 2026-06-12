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
      { ingredientId: "grenadine", amount: "10 ml" }
    ],
    steps: ["杯中加冰，倒入龙舌兰和橙汁。", "轻轻搅拌。", "沿杯壁加入少量红石榴糖浆形成渐层。"],
    tasteProfile: { sweet: 4, sour: 1, bitter: 0, fresh: 3, strong: 1, fruity: 5, herbal: 0, bubbly: 0 },
    bartenderTip: "红石榴糖浆沿杯壁慢慢倒，颜色分层会更自然。"
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
  },

  {
    id: "white-lady",
    name: "白美人",
    englishName: "White Lady",
    intro: "柠檬清爽、橙酒圆润，是禁酒令时期风靡巴黎的经典酸酒。",
    base: "gin",
    tags: ["清爽", "酸甜", "优雅"],
    strength: "medium",
    glass: "coupe",
    garnish: "柠檬皮",
    ingredients: [
      { ingredientId: "gin", amount: "45 ml" },
      { ingredientId: "orange-liqueur", amount: "15 ml" },
      { ingredientId: "lemon-juice", amount: "25 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入冰镇过的鸡尾酒杯。", "拧一条柠檬皮增香。"],
    tasteProfile: { sweet: 3, sour: 5, bitter: 0, fresh: 5, strong: 3, fruity: 1, herbal: 0, bubbly: 0 },
    bartenderTip: "君度比普通 triple sec 更香，值得一试。"
  },
  {
    id: "hemingway-daiquiri",
    name: "海明威得其利",
    englishName: "Hemingway Daiquiri",
    intro: "海明威最爱的版本——加了葡萄柚和黑樱桃酒，比经典得其利多一层微苦。",
    base: "white-rum",
    tags: ["清爽", "酸甜", "微苦"],
    strength: "medium",
    glass: "coupe",
    garnish: "青柠片",
    ingredients: [
      { ingredientId: "white-rum", amount: "60 ml" },
      { ingredientId: "grapefruit-juice", amount: "30 ml" },
      { ingredientId: "lime-juice", amount: "15 ml" },
      { ingredientId: "maraschino-liqueur", amount: "10 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入冰镇的鸡尾酒杯。", "放上薄青柠片装饰。"],
    tasteProfile: { sweet: 3, sour: 4, bitter: 2, fresh: 5, strong: 3, fruity: 2, herbal: 0, bubbly: 0 },
    bartenderTip: "不要省掉黑樱桃酒——它是这杯区别于普通得其利的灵魂。"
  },
  {
    id: "mint-julep",
    name: "薄荷朱利普",
    englishName: "Mint Julep",
    intro: "肯塔基赛马会的指定饮料，薄荷的清凉层层渗透碎冰，极慢极优雅。",
    base: "bourbon",
    tags: ["清爽", "草本", "经典"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "薄荷枝",
    ingredients: [
      { ingredientId: "bourbon", amount: "60 ml" },
      { ingredientId: "mint", amount: "8-10 片叶" },
      { ingredientId: "sugar", amount: "1 茶匙" },
      { ingredientId: "soda-water", amount: "少许" }
    ],
    steps: ["杯底放薄荷叶和糖，加少许苏打水轻捣出味。", "加满碎冰。", "倒入波本，搅拌至杯壁结霜。", "放上一枝新鲜薄荷。"],
    tasteProfile: { sweet: 3, sour: 0, bitter: 1, fresh: 5, strong: 3, fruity: 0, herbal: 5, bubbly: 1 },
    bartenderTip: "薄荷只捣不碾烂，否则发苦——轻拍几下让香气出来就行。"
  },
  {
    id: "dark-n-stormy",
    name: "黑暗风暴",
    englishName: "Dark 'n Stormy",
    intro: "百慕大限定——黑朗姆浮在姜汁汽水上，像乌云压境，喝起来辛辣醒神。",
    base: "dark-rum",
    tags: ["辛辣", "气泡", "清爽"],
    strength: "medium",
    glass: "collins",
    garnish: "青柠角",
    ingredients: [
      { ingredientId: "dark-rum", amount: "60 ml" },
      { ingredientId: "ginger-beer", amount: "120 ml" },
      { ingredientId: "lime-juice", amount: "10 ml" }
    ],
    steps: ["杯中加满冰块。", "倒入姜汁汽水。", "沿杯壁缓缓倒入黑朗姆，让它浮在顶层。", "挤入青柠汁，放上青柠角。"],
    tasteProfile: { sweet: 3, sour: 1, bitter: 1, fresh: 4, strong: 3, fruity: 0, herbal: 0, bubbly: 4 },
    bartenderTip: "Gosling's 黑朗姆和自家姜汁啤酒是原教旨配方，但任意黑朗姆+好姜汁汽水都很好。"
  },
  {
    id: "jungle-bird",
    name: "丛林鸟",
    englishName: "Jungle Bird",
    intro: "70年代吉隆坡的发明，金巴利的苦与菠萝的甜冲撞出热带雨林般的层次。",
    base: "dark-rum",
    tags: ["热带", "微苦", "酸甜"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "菠萝角",
    ingredients: [
      { ingredientId: "dark-rum", amount: "45 ml" },
      { ingredientId: "campari", amount: "22 ml" },
      { ingredientId: "pineapple-juice", amount: "45 ml" },
      { ingredientId: "lime-juice", amount: "15 ml" },
      { ingredientId: "simple-syrup", amount: "10 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入装冰的古典杯。"],
    tasteProfile: { sweet: 4, sour: 3, bitter: 4, fresh: 4, strong: 3, fruity: 4, herbal: 0, bubbly: 0 },
    bartenderTip: "换成白朗姆会轻快很多，黑朗姆则更厚重——两种都好喝。"
  },
  {
    id: "bees-knees",
    name: "蜜蜂膝盖",
    englishName: "Bee's Knees",
    intro: "禁酒令时期的发明——蜂蜜的甜能完美掩盖劣质金酒的味道，反而成了经典。",
    base: "gin",
    tags: ["酸甜", "草本", "清爽"],
    strength: "medium",
    glass: "coupe",
    garnish: "柠檬皮",
    ingredients: [
      { ingredientId: "gin", amount: "60 ml" },
      { ingredientId: "lemon-juice", amount: "22 ml" },
      { ingredientId: "honey-syrup", amount: "22 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入冰镇鸡尾酒杯。", "拧柠檬皮增香。"],
    tasteProfile: { sweet: 4, sour: 4, bitter: 0, fresh: 4, strong: 3, fruity: 0, herbal: 2, bubbly: 0 },
    bartenderTip: "蜂蜜糖浆 = 蜂蜜:温水 = 3:1 搅匀。别用纯蜂蜜，摇不散。"
  },
  {
    id: "gold-rush",
    name: "淘金热",
    englishName: "Gold Rush",
    intro: "蜂蜜遇见波本——简单到只有三种材料，却暖甜柔滑、适合任何季节。",
    base: "bourbon",
    tags: ["酸甜", "温暖", "柔滑"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "无",
    ingredients: [
      { ingredientId: "bourbon", amount: "60 ml" },
      { ingredientId: "lemon-juice", amount: "22 ml" },
      { ingredientId: "honey-syrup", amount: "22 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入加大冰块的古典杯。"],
    tasteProfile: { sweet: 4, sour: 4, bitter: 0, fresh: 3, strong: 3, fruity: 0, herbal: 1, bubbly: 0 },
    bartenderTip: "和 Bee's Knees 互为双子——把金酒换波本就是 Gold Rush。"
  },
  {
    id: "bramble",
    name: "荆棘",
    englishName: "Bramble",
    intro: "80年代伦敦的发明，黑莓利口酒淋在碎冰上像荆棘蔓延，酸中带甜。",
    base: "gin",
    tags: ["酸甜", "果味", "清爽"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "柠檬片与黑莓",
    ingredients: [
      { ingredientId: "gin", amount: "45 ml" },
      { ingredientId: "lemon-juice", amount: "22 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" },
      { ingredientId: "creme-de-mure", amount: "15 ml" }
    ],
    steps: ["金酒、柠檬汁、糖浆加冰摇匀。", "滤入装满碎冰的古典杯。", "沿冰面淋入黑莓利口酒，让它慢慢渗透下去。"],
    tasteProfile: { sweet: 4, sour: 4, bitter: 0, fresh: 4, strong: 3, fruity: 3, herbal: 0, bubbly: 0 },
    bartenderTip: "关键在最后淋入的黑莓酒不要搅——留着纹路才好看。"
  },
  {
    id: "last-word",
    name: "遗言",
    englishName: "Last Word",
    intro: "禁酒令前的底特律遗珠——四种等量原料碰撞出草本、酸甜、微苦的完美平衡。",
    base: "gin",
    tags: ["草本", "复杂", "回味"],
    strength: "strong",
    glass: "coupe",
    garnish: "无",
    ingredients: [
      { ingredientId: "gin", amount: "22 ml" },
      { ingredientId: "green-chartreuse", amount: "22 ml" },
      { ingredientId: "maraschino-liqueur", amount: "22 ml" },
      { ingredientId: "lime-juice", amount: "22 ml" }
    ],
    steps: ["所有材料等量加入摇壶。", "加冰用力摇 12 秒。", "滤入冰镇鸡尾酒杯。"],
    tasteProfile: { sweet: 3, sour: 4, bitter: 3, fresh: 4, strong: 4, fruity: 1, herbal: 5, bubbly: 0 },
    bartenderTip: "等量的配方最容易记也最看材料品质，用好金酒和查特酒是灵魂。"
  },
  {
    id: "pisco-sour",
    name: "皮斯科酸",
    englishName: "Pisco Sour",
    intro: "秘鲁和智利的国饮——皮斯科白兰地加蛋白摇出云朵般的泡沫，酸中带暖。",
    base: "pisco",
    tags: ["酸甜", "绵密", "南美"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "苦精滴饰",
    ingredients: [
      { ingredientId: "pisco", amount: "60 ml" },
      { ingredientId: "lemon-juice", amount: "30 ml" },
      { ingredientId: "simple-syrup", amount: "20 ml" },
      { ingredientId: "egg-white", amount: "1 个蛋白" },
      { ingredientId: "angostura-bitters", amount: "3 dashes" }
    ],
    steps: ["所有材料先不加冰干摇 10 秒，让蛋白起泡。", "加冰再摇 10 秒。", "滤入冰镇古典杯。", "滴 3 滴苦精在泡沫上。"],
    tasteProfile: { sweet: 3, sour: 5, bitter: 1, fresh: 4, strong: 3, fruity: 1, herbal: 1, bubbly: 0 },
    bartenderTip: "干摇是起泡关键——先无冰摇出蛋白泡再加冰冷却，泡沫才够厚。"
  },
  {
    id: "penicillin",
    name: "盘尼西林",
    englishName: "Penicillin",
    intro: "21世纪现代经典——姜的辛辣、蜂蜜的温润、泥煤威士忌的烟熏层层递进。",
    base: "scotch",
    tags: ["辛辣", "烟熏", "温润"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "糖姜片",
    ingredients: [
      { ingredientId: "scotch", amount: "60 ml (混合)" },
      { ingredientId: "lemon-juice", amount: "22 ml" },
      { ingredientId: "honey-syrup", amount: "22 ml" },
      { ingredientId: "ginger-root", amount: "2-3 片" },
      { ingredientId: "scotch", amount: "7.5 ml (Islay float)" }
    ],
    steps: ["调制姜汁：鲜姜榨汁过滤，与蜂蜜糖浆 1:1 混合。", "混合苏格兰威士忌、柠檬汁、姜蜜糖浆，加冰摇匀。", "滤入装冰的古典杯。", "表面浮一小勺泥煤威士忌增烟熏感。"],
    tasteProfile: { sweet: 3, sour: 3, bitter: 1, fresh: 3, strong: 3, fruity: 0, herbal: 2, bubbly: 0 },
    bartenderTip: "用普通 blended scotch 做基底，最后浮一层 Islay 单麦泥煤威士忌——烟熏味只闻不喝。"
  },
  {
    id: "sazerac",
    name: "萨兹拉克",
    englishName: "Sazerac",
    intro: "新奥尔良的骄傲，据说是美国最古老的鸡尾酒——苦艾的茴香、黑麦的辛辣、苦精的药感浑然一体。",
    base: "rye-whiskey",
    tags: ["辛辣", "药草", "浓烈"],
    strength: "strong",
    glass: "old_fashioned",
    garnish: "柠檬皮",
    ingredients: [
      { ingredientId: "rye-whiskey", amount: "60 ml" },
      { ingredientId: "absinthe", amount: "少许涮杯" },
      { ingredientId: "sugar", amount: "1 方糖" },
      { ingredientId: "peychauds-bitters", amount: "3 dashes" }
    ],
    steps: ["冰镇古典杯，倒入少许苦艾酒涮杯后倒掉（留香）。", "另取调酒杯，方糖加苦精和水捣化。", "加黑麦威士忌和冰搅拌 30 秒。", "滤入带苦艾香的杯中，拧柠檬皮增香后丢弃。"],
    tasteProfile: { sweet: 2, sour: 0, bitter: 4, fresh: 1, strong: 5, fruity: 0, herbal: 4, bubbly: 0 },
    bartenderTip: "柠檬皮只拧香不入杯——取其精油不取其酸，是这杯的关键仪式。"
  },

  {
    id: "pornstar-martini",
    name: "百香果马天尼",
    englishName: "Pornstar Martini",
    intro: "英国国民级派对酒——百香果的酸甜撞上香草的温润，旁边配一小杯起泡酒是仪式感。",
    base: "vodka",
    tags: ["酸甜", "果味", "派对"],
    strength: "medium",
    glass: "coupe",
    garnish: "半颗百香果",
    ingredients: [
      { ingredientId: "vanilla-vodka", amount: "45 ml" },
      { ingredientId: "passion-fruit-liqueur", amount: "15 ml" },
      { ingredientId: "passion-fruit-puree", amount: "30 ml" },
      { ingredientId: "lime-juice", amount: "15 ml" },
      { ingredientId: "sparkling-wine", amount: "60 ml (side)" }
    ],
    steps: ["伏特加、百香果泥、香草糖浆、青柠汁加冰摇匀。", "滤入冰镇鸡尾酒杯，放半颗百香果。", "旁边倒一小杯冰镇起泡酒，喝一口酒、抿一口起泡。"],
    tasteProfile: { sweet: 5, sour: 4, bitter: 0, fresh: 4, strong: 3, fruity: 5, herbal: 0, bubbly: 1 },
    bartenderTip: "百香果选皱皮的更甜，用新鲜挖出来的果肉比糖浆好太多。"
  },
  {
    id: "amaretto-sour",
    name: "杏仁酸",
    englishName: "Amaretto Sour",
    intro: "杏仁甜与波本烈的完美联姻，加蛋白摇出丝绸泡沫，喝起来像液体杏仁饼干。",
    base: "amaretto",
    tags: ["酸甜", "绵密", "坚果"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "柠檬皮 + 樱桃",
    ingredients: [
      { ingredientId: "amaretto", amount: "45 ml" },
      { ingredientId: "bourbon", amount: "22 ml" },
      { ingredientId: "lemon-juice", amount: "30 ml" },
      { ingredientId: "simple-syrup", amount: "10 ml" },
      { ingredientId: "egg-white", amount: "1 个蛋白" }
    ],
    steps: ["所有材料干摇 10 秒起泡。", "加冰再摇 10 秒。", "滤入装冰的古典杯，拧柠檬皮、放樱桃。"],
    tasteProfile: { sweet: 4, sour: 4, bitter: 1, fresh: 3, strong: 3, fruity: 2, herbal: 0, bubbly: 0 },
    bartenderTip: "加一点波本是关键——纯杏仁利口酒太甜，波本给骨头。"
  },
  {
    id: "gin-basil-smash",
    name: "金酒罗勒碎",
    englishName: "Gin Basil Smash",
    intro: "德国调酒师 Jörg Meyer 2008 年的发明——罗勒的草本清新让金酒酸变得像在花园里呼吸。",
    base: "gin",
    tags: ["草本", "清爽", "酸甜"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "罗勒叶",
    ingredients: [
      { ingredientId: "gin", amount: "60 ml" },
      { ingredientId: "lemon-juice", amount: "22 ml" },
      { ingredientId: "simple-syrup", amount: "15 ml" },
      { ingredientId: "basil", amount: "8-10 片叶" }
    ],
    steps: ["罗勒叶和糖浆在摇壶里轻捣出香。", "加金酒、柠檬汁、冰块用力摇 12 秒。", "双重过滤入冰镇古典杯，放一片罗勒叶。"],
    tasteProfile: { sweet: 3, sour: 4, bitter: 0, fresh: 5, strong: 3, fruity: 1, herbal: 5, bubbly: 0 },
    bartenderTip: "罗勒只轻拍不碾碎，否则发苦。大叶甜罗勒比泰国罗勒更适合。"
  },
  {
    id: "naked-and-famous",
    name: "赤裸与名扬",
    englishName: "Naked and Famous",
    intro: "Joaquín Simó 以此致敬 Last Word——梅斯卡尔的烟熏、阿佩罗的苦甜、查特酒的草本，四等分碰撞。",
    base: "mezcal",
    tags: ["烟熏", "复杂", "微苦"],
    strength: "strong",
    glass: "coupe",
    garnish: "无",
    ingredients: [
      { ingredientId: "mezcal", amount: "22 ml" },
      { ingredientId: "aperol", amount: "22 ml" },
      { ingredientId: "yellow-chartreuse", amount: "22 ml" },
      { ingredientId: "lime-juice", amount: "22 ml" }
    ],
    steps: ["四等分所有材料加入摇壶。", "加冰摇 12 秒。", "滤入冰镇鸡尾酒杯。"],
    tasteProfile: { sweet: 3, sour: 4, bitter: 4, fresh: 4, strong: 4, fruity: 1, herbal: 4, bubbly: 0 },
    bartenderTip: "梅斯卡尔选年轻清爽型（joven），烟熏太重会压倒其他味道。"
  },
  {
    id: "ranch-water",
    name: "牧场水",
    englishName: "Ranch Water",
    intro: "西得克萨斯的极简主义——龙舌兰、青柠、气泡水，三种材料无需摇壶，却比 Margarita 更解渴。",
    base: "tequila",
    tags: ["极简", "清爽", "气泡"],
    strength: "light",
    glass: "collins",
    garnish: "青柠角",
    ingredients: [
      { ingredientId: "tequila", amount: "45 ml" },
      { ingredientId: "lime-juice", amount: "30 ml" },
      { ingredientId: "soda-water", amount: "倒满" }
    ],
    steps: ["杯口抹青柠、沾盐边（可选）。", "加满冰块。", "倒入龙舌兰和青柠汁，用冰气泡水补满。", "轻轻提拉搅拌，放青柠角。"],
    tasteProfile: { sweet: 1, sour: 4, bitter: 0, fresh: 5, strong: 2, fruity: 0, herbal: 0, bubbly: 4 },
    bartenderTip: "Topo Chico 是原教旨气泡水——气泡更细更持久。但任意气泡水都可以。"
  },
  {
    id: "hugo-spritz",
    name: "雨果气泡",
    englishName: "Hugo Spritz",
    intro: "南蒂罗尔的夏日名片——接骨木花的淡雅花香遇上薄荷的清凉，比 Aperol Spritz 更温柔。",
    base: "elderflower-liqueur",
    tags: ["花香", "气泡", "清爽"],
    strength: "light",
    glass: "wine",
    garnish: "薄荷枝 + 青柠片",
    ingredients: [
      { ingredientId: "elderflower-liqueur", amount: "45 ml" },
      { ingredientId: "sparkling-wine", amount: "90 ml" },
      { ingredientId: "soda-water", amount: "30 ml" },
      { ingredientId: "mint", amount: "4-5 片叶" }
    ],
    steps: ["大酒杯加满冰块。", "倒入接骨木花利口酒。", "加起泡酒和苏打水，轻轻搅拌。", "放薄荷叶和青柠片。"],
    tasteProfile: { sweet: 4, sour: 1, bitter: 0, fresh: 5, strong: 1, fruity: 2, herbal: 3, bubbly: 4 },
    bartenderTip: "St-Germain 是接骨木花的标杆品牌，但超市自有品牌也够用。"
  },
  {
    id: "spicy-margarita",
    name: "辣味玛格丽特",
    englishName: "Spicy Margarita",
    intro: "龙舌兰和辣椒是天生一对——青柠的酸、龙舌兰的植物感、辣椒的灼烧层层递进。",
    base: "tequila",
    tags: ["辛辣", "酸甜", "大胆"],
    strength: "medium",
    glass: "old_fashioned",
    garnish: "辣椒圈 + 盐边",
    ingredients: [
      { ingredientId: "tequila", amount: "50 ml" },
      { ingredientId: "lime-juice", amount: "25 ml" },
      { ingredientId: "agave-nectar", amount: "15 ml" },
      { ingredientId: "jalapeno", amount: "2-3 片" }
    ],
    steps: ["杯口用青柠抹湿、沾盐边。", "辣椒片和龙舌兰糖浆在摇壶里轻捣。", "加龙舌兰、青柠汁和冰摇匀。", "滤入装冰的杯中，放辣椒圈。"],
    tasteProfile: { sweet: 3, sour: 5, bitter: 1, fresh: 4, strong: 3, fruity: 1, herbal: 2, bubbly: 0 },
    bartenderTip: "怕太辣就去掉辣椒籽——辣味来自白色的胎座，去籽后只剩椒香不烧喉。"
  },
  {
    id: "kentucky-mule",
    name: "肯塔基骡子",
    englishName: "Kentucky Mule",
    intro: "Moscow Mule 的南方表亲——波本的焦糖甜代替伏特加的冷淡，和姜的辛辣是天作之合。",
    base: "bourbon",
    tags: ["辛辣", "气泡", "清爽"],
    strength: "medium",
    glass: "mule_mug",
    garnish: "青柠角 + 薄荷",
    ingredients: [
      { ingredientId: "bourbon", amount: "60 ml" },
      { ingredientId: "lime-juice", amount: "15 ml" },
      { ingredientId: "ginger-beer", amount: "120 ml" }
    ],
    steps: ["铜杯或高杯中加满冰块。", "倒入波本和青柠汁。", "姜汁汽水补满，轻轻搅拌。", "青柠角和薄荷枝装饰。"],
    tasteProfile: { sweet: 3, sour: 2, bitter: 1, fresh: 4, strong: 3, fruity: 0, herbal: 1, bubbly: 4 },
    bartenderTip: "铜杯不是必须但确实保冷更好——冰镇的杯子本身就很加分。"
  },
  {
    id: "limoncello-spritz",
    name: "柠檬酒气泡",
    englishName: "Limoncello Spritz",
    intro: "意大利阿马尔菲海岸的假日味道——柠檬酒的明亮甜酸遇上起泡酒的气泡，三分钟搞定。",
    base: "limoncello",
    tags: ["清爽", "甜酸", "气泡"],
    strength: "light",
    glass: "wine",
    garnish: "柠檬片 + 薄荷",
    ingredients: [
      { ingredientId: "limoncello", amount: "60 ml" },
      { ingredientId: "sparkling-wine", amount: "90 ml" },
      { ingredientId: "soda-water", amount: "30 ml" }
    ],
    steps: ["大酒杯加满冰。", "倒入柠檬酒，加起泡酒和苏打水。", "轻轻搅拌，柠檬片和薄荷装饰。"],
    tasteProfile: { sweet: 4, sour: 3, bitter: 0, fresh: 5, strong: 1, fruity: 3, herbal: 1, bubbly: 4 },
    bartenderTip: "自制柠檬酒 = 柠檬皮泡烈酒一周 + 糖水。但超市买的也很不错。"
  },
  {
    id: "dirty-shirley",
    name: "脏雪莉",
    englishName: "Dirty Shirley",
    intro: "童年雪莉甜的成人版——往里面灌伏特加，再加一颗酒渍樱桃，TikTok 让它又火了。",
    base: "vodka",
    tags: ["甜美", "气泡", "复古"],
    strength: "light",
    glass: "collins",
    garnish: "酒渍樱桃",
    ingredients: [
      { ingredientId: "vodka", amount: "45 ml" },
      { ingredientId: "grenadine", amount: "15 ml" },
      { ingredientId: "soda-water", amount: "倒满" },
      { ingredientId: "lemon-juice", amount: "少许" }
    ],
    steps: ["杯中加满冰。", "先倒石榴糖浆，再倒伏特加。", "气泡水补满，挤一点柠檬汁。", "放上一颗酒渍樱桃。"],
    tasteProfile: { sweet: 5, sour: 2, bitter: 0, fresh: 4, strong: 2, fruity: 3, herbal: 0, bubbly: 4 },
    bartenderTip: "真正的 maraschino 樱桃（不是那种鲜红塑料感的）能让这杯上两个档次。"
  },
  {
    id: "mezcal-mule",
    name: "梅斯卡尔骡子",
    englishName: "Mezcal Mule",
    intro: "莫斯科骡子的烟熏版——梅斯卡尔的篝火气息和姜的辛辣共舞，比伏特加版多一重灵魂。",
    base: "mezcal",
    tags: ["烟熏", "辛辣", "气泡"],
    strength: "medium",
    glass: "mule_mug",
    garnish: "青柠角",
    ingredients: [
      { ingredientId: "mezcal", amount: "60 ml" },
      { ingredientId: "lime-juice", amount: "15 ml" },
      { ingredientId: "ginger-beer", amount: "120 ml" }
    ],
    steps: ["铜杯加满冰。", "倒入梅斯卡尔和青柠汁。", "姜汁汽水补满，轻轻搅拌。", "青柠角装饰。"],
    tasteProfile: { sweet: 2, sour: 2, bitter: 1, fresh: 4, strong: 3, fruity: 0, herbal: 2, bubbly: 4 },
    bartenderTip: "梅斯卡尔选年轻款（joven）即可，太陈年的烟熏感会盖过姜味。"
  },
  {
    id: "french-martini",
    name: "法式马天尼",
    englishName: "French Martini",
    intro: "80 年代的纽约经典——覆盆子的粉红酸甜混入菠萝的绵密，是马天尼家族里最讨喜的一杯。",
    base: "vodka",
    tags: ["果味", "绵密", "派对"],
    strength: "medium",
    glass: "coupe",
    garnish: "柠檬皮",
    ingredients: [
      { ingredientId: "vodka", amount: "45 ml" },
      { ingredientId: "raspberry-syrup", amount: "15 ml" },
      { ingredientId: "pineapple-juice", amount: "45 ml" }
    ],
    steps: ["所有材料加冰摇匀。", "滤入冰镇鸡尾酒杯。", "拧一条柠檬皮增香。"],
    tasteProfile: { sweet: 4, sour: 2, bitter: 0, fresh: 3, strong: 3, fruity: 5, herbal: 0, bubbly: 0 },
    bartenderTip: "原名和法国没什么关系，只是用了法国的覆盆子利口酒 Chambord——用糖浆代替也成立。"
  }

];
