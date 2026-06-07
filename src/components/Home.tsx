import { ListeningGlass } from "./ListeningGlass";

type HomeProps = {
  onChat: () => void;
  onExplore: () => void;
  onIngredients: () => void;
  onMenu: () => void;
};

export function Home({ onChat, onExplore, onIngredients, onMenu }: HomeProps) {
  return (
    <section className="screen home-screen">
      <div className="topline">
        <span>9:41</span>
        <span>Nightcap Lab</span>
      </div>

      <div className="home-hero-copy">
        <h1>今晚想喝点什么？</h1>
        <p>我来帮你找到适合你的一杯</p>
      </div>

      <div className="glass-stage">
        <button className="glass-entry" onClick={onChat} aria-label="和 AI 调酒师聊聊">
          <ListeningGlass state="thinking" liquidTone="citrus" />
        </button>
        <div className="bartender-note">
          <span>AI 调酒师</span>
          <p>和小酒杯聊聊</p>
        </div>
      </div>

      <div className="action-stack home-actions">
        <button className="home-action-card" onClick={onExplore}>
          <span className="home-action-icon">⌕</span>
          <span>
            <strong>探索今晚喝什么</strong>
            <small>根据口味、心情和场合推荐</small>
          </span>
        </button>
        <button className="home-action-card" onClick={onIngredients}>
          <span className="home-action-icon">♧</span>
          <span>
            <strong>用现有材料调酒</strong>
            <small>看看能调出什么好喝的</small>
          </span>
        </button>
      </div>

      <nav className="home-bottom-nav" aria-label="首页导航">
        <button className="active" type="button">首页</button>
        <button type="button" onClick={onMenu}>酒单</button>
        <button type="button">收藏</button>
        <button type="button">我的</button>
      </nav>
    </section>
  );
}
