import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { FollowAlongView } from "./FollowAlongView";

describe("FollowAlongView", () => {
  const mojito = cocktails.find((cocktail) => cocktail.id === "mojito");
  if (!mojito) throw new Error("missing fixture");

  it("renders the selected cocktail, step progress, ingredients, and photo entry", () => {
    const markup = renderToStaticMarkup(
      <FollowAlongView
        cocktail={mojito}
        activeStep={0}
        onBack={() => undefined}
        onStepChange={() => undefined}
        onPhotoSelected={() => undefined}
      />
    );

    expect(markup).toContain("跟着做");
    expect(markup).toContain("Mojito");
    expect(markup).toContain("薄荷枝与青柠角");
    expect(markup).toContain("follow-step-timeline");
    expect(markup).toContain("准备材料");
    expect(markup).toContain("加入材料");
    expect(markup).toContain("轻轻搅拌");
    expect(markup).toContain("cocktail-motion-prepare");
    expect(markup).toContain("拍摄我的成品");
  });
});
