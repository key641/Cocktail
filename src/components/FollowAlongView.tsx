import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import { getIngredientName } from "../data/ingredients";
import type { Cocktail } from "../domain/types";
import type { CSSProperties, ChangeEvent } from "react";
import { SecondaryHeader } from "./SecondaryHeader";
import { BartendingProcessVisual, type BartendingMotion, type BartendingVessel } from "./BartendingProcessVisual";
import { triggerHaptic } from "../utils/haptics";

type FollowAlongViewProps = {
  cocktail: Cocktail;
  activeStep: number;
  onBack: () => void;
  onStepChange: (step: number) => void;
  onPhotoSelected: (file: File) => void;
  isPhotoProcessing?: boolean;
  photoError?: string;
};

type StepMotion = BartendingMotion | "garnish";

type StepPresentation = {
  label: string;
  motion: StepMotion;
  status: string;
  vessel?: BartendingVessel;
};

const mixingGlassCocktails = new Set(["negroni", "martini", "manhattan", "boulevardier", "sazerac", "bloody-mary"]);

export function getStepPresentation(cocktail: Cocktail, step: string, index: number, stepCount: number): StepPresentation {
  if (/杯口|盐边|糖边|涮杯/.test(step)) return { label: "处理杯口", motion: "rim", status: "杯口准备" };
  if (/旁边倒一小杯|另配一小杯|佐饮/.test(step)) return { label: "准备佐饮", motion: "side-serve", status: "起泡酒单独佐饮" };
  if (/搅打|搅拌机|电动搅拌/.test(step)) return { label: "搅打顺滑", motion: "blend", status: "搅拌机搅打" };
  if (/捣|轻压|压散|压出/.test(step)) return { label: "轻捣出香", motion: "muddle", status: "轻压释放香气" };
  if (/干摇|不加冰.*摇/.test(step)) return { label: "先干摇起泡", motion: "dry-shake", status: "无冰干摇" };
  if (/摇匀|用力摇|摇至|再摇|加冰摇|摇 \d|摇\d/.test(step)) return { label: /再摇/.test(step) ? "加冰再摇" : "加冰摇匀", motion: "shake", status: "摇壶充分摇匀" };
  if (/双重过滤|双滤/.test(step)) return { label: "双重过滤", motion: "strain", status: "细滤入杯" };
  if (/滤入|过滤|滤进|滤/.test(step)) return { label: "过滤入杯", motion: "strain", status: "缓缓滤入" };
  if (/倒入杯中/.test(step) && cocktail.id === "bloody-mary") return { label: "转杯倒入", motion: "transfer", status: "从调酒杯倒入" };
  if (/沿杯壁|浮在|表面浮|顶层|形成渐层|淋入/.test(step)) return { label: "缓慢分层", motion: "layer", status: "沿杯壁分层" };
  if (/搅拌|搅匀|提拉混合/.test(step)) {
    const inMixingGlass = /调酒杯/.test(step) || mixingGlassCocktails.has(cocktail.id);
    return inMixingGlass
      ? { label: "加冰搅拌", motion: "stir", status: "调酒杯中搅拌", vessel: "mixing-glass" }
      : { label: "杯中轻搅", motion: "stir-in-glass", status: "杯中轻轻混合", vessel: "serving-glass" };
  }

  const garnishOnly = index === stepCount - 1 && /装饰|放上|放入|放薄荷|用.*皮|拧.*皮|滴.*苦精|表达香气/.test(step);
  if (garnishOnly) return { label: "完成装饰", motion: "garnish", status: "装饰落位" };

  if (/摇壶/.test(step)) return { label: "材料入摇壶", motion: "combine", status: "倒入摇壶", vessel: "shaker" };
  if (/调酒杯/.test(step)) return { label: "材料入调酒杯", motion: "combine", status: "倒入调酒杯", vessel: "mixing-glass" };
  if (/加入|倒入|加冰|补|放满冰|加满.*冰|先倒|再倒/.test(step)) return { label: /冰/.test(step) && !/倒入|加入|补/.test(step) ? "杯中加冰" : "杯中加入材料", motion: "build", status: "杯中直调", vessel: "serving-glass" };
  return { label: `第 ${index + 1} 步`, motion: "build", status: "按步骤完成", vessel: "serving-glass" };
}

function progressForStep(index: number, stepCount: number) {
  if (stepCount <= 1) {
    return 1;
  }

  return Math.min(1, 0.22 + (index / (stepCount - 1)) * 0.78);
}

export function FollowAlongView({
  cocktail,
  activeStep,
  onBack,
  onStepChange,
  onPhotoSelected,
  isPhotoProcessing = false,
  photoError = ""
}: FollowAlongViewProps) {
  const recipeStepCount = cocktail.steps.length;
  const stageCount = recipeStepCount + 1;
  const isComplete = activeStep >= stageCount;
  const currentStage = isComplete ? stageCount - 1 : Math.min(Math.max(activeStep, 0), stageCount - 1);
  const isPreparation = currentStage === 0;
  const recipeStepIndex = Math.max(0, currentStage - 1);
  const currentRecipeStep = cocktail.steps[recipeStepIndex];
  const currentPresentation: StepPresentation = isPreparation
    ? { label: "准备材料", motion: "prepare" as const, status: "器具就位" }
    : getStepPresentation(cocktail, currentRecipeStep, recipeStepIndex, recipeStepCount);
  const currentTitle = currentPresentation.label;
  const timelineStyle = { "--step-count": stageCount } as CSSProperties;
  const motion = currentPresentation.motion;
  const buildProgress = isComplete ? 1 : isPreparation ? 0.12 : progressForStep(recipeStepIndex, recipeStepCount);
  const visualSpec = getCocktailVisualSpec(cocktail.id);
  const stages = [
    { label: "准备材料", detail: "先确认材料和用量，准备好冰块与工具。" },
    ...cocktail.steps.map((step, index) => ({ label: getStepPresentation(cocktail, step, index, recipeStepCount).label, detail: step }))
  ];

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
    }
    event.target.value = "";
  }

  function selectStep(step: number) {
    triggerHaptic("selection");
    onStepChange(step);
  }

  function completeStep() {
    const completesDrink = currentStage === stageCount - 1;
    triggerHaptic(completesDrink ? "success" : "action");
    onStepChange(completesDrink ? stageCount : currentStage + 1);
  }

  return (
    <section className="screen follow-screen">
      <SecondaryHeader
        title={`跟着做 ${cocktail.englishName}`}
        description={isComplete ? "这杯已经完成，留下你的作品" : "只看眼前这一步，完成后再继续"}
        progress={isComplete ? "已完成" : `${currentStage + 1} / ${stageCount}`}
        backLabel="返回酒款详情"
        onBack={onBack}
      />

      <article className="follow-step-card follow-workspace">
        <div className="follow-step-timeline" style={timelineStyle}>
          {stages.map((stage, index) => (
            <button
              key={`${index}-${stage.label}`}
              className={`${index === currentStage && !isComplete ? "active" : ""} ${isComplete || index < currentStage ? "done" : ""}`.trim()}
              aria-current={index === currentStage && !isComplete ? "step" : undefined}
              aria-label={`第 ${index + 1} 步：${stage.label}`}
              onClick={() => selectStep(index)}
            >
              <span>{index + 1}</span>
              <em>{stage.label}</em>
            </button>
          ))}
        </div>

        {isComplete ? (
          <div className="follow-complete-panel">
            <CocktailVisual
              spec={visualSpec}
              title={cocktail.englishName}
              motion="finish"
              buildProgress={1}
            />
            <div>
              <span>调制完成</span>
              <h3>{cocktail.englishName}</h3>
              <p>最后用{cocktail.garnish}完成装饰，就可以享用了。</p>
            </div>
          </div>
        ) : (
          <>
            <div className="follow-step-main">
              <div className="follow-step-visual" data-motion={motion}>
                {motion === "garnish" ? (
                  <CocktailVisual
                    key={currentStage}
                    spec={visualSpec}
                    title={cocktail.englishName}
                    motion="garnish"
                    buildProgress={buildProgress}
                  />
                ) : (
                  <BartendingProcessVisual key={currentStage} motion={motion} vessel={currentPresentation.vessel} glassType={visualSpec.glassType} title={cocktail.englishName} />
                )}
                <span className="motion-status" aria-hidden="true">{currentPresentation.status}</span>
              </div>
              <div className="follow-step-copy">
                <span>第 {currentStage + 1} 步</span>
                <h3>{currentTitle}</h3>
                <p className="current-step-copy">{stages[currentStage].detail}</p>

                {isPreparation && (
                  <div className="step-material-list">
                    {cocktail.ingredients.map((ingredient) => (
                      <div key={ingredient.ingredientId}>
                        <span>{getIngredientName(ingredient.ingredientId)}</span>
                        <strong>{ingredient.amount}{ingredient.optional ? " · 可选" : ""}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {currentStage === stageCount - 1 && (
                  <div className="step-garnish">
                    <span>最后装饰</span>
                    <strong>{cocktail.garnish}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="step-actions">
              <button className="secondary-action" disabled={currentStage === 0} onClick={() => selectStep(currentStage - 1)}>
                上一步
              </button>
              <button className="primary-action" onClick={completeStep}>
                {currentStage === stageCount - 1 ? "完成调制" : "完成这一步"}
              </button>
            </div>
          </>
        )}
      </article>

      {isComplete && (
        <>
          <label className={`photo-upload-card ready ${isPhotoProcessing ? "processing" : ""}`} aria-busy={isPhotoProcessing}>
            <span>{isPhotoProcessing ? "正在准备照片" : "拍摄我的成品"}</span>
            <strong>{isPhotoProcessing ? "马上为你生成分享卡" : "上传照片，生成分享卡"}</strong>
            <input aria-label="上传调酒成品照片" type="file" accept="image/*" onChange={handlePhotoChange} disabled={isPhotoProcessing} />
          </label>
          {photoError && <div className="soft-warning photo-upload-error" role="alert">{photoError}</div>}
        </>
      )}

      <div className="insight-panel bartender-tip">
        <strong>小贴士</strong>
        <p>{cocktail.bartenderTip}</p>
      </div>
    </section>
  );
}
