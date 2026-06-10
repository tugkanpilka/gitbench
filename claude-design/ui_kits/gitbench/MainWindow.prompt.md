GitBench ana penceresi; mock veriyle tam etkileşimli (worktree seç, dosyaya atla, scroll-spy, sağ tık → kaldır onayı, Unified/Split). `--gb-desktop` zemini üzerinde, tema için kapsayıcıya `data-theme` ver.

```jsx
<div data-theme={light ? "light" : undefined} style={{ background: "var(--gb-desktop)" }}>
  <MainWindow light={light} onToggleTheme={() => setLight(!light)} onCloseProject={goWelcome} />
</div>
```
