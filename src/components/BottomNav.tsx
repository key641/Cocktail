type BottomNavScreen = "home" | "menu";

type BottomNavProps = {
  active: BottomNavScreen;
  onNavigate: (screen: BottomNavScreen) => void;
};

type Tab = { screen: BottomNavScreen; label: string };

const tabs: Tab[] = [
  { screen: "home", label: "首页" },
  { screen: "menu", label: "酒单" },
  { screen: "home", label: "收藏" },
  { screen: "home", label: "我的" },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="home-bottom-nav" aria-label="主导航">
      {tabs.map((tab) => {
        const isActive = active === tab.screen && tab.label === (active === "home" ? "首页" : "酒单");
        return (
          <button
            key={tab.label}
            className={isActive ? "active" : ""}
            type="button"
            onClick={() => onNavigate(tab.screen)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
