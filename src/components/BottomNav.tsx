type BottomNavScreen = "home" | "menu" | "atoms" | "my";

type BottomNavProps = {
  active: BottomNavScreen;
  onNavigate: (screen: BottomNavScreen) => void;
};

type Tab = {
  screen: BottomNavScreen;
  label: string;
  icon: "home" | "menu" | "atoms" | "my";
};

const tabs: Tab[] = [
  { screen: "home", label: "首页", icon: "home" },
  { screen: "menu", label: "酒单", icon: "menu" },
  { screen: "atoms", label: "SVG", icon: "atoms" },
  { screen: "my", label: "我的", icon: "my" }
];

function NavIcon({ icon }: { icon: Tab["icon"] }) {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icon === "home" && (
        <>
          <path d="M5 11.2 12 5l7 6.2" />
          <path d="M7.4 10.2v7.3h9.2v-7.3" />
          <path d="M10.2 17.5v-4.2h3.6v4.2" />
        </>
      )}
      {icon === "menu" && (
        <>
          <path d="M7 5.5h10" />
          <path d="M8 9.5h8" />
          <path d="M7.5 13.5h9" />
          <path d="M9 18.5h6" />
        </>
      )}
      {icon === "atoms" && (
        <>
          <path d="M12 7.5c4.2 0 7.6 1.8 7.6 4s-3.4 4-7.6 4-7.6-1.8-7.6-4 3.4-4 7.6-4Z" />
          <path d="M8.4 5.6c2.1 3.7 2.7 7.4 1.4 8.2s-3.9-1.6-6-5.3" transform="rotate(-30 12 12)" />
          <circle cx="12" cy="12" r="1.4" />
        </>
      )}
      {icon === "my" && (
        <>
          <circle cx="12" cy="8.2" r="3.1" />
          <path d="M6.5 18.2c.7-3.2 2.6-4.8 5.5-4.8s4.8 1.6 5.5 4.8" />
        </>
      )}
    </svg>
  );
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  function navigate(screen: BottomNavScreen) {
    if (screen === active) return;
    triggerHaptic("selection");
    onNavigate(screen);
  }

  return (
    <nav className="home-bottom-nav" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          key={tab.screen}
          className={active === tab.screen ? "active" : ""}
          type="button"
          onClick={() => navigate(tab.screen)}
          aria-current={active === tab.screen ? "page" : undefined}
        >
          <NavIcon icon={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
import { triggerHaptic } from "../utils/haptics";
