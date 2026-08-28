import { House, Martini, Shapes, UserRound } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

type BottomNavScreen = "home" | "menu" | "atoms" | "my";

type BottomNavProps = {
  active: BottomNavScreen;
  onNavigate: (screen: BottomNavScreen) => void;
};

const tabs = [
  { screen: "home", label: "首页", Icon: House },
  { screen: "menu", label: "酒单", Icon: Martini },
  { screen: "atoms", label: "SVG", Icon: Shapes },
  { screen: "my", label: "我的", Icon: UserRound }
] satisfies Array<{ screen: BottomNavScreen; label: string; Icon: typeof House }>;

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  function navigate(screen: BottomNavScreen) {
    if (screen === active) return;
    triggerHaptic("selection");
    onNavigate(screen);
  }

  return (
    <nav className="home-bottom-nav" aria-label="主导航">
      {tabs.map(({ screen, label, Icon }) => (
        <button
          key={screen}
          className={active === screen ? "active" : ""}
          type="button"
          onClick={() => navigate(screen)}
          aria-current={active === screen ? "page" : undefined}
        >
          <span className="bottom-nav-icon-wrap" aria-hidden="true">
            <Icon className="bottom-nav-icon" strokeWidth={1.7} />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
