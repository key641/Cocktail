import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MyBarView } from "./MyBarView";
import { emptyAgentSession } from "../domain/userProfile";

describe("MyBarView", () => {
  it("renders ingredients, favorites, history and preference memory", () => {
    const markup = renderToStaticMarkup(
      <MyBarView
        profile={{
          favoriteCocktailIds: ["mojito"],
          recentCocktailIds: ["negroni"],
          barIngredientIds: ["gin", "lemon-juice"],
          agentSession: { ...emptyAgentSession, preferredFlavors: ["清爽"] }
        }}
        feedbackCount={2}
        onManageIngredients={() => undefined}
        onSelectCocktail={() => undefined}
        onClearHistory={() => undefined}
      />
    );
    expect(markup).toContain("我的酒柜");
    expect(markup).toContain("Mojito");
    expect(markup).toContain("Negroni");
    expect(markup).toContain("喜欢：清爽");
  });
});
