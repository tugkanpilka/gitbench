---
name: gitbench-design
description: Use this skill to generate well-branded interfaces and assets for GitBench (a native-macOS Git worktree diff viewer), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the readme.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key rules:
- Link `styles.css` and use only `--gb-*` tokens; dark is the default, light via `data-theme="light"`.
- System fonts only (SF Pro / SF Mono) — never load webfonts.
- Windows sit on the `--gb-desktop` gradient with `--gb-shadow-window`; translucent surfaces always pair with a `--gb-vibrancy*` backdrop-filter.
- No top toolbars — controls live in floating vibrancy pills (FloatBar).
- Destructive actions end with `…` and confirm via AlertDialog.
- UI copy is Turkish (sentence case, ikinci tekil), dev terms stay English; diff stats are `+N −M` with a real minus.
