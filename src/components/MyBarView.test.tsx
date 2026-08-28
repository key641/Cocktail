import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MyBarView } from "./MyBarView";
import { emptyAgentSession } from "../domain/userProfile";

describe("MyBarView", () => {
  it("renders the bar status, default favorite view and preference memory", () => {
    const markup = renderToStaticMarkup(
      <MyBarView
        profile={{
          favoriteCocktailIds: ["mojito"],
          recentCocktailIds: ["negroni"],
          barIngredientIds: ["gin", "lemon-juice"],
          agentSession: { ...emptyAgentSession, preferredFlavors: ["清爽"] }
        }}
        onManageIngredients={() => undefined}
        onSelectCocktail={() => undefined}
        onClearHistory={() => undefined}
      />
    );
    expect(markup).toContain("我的酒柜");
    expect(markup).toContain("Mojito");
    expect(markup).toContain("2 种材料");
    expect(markup).toContain("最近");
    expect(markup).toContain("喜欢：清爽");
  });
});
