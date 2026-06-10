macOS alert diyaloğu; her yıkıcı eylemin onayı bundan geçer. Gövde sonucu nesnel anlatır.

```jsx
<AlertDialog
  icon={<img src="assets/gitbench-icon.svg" width="52" height="52" alt="" />}
  title='“auth-refactor” kaldırılsın mı?'
  body={<span>Worktree klasörü diskten silinecek. <code>agent/auth-refactor</code> dalı silinmez.</span>}
  confirmLabel="Kaldır" onConfirm={remove} onCancel={close} />
```
