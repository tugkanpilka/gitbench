Değişen dosya satırı; düz modda yol öneki gösterir (önce yol kısalır, dosya adı asla), ağaç modunda depth ile girinti alır.

```jsx
<FileRow dir="src/auth/" name="middleware.ts" add={42} del={18} active onClick={jump} />
<FileRow name="session.ts" add={31} del={12} depth={2} /> {/* ağaç modu */}
```
