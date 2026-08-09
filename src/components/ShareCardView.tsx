import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import { generateShareCaption, type CaptionStyle } from "../domain/captionGenerator";
import type { Cocktail } from "../domain/types";
import { useState } from "react";
import { SecondaryHeader } from "./SecondaryHeader";
import { triggerHaptic } from "../utils/haptics";

type ShareCardViewProps = {
  cocktail: Cocktail;
  photoUrl: string;
  captionStyle: CaptionStyle;
  onBack: () => void;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  onRetake: () => void;
};

const captionStyleLabels: Record<CaptionStyle, string> = {
  casual_share: "轻松分享",
  achievement: "成就打卡",
  professional_note: "专业点评",
  lyric_mood: "歌词氛围"
};

export function ShareCardView({
  cocktail,
  photoUrl,
  captionStyle,
  onBack,
  onCaptionStyleChange,
  onRetake
}: ShareCardViewProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const caption = generateShareCaption({
    cocktail,
    style: captionStyle,
    occasion: "今晚",
    userLevel: "这次尝试"
  });

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(`${caption.captionFull}\n\n${caption.shareTags.join(" ")}`);
      triggerHaptic("success");
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <section className="screen share-screen">
      <SecondaryHeader
        title="生成分享卡"
        description="选一种语气，再复制成品文案"
        backLabel="返回跟做步骤"
        onBack={onBack}
      />

      <article className="share-card-preview">
        <span className="eyebrow">今晚我完成了</span>
        <h3>{cocktail.englishName} <small>{cocktail.name}</small></h3>
        <div className="share-compare">
          <div className="share-reference">
            <CocktailVisual spec={getCocktailVisualSpec(cocktail.id)} title={cocktail.englishName} />
            <span>参考</span>
          </div>
          <div className="share-photo">
            {photoUrl ? <img src={photoUrl} alt={`${cocktail.name} 成品`} /> : <span>我的成品</span>}
          </div>
        </div>
        <div className="tag-row">
          {caption.shareTags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <blockquote>{caption.captionFull}</blockquote>
      </article>

      <div className="caption-style-control">
        <div className="content-section-head"><strong>文案语气</strong><span>立即预览</span></div>
        <div className="caption-style-row">
          {(Object.keys(captionStyleLabels) as CaptionStyle[]).map((style) => (
            <button
              key={style}
              className={style === captionStyle ? "selected" : ""}
              aria-pressed={style === captionStyle}
              onClick={() => { triggerHaptic("selection"); onCaptionStyleChange(style); }}
            >
              {captionStyleLabels[style]}
            </button>
          ))}
        </div>
      </div>

      <div className="share-secondary-actions">
        <button className="secondary-action compact-action" type="button" disabled aria-describedby="share-save-note">保存分享图</button>
        <button className="secondary-action compact-action" type="button" onClick={() => { triggerHaptic("selection"); onRetake(); }}>重新上传照片</button>
        <small className="share-save-note" id="share-save-note">图片保存还在完善，当前可先复制文案。</small>
      </div>
      <div className="secondary-action-dock">
        <button className="primary-action" type="button" onClick={() => void copyCaption()}>
          {copyState === "copied" ? "文案已复制" : copyState === "error" ? "复制失败，请重试" : "复制分享文案"}
        </button>
      </div>
    </section>
  );
}
