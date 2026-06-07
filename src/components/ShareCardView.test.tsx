import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { ShareCardView } from "./ShareCardView";

describe("ShareCardView", () => {
  const mojito = cocktails.find((cocktail) => cocktail.id === "mojito");
  if (!mojito) throw new Error("missing fixture");

  it("renders the reference drink, uploaded photo, caption styles, and save action", () => {
    const markup = renderToStaticMarkup(
      <ShareCardView
        cocktail={mojito}
        photoUrl="blob:demo-photo"
        captionStyle="casual_share"
        onBack={() => undefined}
        onCaptionStyleChange={() => undefined}
        onRetake={() => undefined}
      />
    );

    expect(markup).toContain("生成分享卡");
    expect(markup).toContain("Mojito");
    expect(markup).toContain("blob:demo-photo");
    expect(markup).toContain("轻松分享");
    expect(markup).toContain("保存分享图");
  });
});
