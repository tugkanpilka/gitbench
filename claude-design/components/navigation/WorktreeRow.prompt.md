Sidebar'daki worktree başlık satırı; seçiliyken accent source-list pill'i olur, hover'da ··· menü düğmesi belirir.

```jsx
<WorktreeRow name="auth-refactor" branch="agent/auth-refactor"
  files={8} add={124} del={56} when="2m"
  selected onClick={select} onMenu={(x, y) => openMenu(x, y)} />
```

- Seçili satırın hemen altına FileRow listesi gelir (accordion deseni).
- `onMenu` ContextMenu ile eşleştirilir; "Worktree'yi Kaldır…" AlertDialog onayı ister.
