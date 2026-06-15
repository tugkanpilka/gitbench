# JSX / CSS Modules Kod İncelemesi

**İnceleme tarihi:** 2026-06-13  
**Kapsam:** `src/renderer/src/` altındaki tüm `.tsx` ve `.module.scss` dosyaları  
**İncelenen dosya sayısı:** 22 bileşen + test dosyası, 12 SCSS modülü

---

## Uygulama Durumu (2026-06-15)

Declarative-render kuralı `CLAUDE.md` Hard rule #8 + `agent_docs/architecture.md` "Renderer: declarative rendering" olarak yazıldı ve koda uygulandı.

- **Tamamlandı (Tema A — declarative render):** primitive'ler (`shared/ui/switch`, `shared/ui/visibility`, + testleri); #1, #2, #5 (App, Workspace, DiffView, welcome, worktree-detail-sidebar, worktree-list, unpushed-commits-section, changed-files-section).
- **Tamamlandı (Tema B/C):** #6 (`countLabel`); #7 (ölü `worktree-list-container` kaldırıldı); #3 (`cx` — `file-navigation-row` + `changed-files-section`); #4 (`file-icon` → CSS Modules sınıfı: `--gb-space-3` + `--gb-text-lg`, inline yalnızca dinamik `color`); #9 (segmented-control `0.2s` → `var(--gb-dur-slow)` — ek olarak artık `prefers-reduced-motion`'a saygı duyuyor); #8'in birebir+semantik-güvenli kısmı (`repository-sidebar` `8px` → `--gb-space-4`, `unpushed-commits` `0 16px` → `0 var(--gb-space-6)`).
- **Bilinçli bırakıldı (token uydurmamak için):** #10 ve #8'in geri kalanı. Token paleti **semantiktir**; literallerin çoğunun temiz karşılığı yok — yükseklikler (`44/40/88/420px`) token'sız; `badge` `9px`/`segmented` `5px` radius'ları yalnızca _değer_ olarak `radius-menu`/`radius-row`'a uyuyor ama kavramsal yanlış (bağlamak istenmeyen kuplaj kurar); `9px`/`5px` padding'leri token'sız ev değerleri. Bunlar gerçek one-off'lar; tokenize etmek isteniyorsa önce **token-sistemi kararı** (ör. badge/control için yeni radius token'ı) gerekir — bu bir kod temizliği değil.
- **Durum:** typecheck temiz, 236/236 test geçti.

---

## Üst Değerlendirme — 2. Geçiş (Meta-İnceleme)

> Bu bölüm, aşağıdaki ilk geçiş bulgularının kendisi üzerinde yapılan ikinci bir incelemedir. Tek tek satır bulgularından bir adım geri çekilip "genel resim" sorulduğunda ortaya çıkan tek kritik düzeltme ve bulguların kök-neden sentezi burada.

### Düzeltme: "dayatma" yanlış eksendi — opinionated reviewer'ın damak tadı zaten önerilen kuraldır

> Bu altbölüm, ikinci geçişin ilk halindeki bir hatayı düzeltir. Önceki versiyon #1/#2'yi _"dokümanda yok, o yüzden geçersiz dayatma"_ diye çerçevelemişti. Bu yanlıştı.

`jsx-css-reviewer` ajanı, tanımı gereği belirli bir damak tadına (declarative rendering, compound components, ince JSX) kalibre edilmiştir. Bir bulguyu `<Switch>/<Match>` üzerinden işaretlediğinde **uydurma bir kural icat etmiyor** — kendi açıkça tanımlı standardını uyguluyor; ajanı çalıştırmanın bütün değeri de bu. **Opinionated bir reviewer'ın her bulgusu, etkin olarak önerilen bir yeni kuraldır** ve yeni kurallar bir kod tabanının çıtasını yükseltmenin meşru yoludur. Dolayısıyla "mevcut kural mı / dayatma mı" yanlış bir eksendi.

Geçerli kalan ayrım farklı: **"benimsenmiş mi / önerilmiş mi"** — ve şiddet etiketi bu _statüyü_ yansıtmalı.

**Karar (2026-06-14, bakımcı):** Bu declarative-render konvansiyonu artık **zorunlu (bağlayıcı) bir kuraldır.** Statü netleştiğine göre:

- #1, #2 ve #5 **Must-Fix** statüsündedir — etiket meşrudur; "önerilmiş/koşullu" değil.
- Karar verilmiş bir kural **"Open decisions"a gitmez** (orası kararı _bekleyenler_ içindir; bunu önermem hatalıydı). Bağlayıcı bir kuralın yeri **Hard rules**'tur: kural `CLAUDE.md`'nin "Hard rules" listesine (veya `agent_docs/architecture.md`'ye) yazılır, kod ikinci sırada gelir.

Yani soru artık "geçerli mi / onaylandı mı" değil; karar verildi. Sıra **kuralı dokümana yazıp tüm dosyalara uygulamakta.**

### İç tutarsızlık: kural eşit uygulanmamış → tutarlı uygulama lehine argüman

İlk geçiş `App.tsx` ve `DiffView`'deki whole-component early-return'leri işaretlerken, **aynı kalıbı taşıyan `worktree-list/index.tsx:10` early-return'ünü (`if (worktrees.length === 0)`) atlamış.** Bunu önceki versiyonda _"demek ki kural sadece damak tadı, indir"_ diye yorumlamıştım — bu da yanlış yöndü. Kural zorunlu olduğuna göre doğru okuma şu: **kural her yere tutarlı uygulanmalı ve `worktree-list:10` da kapsama girer** (finding #2'ye eklendi). Eksik uygulama, kuralı geçersiz kılmaz; uygulamanın eksik olduğunu gösterir.

Ayrı bir not — teklif bedelsiz değil: `file-navigation-row:28`'deki `showDirectory ? (…büyük JSX…) : (…büyük JSX…)` örneği, `<Match>` kalıbının iki dolu JSX dalında ternary'den daha hantal kalabildiğini gösteriyor. Bu, kuralı reddetme gerekçesi değil; benimseme kararında bakımcının tartması gereken gerçek bir ödünleşim (ör. "basit göster/gizle için `<Visibility>`, ama dolu iki-dal için ternary kabul").

### Kök-neden sentezi: 10 bulgu → 3 tema

| Tema                                             | Bulgular                                                               | Kök neden                                                         | Şiddet (yeniden kalibre)                 | Eylem                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **A. JSX durum-dallanması (declarative render)** | #1, #2, #5 (+ `worktree-list:10`)                                      | Kural vardı ama yazılı değildi; her dosya idiomatic React         | **Must-Fix — zorunlu (bağlayıcı) kural** | Kuralı `CLAUDE.md` "Hard rules"a yaz; sonra first-match-wins `Switch/Match/Visibility` primitive'lerini ekleyip **tüm** dosyalara uygula |
| **B. Mevcut konvansiyonlar düzensiz uygulanmış** | #3 (`cx`), #4 (inline style), #6 (türetilmiş değer), #8/#9/#10 (token) | Drift — proje zaten bu kurallara sahip ama bazı noktalarda kaçmış | **Gerçek (objektif) tutarsızlık**        | Şimdi düzelt; karar gerektirmez, düşük risk                                                                                              |
| **C. Ölü / tören artefaktları**                  | #7 (`worktree-list-container` class'ı + kullanılmayan SCSS)            | Geride kalmış kalıntı                                             | **Gerçek (objektif)**                    | Sil                                                                                                                                      |

**Tema B ve C neden objektif?** Çünkü bunlar projenin _gerçekten benimsediği_ konvansiyonlara karşı ölçülüyor; bu kanıtlanabilir:

- `cx`, 7 ayrı dosyada import ediliyor — sınıf birleştirmenin ev standardı bu; `file-navigation-row` ve `changed-files-section`'daki template-literal **gerçek sapma**.
- SCSS'te **87 ayrı token, 377 kullanım** — token kullanımı baskın standart; literal `px`/`radius`/`0.2s` değerleri **gerçek sapma**.
- `worktree-list-container` sınıfı **hiçbir SCSS dosyasında tanımlı değil** (doğrulandı) — net ölü kod.

### Sonuç — önerilen sıra

1. **Şimdi yap (Tema B + C, risksiz, kararsız):** #3, #4, #6, #7 ve token sapmaları (#8–#10). Bunlar mevcut ev stilini geri sağlar; PR küçük ve tartışmasız.
2. **Kuralı yaz, sonra uygula (Tema A) — zorunlu kural:** declarative-render kuralını `CLAUDE.md` "Hard rules"a ekle (ör. _"JSX'te koşullu render `&&`/ternary/whole-component early-return ile değil, `<Switch>/<Match>/<Visibility>` ile yapılır"_). Sonra `worktree-list:10` dâhil **tüm** dosyalara uygula. Primitive `src/renderer/src/shared/ui/` altında **first-match-wins** olmalı (bkz. #1) — guard'sız, son dal `when={true}`.

Bu ikinci geçişin özü: ilk geçiş "10 bulgulu düz bir liste"ydi; bir adım ileri taşındığında bu liste **"şimdi yapılacak 4 objektif temizlik + 1 zorunlu (bağlayıcı) kural"a** indirgenir. Kilit nokta — bulguları geçersiz saymak değil, her birini doğru _statüye_ yerleştirmek; statü netleşince (bakımcı kararı: zorunlu kural) şiddet de netleşti: **Tema A = Must-Fix**.

---

## Genel Durum

Genel mimari sağlam: bileşenler tek bir sorumluluk taşıyor, `clsx` (`cx`) kullanımı tutarlı, SCSS'te token kullanımı hakimdir ve BEM benzeri isimlendirme modül kapsamını etkin kullanıyor. Tespit edilen sorunların büyük çoğunluğu JSX içindeki koşullu render kalıplarında yoğunlaşıyor — proje kuralları bunları `<Switch>/<Match>` veya `<Visibility>` bileşenleriyle ifade edilmesini zorunlu kılıyor, ancak bu bileşenler henüz var olmadığından ve bunlar atomik, küçük sarmalayıcılar olduğundan öncelikle yaratılmaları gerekiyor.

---

## Must-Fix (Engelleme Seviyesi)

### 1. Koşullu render için `&&` ve üçlü operatör yaygın kullanımı

`src/renderer/src/app/workspace/index.tsx:20–44`  
`src/renderer/src/features/worktree-detail-sidebar/index.tsx:81–95`  
`src/renderer/src/features/welcome/index.tsx:41–43`  
`src/renderer/src/features/worktree-list/unpushed-commits-section/index.tsx:82–101`  
`src/renderer/src/features/worktree-list/file-navigation-row/index.tsx:28–56` _(eklendi — bkz. aşağıdaki "Kapsam düzeltmesi")_

**Ne:** JSX içinde doğrudan `&&` ve `? :` operatörleriyle yapılan koşullu render. Önerilen kural, çok dallı render için `<Switch>/<Match>`, göster/gizle için `<Visibility>` bileşenlerini kullanmaktır.

**Niyet (önemli):** Bu kuralın amacı **tamamen okunabilirlik** — davranışı değiştirmek değil. Koşulları bile JSX içinde bir isimlendirme konvansiyonunun (adlandırılmış bileşenler) arkasına saklayıp markup'ı düz ve bildirimsel tutmak. Dolayısıyla dönüşümün **davranışı birebir koruması** şarttır; aksi halde "kozmetik" bir kural sessiz bir bug'a dönüşür.

**Düzeltme — bug'sız primitive:**

İlk taslaktaki `Switch` hatalıydı: `return <>{children}</>` tüm dalları render ediyordu, yani **first-match-wins (ilk eşleşen kazanır) semantiği yoktu** — her `Match` bağımsız bir `&&`'e eşitti. Bu yüzden guard'ları (`!error` vb.) atınca davranış değişiyordu. Doğru primitive, Switch'in **yalnızca ilk `when === true` dalını** seçmesidir:

```tsx
// src/renderer/src/shared/ui/visibility/index.tsx
import type { ReactNode } from 'react';

export function Visibility({ isVisible, children }: { isVisible: boolean; children: ReactNode }) {
  return isVisible ? <>{children}</> : null;
}
```

```tsx
// src/renderer/src/shared/ui/switch/index.tsx
import { Children, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

type MatchProps = { when: boolean; children: ReactNode };

// Match yalnızca bir işaretçi; hangi dalın render edileceğine Switch karar verir.
export function Match({ children }: MatchProps) {
  return <>{children}</>;
}

export function Switch({ children }: { children: ReactNode }) {
  const branches = Children.toArray(children).filter(isValidElement) as ReactElement<MatchProps>[];
  return branches.find((branch) => branch.props.when) ?? null;
}
```

Bu impl ile **sıralama önceliği kodlar** (yukarıdaki dal önce kazanır) ve dışlayıcı guard'lar gereksizleşir. `Workspace` dönüşümü artık davranışı birebir korur:

```tsx
// Önceki hali — dört bağımsız && (exclusivity negatif guard'larla elle sağlanıyor)
{error && <div className={styles['workspace__error']} role="alert">{error}</div>}
{diffLoading && !error && <div className={styles['workspace__loading']} role="status">Loading diff…</div>}
{!hasDiff && !diffLoading && !error && <p className={styles['workspace__placeholder']}>…</p>}
{hasDiff && !error && <DiffView … />}

// Sonraki hali — sıra = öncelik; first-match-wins sayesinde guard'lar gereksiz, davranış aynı
<Switch>
  <Match when={!!error}>
    <div className={styles['workspace__error']} role="alert">{error}</div>
  </Match>
  <Match when={diffLoading}>
    <div className={styles['workspace__loading']} role="status">Loading diff…</div>
  </Match>
  <Match when={!hasDiff}>
    <p className={styles['workspace__placeholder']}>Select a worktree to view all uncommitted changes.</p>
  </Match>
  <Match when={true}>
    {/* default dal: yukarıdakilerin hiçbiri tutmadıysa diff göster */}
    <DiffView … />
  </Match>
</Switch>
```

Doğrulama: `error && diffLoading` aynı anda true olduğunda — eski kodda yalnızca error render edilirdi (loading'in `!error` guard'ı vardı). Yeni impl'de Switch ilk `when === true` dalı (`error`) seçip durur; loading **render edilmez**. Davranış birebir aynı. Son dal `when={true}` ile açık bir "default" olur; böylece `!hasDiff`/`hasDiff` gibi tamamlayıcı guard çiftleri de gerekmez.

`WorktreeDetailSidebar`'daki `diffLoading ? … : …` üçlüsü ve `unpushedCommits.length > 0 && …` için de aynı dönüşüm uygulanmalı; basit göster/gizle durumlarında ise `<Match>` yerine `<Visibility>` yeterli.

**Kapsam düzeltmesi (önceki #3 ile tutarlılık):** İlk geçiş, `file-navigation-row/index.tsx`'te yalnızca satır 20–22'deki className birleştirmesini (`cx` bulgusu #3) işaretlemiş; ama **aynı dosyanın 28. satırındaki `showDirectory ? (…dolu JSX…) : (…dolu JSX…)` koşullu render'ı** — ki bu tam olarak bu maddenin (`#1`) hedefidir — gözden kaçmıştı. Kural benimsenirse bu da `<Switch>` ile ifade edilmeli:

```tsx
<Switch>
  <Match when={showDirectory}>
    <FlatFileRowContent … />
  </Match>
  <Match when={true}>
    <IndentGuides depth={depth} />
    {/* … */}
  </Match>
</Switch>
```

---

### 2. Erken return ile koşullu render

`src/renderer/src/app/App.tsx:50–58`  
`src/renderer/src/features/worktree-detail-sidebar/index.tsx:33–51`  
`src/renderer/src/features/worktree-list/index.tsx:10–14` _(eklendi — bkz. aşağıdaki "Kapsam düzeltmesi")_

**Ne:** `if (browser.repoPath === null) { return <WelcomeScreen … />; }` kalıbı. Önerilen kural: whole-component early-return "ne render edilecek" kararı için kullanılmaz — bildirimsel kal.

**Neden önemli:** `App`'in iki farklı durumu markup düzeyinde görünmüyor; okuyan kişi bileşenin tamamını taramak zorunda kalıyor. Özellikle `WorktreeDetailSidebar`'da aynı `<div>` shell iki early-return kolunda da tekrar yazılıyor — bu bir tutarsızlık da yaratıyor.

**Düzeltme:**

```tsx
// App.tsx — erken return yerine Switch/Match (son dal = default)
return (
  <Switch>
    <Match when={browser.repoPath === null}>
      <WelcomeScreen loading={browser.loading} error={browser.error} onOpenRepository={browser.pickRepository} />
    </Match>
    <Match when={true}>
      <AppShell …>
        <Workspace … />
      </AppShell>
    </Match>
  </Switch>
);
```

`WorktreeDetailSidebar`'da `worktree === null` dalı için `<Switch>` kullan ve ortak shell'i dışarıya taşı.

**Kapsam düzeltmesi (kuralı komşuya da uygula):** İlk geçiş bu kalıbı `App.tsx` ve `DiffView`'de işaretlerken **birebir aynı şekli taşıyan `worktree-list/index.tsx:10`'u atlamıştı.** Kural benimsenecekse burası da kapsamda olmalı:

```tsx
// worktree-list/index.tsx — şu anki hali (whole-component early-return)
export function WorktreeList({ worktrees, … }: WorktreeListProps) {
  if (worktrees.length === 0) {
    return <p className={styles['worktree-list__empty']}>No worktrees to display in this repository.</p>;
  }
  return ( /* <ul> … */ );
}

// Sonraki hali — boş/dolu kararı markup düzeyinde bildirimsel
export function WorktreeList({ worktrees, … }: WorktreeListProps) {
  return (
    <Switch>
      <Match when={worktrees.length === 0}>
        <p className={styles['worktree-list__empty']}>No worktrees to display in this repository.</p>
      </Match>
      <Match when={true}>
        <ul className={styles['worktree-list']} aria-label="Worktrees">
          {/* … */}
        </ul>
      </Match>
    </Switch>
  );
}
```

---

## Should-Fix (Düzeltilmeli)

### 3. Koşullu class string birleştirme — `cx` kullanılmıyor

`src/renderer/src/features/worktree-list/file-navigation-row/index.tsx:21–23`  
`src/renderer/src/features/worktree-list/changed-files-section/index.tsx:68–71`

**Ne:** `file-navigation-row/index.tsx` satır 21–23'te template literal ile class birleştirme yapılıyor:

```tsx
// Şu anki hali
className={`${styles['file-navigation-row']} ${
  showDirectory ? styles['file-navigation-row--flat'] : ''
}`}
```

`changed-files-section/index.tsx` satır 68–71'de de şablonla birleştirme var:

```tsx
className={`${styles['worktree-file-group__header']} ${styles[`worktree-file-group__header--${group.key}`]}`}
```

**Neden önemli:** Proje kuralı koşullu class'lar için `cx` kullanılmasını zorunlu kılıyor. String birleştirme boşluk hatalarına ve okunurluk sorunlarına yol açıyor.

**Düzeltme:**

```tsx
// file-navigation-row — cx ile
className={cx(styles['file-navigation-row'], showDirectory && styles['file-navigation-row--flat'])}

// changed-files-section — cx ile
className={cx(
  styles['worktree-file-group__header'],
  styles[`worktree-file-group__header--${group.key}`]
)}
```

---

### 4. Inline `style` ile sihirli sayı kullanımı

`src/renderer/src/features/worktree-list/file-icon/index.tsx:7`

**Ne:** `const ICON_LAYOUT: CSSProperties = { flex: 'none', marginRight: 6, fontSize: '14px', opacity: 0.9 }` — `marginRight: 6` ve `fontSize: '14px'` doğrudan sayı değerleri, token değil.

**Neden önemli:** Bunlar CSS modülüne ya da token'a bağlanmamış sihirli değerler; tasarım tokeni güncellendiğinde bu icon'ların stilleri geride kalır. `FileIcon`'ın inline `style` kullanması da SCSS modülünden ayrı bir bakım yükü yaratıyor.

**Düzeltme:** `FileIcon` için bir CSS Modules sınıfı yaz ve inline style'ı kaldır:

```css
/* worktree-list/index.module.scss'e ekle */
.file-icon {
  flex: none;
  margin-right: var(--gb-space-2); /* veya var(--gb-space-1-5) neyse uygunsa */
  font-size: var(--gb-text-sm);
  opacity: 0.9;
}
```

```tsx
// FileIcon — color dinamik olduğu için sadece o inline kalabilir
<Icon className={styles['file-icon']} style={{ color }} />
```

---

### 5. `DiffView` içinde güvenli olmayan düz early-return kullanımı

`src/renderer/src/features/diff-viewer/index.tsx:21–35`

**Ne:** `DiffView` bileşeni `clean` ve `model.files.length === 0` durumlarını üst üste iki early-return ile işliyor. Proje kuralı whole-component early-return'ü "what to render" kararı için yasaklıyor.

**Neden önemli:** Her iki dal da aynı `<div className={styles['diff-view']}>` sarmalayıcısını tekrarlıyor ve farklı durumların ne zaman aktif olduğu bileşenin tamamı taranmadan anlaşılamıyor.

**Düzeltme:**

```tsx
export function DiffView({ model, clean, … }: DiffViewProps) {
  return (
    <div className={styles['diff-view']}>
      <Switch>
        <Match when={clean}>
          <div className={styles['diff-view__clean']}>Worktree is clean; no uncommitted changes.</div>
        </Match>
        <Match when={model.files.length === 0}>
          <div className={styles['diff-view__empty']}>No diff to display.</div>
        </Match>
        <Match when={true}>
          <DiffViewContent key={instanceKey(model)} model={model} … />
        </Match>
      </Switch>
    </div>
  );
}
```

> Not: ilk taslakta son dal `when={model.files.length > 0 && !clean}` yazılmıştı. First-match-wins Switch'te bu **gereksiz** — `clean` ve `files.length === 0` zaten önceki dallarda yakalandığından son dal yalnızca "default" rolündedir ve `when={true}` olur. (İlk taslağın #1'de guard atıp burada guard tutması, primitive'in semantiği netleşmeden yazıldığının işaretiydi; doğru primitive ile her iki yer de guard'sızdır.)

---

### 6. Satır içi hesaplama içeren JSX ifadeleri

`src/renderer/src/features/worktree-list/unpushed-commits-section/index.tsx:76–78`

**Ne:**

```tsx
<span className={styles['unpushed-commits__count']}>
  {commits.length}
  {truncated ? '+' : ''}
</span>
```

Sayaç suffix'i markup içinde koşullu string birleştirme olarak ifade ediliyor.

**Neden önemli:** İnce bir "türetilmiş değer" — `return` öncesinde isimlendirilmeli.

**Düzeltme:**

```tsx
const countLabel = truncated ? `${commits.length}+` : String(commits.length);
// …
<span className={styles['unpushed-commits__count']}>{countLabel}</span>;
```

---

### 7. `worktree-list-container` sarmalayıcısı anlamsız

`src/renderer/src/features/worktree-list/index.tsx:17–18`

**Ne:** `<div className={styles['worktree-list-container']}>` wraps `<ul>` fakat `worktree-list-container` sınıfı SCSS dosyasında tanımlı değil (dosya sadece `.worktree-list` tanımlıyor). Bu "ceremony" wrapper — bir rolü yok ve kullanılmayan bir class adı taşıyor.

**Neden önemli:** Anlamsız bir DOM katmanı ekliyor; kullanılmayan class isimsiz bir dekorasyon.

**Düzeltme:** `<div>` sarmalayıcısını kaldır, `<ul>`'ü doğrudan döndür:

```tsx
return (
  <ul className={styles['worktree-list']} aria-label="Worktrees">
    {worktrees.map(…)}
  </ul>
);
```

---

## Nice-to-Have (İyileştirme Önerileri)

### 8. SCSS'te sihirli piksel değerleri — tokenlar eksik

`src/renderer/src/features/repository-sidebar/index.module.scss:11` — `min-height: 88px`, `padding: 42px 18px 12px`  
`src/renderer/src/features/welcome/index.module.scss:24` — `min-height: 420px`, `padding: 42px`  
`src/renderer/src/features/worktree-detail-sidebar/index.module.scss:21` — `height: 44px`, `padding: 0 14px`  
`src/renderer/src/features/worktree-list/unpushed-commits-section/index.module.scss:8` — `height: 40px`, `padding: 0 16px`

**Ne:** Spacing ve boyut değerleri buralarda literal piksel sayısı olarak yazılmış. Token sisteminin kapsamı dışında kalan one-off değerler varsa bunlar tolere edilebilir; ancak `44px`, `40px` gibi toolbar/header yüksekliklerinin büyük ihtimalle bir token'a karşılık geldiği değerler olduğu düşünülüyor.

**Neden önemli:** Başka dosyalarda `var(--gb-toolbar-h)` gibi token'lar kullanılırken burada doğrudan sayı kullanılması tutarsızlık yaratıyor. Mesela `welcome/index.module.scss:11`'de `var(--gb-toolbar-h)` kullanılıyor ama `worktree-detail-sidebar`'da `height: 44px` doğrudan yazılmış.

**Düzeltme:** Toolbar yüksekliği `var(--gb-toolbar-h)`; commit satır yüksekliği, sidebar başlık dolgusu gibi değerler için varsa ilgili token'ları kullan.

---

### 9. `segmented-control/index.module.scss` — hardcoded `0.2s` geçiş süresi

`src/renderer/src/shared/ui/segmented-control/index.module.scss:20`

**Ne:** `transition: left 0.2s var(--gb-ease), width 0.2s var(--gb-ease)` — `0.2s` doğrudan yazılmış, `var(--gb-dur-quick)` veya `var(--gb-dur-base)` gibi mevcut token'lardan biri kullanılabilir.

**Düzeltme:** `0.2s` → `var(--gb-dur-base)` (veya `var(--gb-dur-quick)` — hangisi tasarım niyetini daha iyi yansıtıyorsa).

---

### 10. `badge/index.module.scss` ve `segmented-control/index.module.scss` — literal border-radius değerleri

`src/renderer/src/shared/ui/badge/index.module.scss:7` — `border-radius: 9px`  
`src/renderer/src/shared/ui/segmented-control/index.module.scss:13,32` — `border-radius: 5px`

**Ne:** `var(--gb-radius-full)` ve `var(--gb-radius-control)` gibi token'lar mevcut olduğu halde bazı noktalarda literal değerler kullanılıyor.

**Düzeltme:** Mevcut token'larla eşleşiyorlarsa dönüştür; gerçek one-off ise bırak.

---

## İyi Yapılanlar

- **`cx` (`clsx`) kullanımı** kodun büyük bölümünde tutarlı şekilde uygulanmış.
- **Token kullanımı kapsamlı** — renk, tipografi, aralık, geçiş süresi ve easing'in büyük çoğunluğu `var(--gb-…)` token'larından geliyor.
- **`<DiffFileSection>` memo ile sarmalanmış** ve stable callback pattern (`getToggleHandler`, `getSectionRef`) doğru uygulanmış — render'ı minimize eden bilinçli bir karar.
- **`FileListProvider`** context üzerinden prop drilling ortadan kaldırılmış; ağaç görünümünde her katmana prop aktarmak zorunda kalmak yerine context ile yönetiliyor.
- **`FilePath`** component'ı `DiffFileSection` içinde refaktör edilmiş ve kendi adını taşıyan ayrı bir alt bileşen olarak çıkarılmış — domain dilinde okuma sağlıyor.
- **`WorktreeRow`** tüm türetilmiş değerlerini (`name`, `reference`, `statuses`, `accessibleLabel`) `return` öncesinde hesaplıyor — JSX satırları ince kalıyor.
- **SCSS BEM benzeri isimlendirme** modül kapsamıyla birleşince selector çakışmasına yer bırakmıyor; seçiciler düz ve context'e bağlı.
- **`groupChangedFiles`** saf fonksiyon olarak modül scope'unda tanımlanmış ve `useMemo` ile stabilize edilmiş — bilinçli bir performans kararı.
- **`diff-viewer/index.module.scss`** üçüncü taraf `react-diff-view` class'larını `:global()` ile kapsamlı biçimde ezmiş ve kendi tasarım token'larına bağlamış — harici bağımlılığı temiz bir kapsüllemeyle izole ediyor.
