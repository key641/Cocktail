import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { FollowAlongView } from "./FollowAlongView";

describe("FollowAlongView", () => {
  const mojito = cocktails.find((cocktail) => cocktail.id === "mojito");
  if (!mojito) throw new Error("missing fixture");

  it("renders the selected cocktail, step progress, and complete ingredient list", () => {
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
    expect(markup).toContain("follow-step-timeline");
    expect(markup).toContain("准备材料");
    expect(markup).toContain("加入材料");
    expect(markup).toContain("轻轻搅拌");
    expect(markup).toContain("process-prepare");
    expect(markup).toContain("process-shaker");
    expect(markup).toContain("白朗姆");
    expect(markup).not.toContain("拍摄我的成品");
  });

  it("shows the photo entry only after all steps are complete", () => {
    const markup = renderToStaticMarkup(
      <FollowAlongView
        cocktail={mojito}
        activeStep={mojito.steps.length + 1}
        onBack={() => undefined}
        onStepChange={() => undefined}
        onPhotoSelected={() => undefined}
      />
    );

    expect(markup).toContain("调制完成");
    expect(markup).toContain("薄荷枝与青柠角");
    expect(markup).toContain("拍摄我的成品");
    expect(markup).toContain("上传照片，生成分享卡");
  });

  it("maps the active recipe step to a matching process animation", () => {
    const markup = renderToStaticMarkup(
      <FollowAlongView
        cocktail={mojito}
        activeStep={2}
        onBack={() => undefined}
        onStepChange={() => undefined}
        onPhotoSelected={() => undefined}
      />
    );

    expect(markup).toContain("data-motion=\"add\"");
    expect(markup).toContain("倒入酒液");
  });

  it("shows photo processing and recoverable error states", () => {
    const processingMarkup = renderToStaticMarkup(
      <FollowAlongView
        cocktail={mojito}
        activeStep={mojito.steps.length + 1}
        onBack={() => undefined}
        onStepChange={() => undefined}
        onPhotoSelected={() => undefined}
        isPhotoProcessing
      />
    );
    const errorMarkup = renderToStaticMarkup(
      <FollowAlongView
        cocktail={mojito}
        activeStep={mojito.steps.length + 1}
        onBack={() => undefined}
        onStepChange={() => undefined}
        onPhotoSelected={() => undefined}
        photoError="照片读取失败"
      />
    );

    expect(processingMarkup).toContain("正在准备照片");
    expect(processingMarkup).toContain("aria-busy=\"true\"");
    expect(errorMarkup).toContain("role=\"alert\"");
    expect(errorMarkup).toContain("照片读取失败");
  });
});
