İçeriğin üzerinde süzülen vibrancy kontrol pill'i; GitBench'te üst toolbar yoktur, kontroller bunlarda yaşar. Parent `position: relative` olmalı.

```jsx
<FloatBar>
  <span style={{ fontSize: 12.5, fontWeight: 600 }}>auth-refactor</span>
  <FloatBarDivider />
  <SegmentedControl items={viewItems} value={view} onChange={setView} />
</FloatBar>
<FloatBar position="left">{/* sidebar toggle pill */}</FloatBar>
```
