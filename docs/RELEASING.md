# Releasing GitBench

GitBench ships as a signed + notarized macOS app, distributed via **GitHub
Releases** (`.dmg` + `.zip` for arm64 and x64). Installed apps **auto-update**
themselves via `electron-updater`.

Cutting a release is one command (`git push --tags`). Everything below the
"Per release" section is **one-time setup** the maintainer does once.

---

## Per release

```bash
# bump the version first
npm version patch        # or minor / major — edits package.json, makes a v* tag
git push --follow-tags
```

The tag push triggers `.github/workflows/release.yml`: a macOS runner builds,
**signs**, **notarizes**, and has electron-builder **publish** the artifacts —
including the `latest-mac.yml` auto-update feed — to a **draft** GitHub Release.

Then: open the draft Release on GitHub, sanity-check the assets, and **Publish**.
Auto-update only sees published, non-draft releases, so nothing updates until you
publish.

> Local sanity build without certificates: `npm run dist:unsigned`
> (unsigned artifacts in `dist/`, Gatekeeper warns on launch, no publish).

---

## Auto-update

- The app calls `autoUpdater.checkForUpdatesAndNotify()` on launch
  (`src/main/bootstrap/setupAutoUpdater.ts`). It is a **no-op when unpackaged**
  (dev), so it only runs in installed builds.
- It reads `latest-mac.yml` from the **latest published** GitHub Release (feed
  configured by the `publish` block in `electron-builder.yml`, baked into
  `app-update.yml`). A newer version → downloads the `.zip` in the background →
  applies on next restart.
- macOS auto-update **requires signing** — which the pipeline guarantees. An
  unsigned build cannot self-update.

---

## One-time setup

### 1. Apple Developer Program ($99/yr)

Required for signing + notarization.

### 2. Developer ID Application certificate → `.p12`

Create a "Developer ID Application" cert and export it (with its private key)
as a `.p12`. For this project that was generated from a CSR; the key + `.p12`
backup live in `~/gitbench-signing/`. Encode for CI:

```bash
base64 -i gitbench-devid.p12 | pbcopy
```

### 3. App-specific password for notarization

appleid.apple.com → Sign-In and Security → App-Specific Passwords. Note your
**Team ID** (developer.apple.com → Membership) — for this org it is `F72VQNJWC4`.

### 4. GitHub repo secrets

Repo → Settings → Secrets and variables → Actions. These match the Docbook
desktop pipeline, so the same values are reused:

| Secret                    | Value                                                    |
| ------------------------- | -------------------------------------------------------- |
| `CSC_LINK`                | base64 of the Developer ID Application `.p12`            |
| `CSC_KEY_PASSWORD`        | the `.p12` password                                      |
| `APPLE_ID`                | your Apple ID email                                      |
| `APPLE_ID_PASS`           | app-specific password (notarization)                     |
| `APPLE_TEAM_ID`           | your 10-char Team ID                                     |
| `HOMEBREW_TAP_DEPLOY_KEY` | **already set** — SSH deploy key for the tap (see below) |

No publish token is needed — electron-builder publishes with the workflow's
built-in `GITHUB_TOKEN`.

### 5. (Optional) App icon

Drop an `icon.icns` into `build/`. electron-builder picks it up automatically;
without it the default Electron icon is used.

---

## Notes

- **Notarization takes a few minutes** — Apple's service queues the upload; the
  job sits on that step until it returns.
- Signing config lives in `electron-builder.yml`; hardened-runtime entitlements
  are in `build/entitlements.mac.plist`.
- macOS only for now (arm64 + x64). Adding Windows/Linux means extra targets and,
  for a clean install, their own signing certs.
