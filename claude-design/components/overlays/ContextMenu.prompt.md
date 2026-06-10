Vibrancy'li macOS bağlam menüsü; x/y verilirse fixed overlay olur, verilmezse inline render edilir (specimen için).

```jsx
<ContextMenu x={ev.clientX} y={ev.clientY} onClose={close} items={[
  { label: "Finder'da Göster" },
  { label: "Terminalde Aç", hint: "⌥⌘T" },
  "—",
  { label: "Worktree'yi Kaldır…", destructive: true, onClick: confirmRemove },
]} />
```

- Yıkıcı öğeler `…` ile biter ve AlertDialog onayı tetikler.
