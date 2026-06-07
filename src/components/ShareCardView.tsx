import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import { generateShareCaption, type CaptionStyle } from "../domain/captionGenerator";
import type { Cocktail } from "../domain/types";

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
  const caption = generateShareCaption({
    cocktail,
    style: captionStyle,
    occasion: "今晚",
    userLevel: "这次尝试"
  });

  return (
    <section className="screen share-screen">
      <button className="ghost-button icon-back" onClick={onBack}>←</button>

      <div className="section-heading centered">
        <h2>生成分享卡</h2>
        <p>选择喜欢的风格，分享你的调酒时刻</p>
      </div>

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

      <div className="caption-style-row">
        {(Object.keys(captionStyleLabels) as CaptionStyle[]).map((style) => (
          <button
            key={style}
            className={style === captionStyle ? "selected" : ""}
            onClick={() => onCaptionStyleChange(style)}
          >
            {captionStyleLabels[style]}
          </button>
        ))}
      </div>

      <button className="primary-action bottom-action" type="button">
        保存分享图
      </button>
      <button className="secondary-action compact-action" type="button" onClick={onRetake}>
        重新上传照片
      </button>
    </section>
  );
}
