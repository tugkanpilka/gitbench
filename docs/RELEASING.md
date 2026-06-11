# Releasing GitBench

GitBench ships as a signed + notarized macOS app, distributed two ways:

- **GitHub Releases** — `.dmg` (and `.zip`) for arm64 and x64.
- **Homebrew** — `brew install --cask tugkanpilka/tap/gitbench`.

Cutting a release is one command (`git push --tags`). Everything below the
"Per release" section is **one-time setup** the maintainer does once.

---

## Per release

```bash
# bump the version first
npm version patch        # or minor / major — edits package.json, makes a v* tag
git push --follow-tags
```

The tag push triggers `.github/workflows/release.yml`:

1. `release` job (macOS runner) — builds, **signs**, **notarizes**, and uploads
   the four artifacts to a **draft** GitHub Release.
2. `update-cask` job — hashes the published `.dmg`s and commits an updated
   `Casks/gitbench.rb` to `tugkanpilka/homebrew-tap`.

Then: open the draft Release on GitHub, sanity-check the assets, and **Publish**.
That's it.

> Local sanity build without certificates: `npm run dist:unsigned`
> (produces unsigned artifacts in `dist/`, Gatekeeper will warn on launch).

---

## One-time setup

### 1. Apple Developer Program ($99/yr)

Required for signing + notarization. Enroll at developer.apple.com.

### 2. Create a "Developer ID Application" certificate

In Xcode (Settings → Accounts → Manage Certificates → ＋ → Developer ID
Application) or on the Apple Developer portal. Then export it from **Keychain
Access** as a `.p12` (right-click the cert → Export, set a password).

Encode it for CI:

```bash
base64 -i DeveloperID.p12 | pbcopy   # now in your clipboard
```

### 3. App-specific password for notarization

At appleid.apple.com → Sign-In and Security → App-Specific Passwords → generate
one. Note your **Team ID** (developer.apple.com → Membership).

### 4. Add GitHub repo secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

These match the Docbook desktop pipeline's secret names, so the **same values
can be reused verbatim**:

| Secret | Value |
| --- | --- |
| `CSC_LINK` | base64 of the Developer ID Application `.p12` |
| `CSC_KEY_PASSWORD` | the `.p12` password |
| `APPLE_ID` | your Apple ID email |
| `APPLE_ID_PASS` | app-specific password (notarization) |
| `APPLE_TEAM_ID` | your 10-char Team ID |
| `HOMEBREW_TAP_DEPLOY_KEY` | **already set** — SSH deploy key for the tap (see below) |

`HOMEBREW_TAP_DEPLOY_KEY` and the `homebrew-tap` repo were provisioned ahead of
time (write-enabled SSH deploy key on the tap, its private half stored as this
secret). If that secret is ever missing the `update-cask` job no-ops, so the
release workflow still succeeds.

### 5. (Optional) App icon

Drop an `icon.icns` into `build/`. electron-builder picks it up automatically;
without it the default Electron icon is used.

### 6. Homebrew tap — already provisioned

The public `tugkanpilka/homebrew-tap` repo, a write-enabled SSH deploy key on it,
and the `HOMEBREW_TAP_DEPLOY_KEY` secret on this repo are already set up. The
`update-cask` job creates/overwrites `Casks/gitbench.rb` on each release. Users
install with:

```bash
brew install --cask tugkanpilka/tap/gitbench
```

To rotate the key later: delete the `gitbench-release-ci` deploy key on the tap,
`ssh-keygen` a new pair, re-add the public half as a write deploy key, and
`gh secret set HOMEBREW_TAP_DEPLOY_KEY --repo tugkanpilka/gitbench` with the
private half.

---

## Notes

- **Notarization takes a few minutes** — Apple's service queues the upload; the
  `release` job will sit on the notarize step until it returns.
- The official `homebrew-cask` repo will disable unsigned casks from
  2026-09-01, which is why we notarize rather than ship an unsigned cask.
- Signing config lives in `electron-builder.yml`; hardened-runtime entitlements
  are in `build/entitlements.mac.plist`.
