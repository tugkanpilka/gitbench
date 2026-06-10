// GitBench DS — card fallback loader.
// Prefers the compiled _ds_bundle.js namespace; if absent (compiler not run yet),
// fetches the component sources, strips ESM syntax and evaluates them with Babel
// so specimen cards and the UI kit always render.
(function () {
  window.gbLoad = async function (root, paths, needed) {
    const findNs = () => {
      for (const k of Object.getOwnPropertyNames(window)) {
        try {
          const v = window[k];
          if (v && typeof v === "object" && needed.every((n) => typeof v[n] === "function")) return v;
        } catch (e) { /* cross-origin frame etc. */ }
      }
      return null;
    };
    let ns = findNs();
    if (ns) return ns;
    // try the compiled bundle first (generated when the project is a Design System)
    try {
      const res = await fetch(root + "_ds_bundle.js");
      if (res.ok) {
        (0, eval)(await res.text());
        ns = findNs();
        if (ns) return ns;
      }
    } catch (e) { /* not compiled yet — fall through to sources */ }
    let combined = "";
    for (const p of paths) {
      const res = await fetch(root + p);
      let src = await res.text();
      src = src.replace(/^\s*import[^\n]*$/gm, "");
      src = src.replace(/^(\s*)export\s+/gm, "$1");
      combined += "\n" + src;
    }
    const code = Babel.transform(combined, { presets: ["react"] }).code;
    const names = [...new Set([...combined.matchAll(/^[ \t]*function\s+([A-Z]\w*)/gm)].map((m) => m[1]))];
    return new Function("React", code + "\nreturn {" + names.join(",") + "};")(React);
  };
})();
