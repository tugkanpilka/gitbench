Native macOS buton; welcome penceresi eylemleri, alert onayları ve genel tıklanabilir eylemler için.

```jsx
<Button variant="primary" icon="＋" onClick={openRepo}>Depo Aç…</Button>
<Button variant="destructive">Kaldır</Button>
<Button variant="secondary">Vazgeç</Button>
<Button icon="⌘">Depo Klonla…</Button> {/* plain: welcome list stili */}
```

- `plain` sola yaslıdır ve ikon accent rengini alır; diğerleri ortalanmış dolgulu pill'dir.
- Yıkıcı eylem etiketleri `…` ile bitmeli ve AlertDialog onayıyla eşleşmelidir.
