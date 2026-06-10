Unified diff satırı; çift gutter + işaret kolonu + token bazlı syntax. Üç renklendirme modu: classic / bars / word.

```jsx
<DiffLine type="del" oldNo={17} mode="classic"
  tokens={[["kw","export function "],["fn","auth"],["pl","(): "],["hlD","boolean"]]} />
<DiffLine type="add" newNo={17}
  tokens={[["kw","export "],["hlA","async "],["kw","function "],["fn","auth"],["pl","()"]]} />
<DiffLine type="ctx" oldNo={20} newNo={24} tokens={[["pl","}"]]} />
```

- `hlA`/`hlD` kelime düzeyi vurgudur (--gb-add-word / --gb-del-word zemini).
- Hunk başlıkları için ayrı `HunkHeader` kullan.
