function themeId(theme: string) {
  return `theme-${theme.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function ProphecyThemeMap({
  themes,
  counts,
}: {
  themes: string[];
  counts: Map<string, number>;
}) {
  const max = Math.max(...themes.map((theme) => counts.get(theme) ?? 0), 1);
  const total = themes.reduce((sum, theme) => sum + (counts.get(theme) ?? 0), 0);

  return (
    <nav className="jsu-visual-panel jsu-theme-map" aria-label="Prophecy themes">
      <div className="jsu-visual-head">
        <strong>The thread map</strong>
        <span>{total} prophecy pairs</span>
      </div>
      <div className="jsu-theme-bars">
        {themes.map((theme) => {
          const count = counts.get(theme) ?? 0;
          return (
            <a key={theme} href={`#${themeId(theme)}`} className="jsu-theme-bar">
              <span className="jsu-theme-name">{theme}</span>
              <span className="jsu-theme-track">
                <span style={{ width: `${Math.max(9, (count / max) * 100)}%` }} />
              </span>
              <span className="jsu-theme-count">{count}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export { themeId };
