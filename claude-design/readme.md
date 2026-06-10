# GitBench Design System

**GitBench**, macOS için açık kaynak bir Git worktree diff görüntüleyicisidir. Hedef kullanıcı: agentic development yapan (birden çok worktree'de paralel agent task'i koşturan) geliştiriciler. Sol sidebar'da worktree'ler ve değişen dosyalar, sağda tüm dosyaların diff'lerini alt alta akıtan sonsuz kaydırmalı bir pane bulunur (Zed'in çoklu dosya render'ı gibi).

Bu design system, ürünün **native macOS** görsel yönünün (keşif sürecinde A/B/C/D seçeneklerinden seçilen D yönü) damıtılmış halidir. Kaynaklar bu projenin içindedir:

- `GitBench Prototype.html` — uçtan uca interaktif prototip (welcome → proje seç → diff incele → worktree yönet)
- `GitBench Directions.html` — görsel yön keşif canvas'ı (A Graphite / B Ink / C Paper / D macOS)
- `gitbench-*.jsx` — prototip kaynak dosyaları (token'ların orijinal kaynağı `MAC_THEMES`)

## Ürün yüzeyleri

1. **Ana pencere** — vibrancy sidebar (worktree listesi + değişen dosyalar) + diff akışı + yüzen kontrol pill'leri
2. **Welcome penceresi** — proje seçici (uygulamada auth yok; ilk açılışta depo seçtirilir)
3. **Overlay'ler** — bağlam menüsü, macOS alert tarzı onay diyaloğu

## CONTENT FUNDAMENTALS

- **Dil:** Arayüz Türkçe yazılmıştır; Git/dev terimleri İngilizce bırakılır (worktree, diff, unified/split, branch yerine "dal" da kullanılır). Karışım doğaldır: "8 changed files" gibi teknik metinler İngilizce kalabilir.
- **Ton:** Kısa, araçsı, samimi-profesyonel. Açıklamalar tek cümle. Gereksiz coşku yok, emoji YOK.
- **Hitap:** Kullanıcıya ikinci tekil ("ekleyebilirsin", "buraya sürükle"). Buyurgan değil, yol gösterici.
- **Casing:** Cümle düzeni (sentence case). Menü eylemleri macOS geleneğiyle Title Case benzeri ve sonu `…` ile biter: "Depo Aç…", "Worktree'yi Kaldır…", "Projeyi Kapat…".
- **Yıkıcı eylemler:** Daima `…` + onay diyaloğu. Diyalog gövdesi sonucu nesnel anlatır: "Worktree klasörü diskten silinecek. X dalı silinmez."
- **Sayılar:** tabular-nums; diff istatistikleri daima `+N −M` biçiminde (gerçek eksi işareti `−`, tire değil).
- **Klavye ipuçları:** menülerde sağda soluk renkle (⌘R, ⌥⌘T).

## VISUAL FOUNDATIONS

- **Karakter:** Native macOS. Finder/Xcode source-list deseni, gerçek vibrancy, sistem fontları. Web tropikleri (büyük gradient hero, kalın gölgeli kartlar) kullanılmaz.
- **Renk:** Nötr koyu (#1f2025) ve beyaz temalar; tek vurgu rengi (sistem mavisi —dark'ta #2e8bff, light'ta #0a6ce8). Diff yeşil/kırmızısı ve trafik ışıkları dışında renk yok. Tüm renkler `tokens/colors.css` içinde; dark `:root` varsayılan, light `[data-theme="light"]`.
- **Tip:** SF Pro (UI) + SF Mono (kod/yol/sayı). UI metinleri 10.5–13px bandında; kod 12px. Başlıklar -0.01em tracking, uppercase bölüm etiketleri +0.02em. Webfont YOK — sistem fontu.
- **Arka planlar:** Pencereler renkli bir desktop gradient'i üzerinde durur (`--gb-desktop`) — vibrancy'nin işlemesi için şart. İçerik alanları düz renk; doku/pattern yok.
- **Transparanlık + blur:** Sidebar, yüzen pill'ler, menüler ve alert'ler translucent + `backdrop-filter` (`--gb-vibrancy*`). İçerik yüzeyleri (diff pane) asla translucent olmaz.
- **Gölgeler:** Katmana göre artan yumuşak gölgeler + yarım piksel hairline (`0 0 0 .5px`). Dark pencerelerde 1px iç `--gb-window-edge` hattı. İç gölge yalnız segmented thumb'da.
- **Köşeler:** Küçük ve native: satırlar 5–6px, kontroller 7px, pill'ler 10–11px, pencere 11–12px, alert 13px. Tam yuvarlak yalnız badge/trafik ışığı.
- **Hover:** Zemin tonu değişimi (`--gb-hover`, `--gb-row-sel`); renk/scale oynaması yok. Menü öğesi hover'ı accent zemin + beyaz metin.
- **Press/seçim:** Source-list seçimi accent pill (`--gb-sel-bg` + beyaz metin); ikincil seçim gri (`--gb-row-sel`). Shrink animasyonu yok.
- **Animasyon:** Hızlı, gösterişsiz `ease` geçişleri (.08–.3s). Bounce/spring yok. Sidebar genişlik animasyonu .22s; tema geçişi .3s.
- **Layout:** Sabit 264px sidebar; diff satırları sabit yükseklik (24px); sticky file header'lar; kontroller içerik üstünde yüzen pill'lerde (üst toolbar YOK).
- **Diff dili:** Unified varsayılan, split opsiyonel. Eklenen satır yeşil zemin + koyu yeşil gutter; silinen kırmızı eşdeğeri; kelime düzeyi vurgu daha doygun zemin (`--gb-*-word`). Hunk başlıkları mavi-gri bant.
- **İmaj:** Fotoğraf/illüstrasyon kullanılmaz. Tek marka görseli uygulama ikonudur (`assets/`).

## ICONOGRAPHY

- **Sistem:** SF Symbols ruhunda, stroke tabanlı minik inline SVG'ler (1.2–1.6 stroke, round cap/join, 8–17px). Hazır ikon fontu/CDN seti YOK; ikonlar `assets/icons/` altındaki SVG'lerdir.
- Mevcut ikonlar: chevron (açılır satırlar), sidebar-toggle, güneş/ay (tema), büyüteç (arama), üç nokta (satır menüsü).
- Emoji asla ikon olarak kullanılmaz. Unicode yalnız klavye kısayolu glifleri (⌘⌥) ve `+`/`−` istatistikleri için.
- Trafik ışıkları düz renk dairelerdir (`--gb-traffic-*` + iç hairline) — ikon değil, layout elemanı.
- Uygulama ikonu: koyu rounded-rect üzerinde worktree dallanmasını anlatan node-branch grafiği (`assets/gitbench-icon.svg`).

## Index

| Yol | İçerik |
|---|---|
| `styles.css` | Tek giriş noktası — token dosyalarını import eder |
| `tokens/` | colors / typography / spacing / effects token'ları |
| `assets/` | uygulama ikonu + UI ikon SVG'leri |
| `components/core/` | Button, SegmentedControl, Badge, DiffStat |
| `components/navigation/` | WorktreeRow, FileRow |
| `components/diff/` | DiffFileHeader, DiffLine, HunkHeader |
| `components/overlays/` | ContextMenu, AlertDialog, FloatBar |
| `guidelines/` | Design System sekmesini dolduran specimen kartları |
| `ui_kits/gitbench/` | Ana pencere + welcome ekranının interaktif kiti |
| `SKILL.md` | Claude Code/agent kullanım talimatı |

## Kullanım kuralları (özet)

1. `styles.css`'i bağla; light tema için kök elemana `data-theme="light"` ver.
2. Renk/spacing değerlerini asla hardcode etme — `--gb-*` token'larını kullan.
3. Pencereleri `--gb-desktop` zemini üzerinde, `--gb-shadow-window` ile sun.
4. Translucent yüzeylere mutlaka `--gb-vibrancy*` backdrop-filter ekle.
5. Yıkıcı eylem = `…` etiketli menü öğesi + AlertDialog onayı.
