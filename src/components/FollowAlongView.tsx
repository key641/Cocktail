import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import { getIngredientName } from "../data/ingredients";
import type { Cocktail } from "../domain/types";
import type { CSSProperties, ChangeEvent } from "react";

type FollowAlongViewProps = {
  cocktail: Cocktail;
  activeStep: number;
  onBack: () => void;
  onStepChange: (step: number) => void;
  onPhotoSelected: (file: File) => void;
};

function shortStepLabel(step: string, index: number, stepCount: number) {
  if (index === 0) {
    return "准备材料";
  }

  if (index === stepCount - 1 && /搅拌|轻轻|补|装饰|滤入/.test(step)) {
    return /搅拌|轻轻/.test(step) ? "轻轻搅拌" : "完成装饰";
  }

  if (/摇|摇匀/.test(step)) {
    return "摇匀";
  }

  if (/加入|倒入|加冰|补/.test(step)) {
    return "加入材料";
  }

  return `第 ${index + 1} 步`;
}

function motionForStep(step: string, index: number, stepCount: number): "prepare" | "add" | "stir" | "finish" {
  if (index === 0) {
    return "prepare";
  }

  if (index === stepCount - 1 && /装饰|完成|滤入/.test(step)) {
    return "finish";
  }

  if (/搅拌|轻轻|摇|摇匀|压/.test(step)) {
    return "stir";
  }

  return "add";
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
  onPhotoSelected
}: FollowAlongViewProps) {
  const stepCount = cocktail.steps.length;
  const currentStep = Math.min(Math.max(activeStep, 0), stepCount - 1);
  const timelineStyle = { "--step-count": stepCount } as CSSProperties;
  const motion = motionForStep(cocktail.steps[currentStep], currentStep, stepCount);
  const buildProgress = progressForStep(currentStep, stepCount);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
    }
  }

  return (
    <section className="screen follow-screen">
      <button className="ghost-button icon-back" onClick={onBack}>←</button>

      <div className="section-heading centered">
        <h2>跟着做，记录你的作品</h2>
        <p>一步步来，享受调酒的乐趣</p>
      </div>

      <article className="follow-reference-card">
        <CocktailVisual
          spec={getCocktailVisualSpec(cocktail.id)}
          title={cocktail.englishName}
          motion={motion}
          buildProgress={buildProgress}
        />
        <div>
          <span className="eyebrow">参考酒图</span>
          <h3>{cocktail.englishName}</h3>
          <p>{cocktail.garnish}</p>
        </div>
      </article>

      <div className="recipe-block compact-recipe">
        <span className="group-label">准备材料</span>
        {cocktail.ingredients.map((ingredient) => (
          <div className="recipe-line" key={ingredient.ingredientId}>
            <span>{getIngredientName(ingredient.ingredientId)}</span>
            <span>{ingredient.amount}{ingredient.optional ? " · 可选" : ""}</span>
          </div>
        ))}
      </div>

      <article className="follow-step-card">
        <div className="follow-step-timeline" style={timelineStyle}>
          {cocktail.steps.map((step, index) => (
            <button
              key={step}
              className={index === currentStep ? "active" : ""}
              aria-label={`第 ${index + 1} 步：${shortStepLabel(step, index, stepCount)}`}
              onClick={() => onStepChange(index)}
            >
              <span>{index + 1}</span>
              <em>{shortStepLabel(step, index, stepCount)}</em>
            </button>
          ))}
        </div>
        <p className="current-step-copy">{cocktail.steps[currentStep]}</p>
        <div className="step-actions">
          <button className="secondary-action" disabled={currentStep === 0} onClick={() => onStepChange(currentStep - 1)}>
            上一步
          </button>
          <button className="secondary-action" disabled={currentStep === stepCount - 1} onClick={() => onStepChange(currentStep + 1)}>
            下一步
          </button>
        </div>
      </article>

      <label className="photo-upload-card">
        <span>拍摄我的成品</span>
        <strong>上传照片</strong>
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
      </label>

      <div className="insight-panel bartender-tip">
        <strong>小贴士</strong>
        <p>{cocktail.bartenderTip}</p>
      </div>
    </section>
  );
}
