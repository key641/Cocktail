import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import { getIngredientName } from "../data/ingredients";
import type { Cocktail } from "../domain/types";
import type { CSSProperties, ChangeEvent } from "react";
import { SecondaryHeader } from "./SecondaryHeader";
import { BartendingProcessVisual, type BartendingMotion } from "./BartendingProcessVisual";
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

function shortStepLabel(step: string, index: number, stepCount: number) {
  if (index === stepCount - 1 && /装饰|完成/.test(step)) {
    return "完成装饰";
  }

  if (/轻压|压出|捣压/.test(step)) {
    return "轻压出香";
  }

  if (/摇|摇匀/.test(step)) {
    return "摇匀";
  }

  if (/滤入|过滤|双重过滤|滤/.test(step)) {
    return "滤入杯中";
  }

  if (/搅拌|轻轻/.test(step)) {
    return "轻轻搅拌";
  }

  if (/加入|倒入|加冰|补/.test(step)) {
    return "加入材料";
  }

  return `第 ${index + 1} 步`;
}

type StepMotion = BartendingMotion | "garnish";

function motionForStep(step: string, index: number, stepCount: number): StepMotion {
  if (index === 0) {
    if (/摇|摇匀/.test(step)) return "shake";
  }

  if (index === stepCount - 1 && /装饰|完成/.test(step)) {
    return "garnish";
  }

  if (/摇|摇匀/.test(step)) {
    return "shake";
  }

  if (/滤入|过滤|双重过滤|滤/.test(step)) {
    return "strain";
  }

  if (/搅拌|轻轻|压/.test(step)) {
    return "stir";
  }

  return "add";
}

const motionLabels: Record<StepMotion, string> = {
  prepare: "器具就位",
  add: "倒入酒液",
  stir: "轻轻搅拌",
  shake: "充分摇匀",
  strain: "缓缓滤入",
  garnish: "装饰落位"
};

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
  const currentTitle = isPreparation ? "准备材料" : shortStepLabel(currentRecipeStep, recipeStepIndex, recipeStepCount);
  const timelineStyle = { "--step-count": stageCount } as CSSProperties;
  const motion = isPreparation ? "prepare" : motionForStep(currentRecipeStep, recipeStepIndex, recipeStepCount);
  const buildProgress = isComplete ? 1 : isPreparation ? 0.12 : progressForStep(recipeStepIndex, recipeStepCount);
  const visualSpec = getCocktailVisualSpec(cocktail.id);
  const stages = [
    { label: "准备材料", detail: "先确认材料和用量，准备好冰块与工具。" },
    ...cocktail.steps.map((step, index) => ({ label: shortStepLabel(step, index, recipeStepCount), detail: step }))
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
                  <BartendingProcessVisual key={currentStage} motion={motion} glassType={visualSpec.glassType} title={cocktail.englishName} />
                )}
                <span className="motion-status" aria-hidden="true">{motionLabels[motion]}</span>
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
