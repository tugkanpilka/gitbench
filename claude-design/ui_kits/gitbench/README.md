# GitBench UI Kit

Native macOS yönündeki GitBench uygulamasının tam ekran kiti. İki yüzey:

- **WelcomeWindow** — proje seçici (auth yok; ilk açılışta depo seçilir)
- **MainWindow** — vibrancy sidebar + sonsuz diff akışı + yüzen kontrol pill'i; worktree sağ-tık menüsü ve kaldırma onayı dahil

`index.html` ikisini tek akışta gösterir: ana pencere → proje adı yanındaki ok → welcome → recent seç → geri.

Bileşen primitive'leri `components/` klasöründen compose edilmiştir; bu kit yalnız layout + mock veri içerir. Tema kapsayıcı elemana `data-theme="light"` verilerek değiştirilir; pencereler daima `--gb-desktop` zemini üzerinde sunulmalıdır (vibrancy için).

Tam etkileşimli referans prototip: kök dizindeki `GitBench Prototype.html` (split view, düz/ağaç toggle ve Tweaks paneli dahil).
