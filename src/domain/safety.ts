export type AlcoholRiskFlag = "minor" | "driving" | "pregnancy" | "medication" | "allergy" | "unwell";

export type AlcoholSafetyResult = {
  shouldAvoidAlcohol: boolean;
  riskFlags: AlcoholRiskFlag[];
  message: string;
};

const riskMatchers: Array<[AlcoholRiskFlag, RegExp]> = [
  ["minor", /未成年|不到\s*18|不到\s*二十?一|高中|初中/],
  ["driving", /开车|驾驶|代驾|酒驾|骑车/],
  ["pregnancy", /怀孕|孕期|备孕|哺乳/],
  ["medication", /吃了?.{0,8}(药|药片|片剂|胶囊)|服药|服用.{0,8}(药|药物)|用药|药物|安眠|镇静|抗抑郁|抗焦虑|止痛药|抗过敏药|抗生素|头孢/],
  ["allergy", /过敏|酒精不耐受/],
  ["unwell", /不舒服|身体不适|头晕|发烧|胃痛/]
];

export function checkAlcoholSafety(input: string): AlcoholSafetyResult {
  const riskFlags = riskMatchers
    .filter(([, matcher]) => matcher.test(input))
    .map(([flag]) => flag);

  if (riskFlags.length === 0) {
    return {
      shouldAvoidAlcohol: false,
      riskFlags,
      message: ""
    };
  }

  return {
    shouldAvoidAlcohol: true,
    riskFlags,
    message: "当前情况建议避免饮酒，可以改做无酒精鸡尾酒或气泡饮方向。"
  };
}
