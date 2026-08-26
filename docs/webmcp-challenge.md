# WebMCP Challenge 2026: Prior Work vs. New Work

This document separates pre-existing work from work created during the
OpenAI WebMCP Challenge submission period (Aug 25, 2026, 20:00 CEST to
Sep 3, 2026, 22:00 CEST), as required by the official rules for
pre-existing projects.

## The dividing line

The git tag **`webmcp-challenge-baseline`** marks commit `2c45469`
(Aug 25, 2026, 10:17 CEST), the last commit before the submission
window opened. Everything after this tag is challenge-period work,
delivered as a reviewed pull-request chain with dated commit history.

```
git log webmcp-challenge-baseline..main
```

## Prior work (context, not for judging)

navigator.berlin is a Berlin open-data atlas, live since May 2026:
65 data layers, an aggregated Kiez-Score, election results down to
voting-district level, and the interactive Kiez-Finder (nine weighted
sliders recolor all 542 planning areas on the GPU while you drag).

WebMCP has been part of the site since May 2026: **nine read-only
tools** (address lookup, cross-layer queries, Kiez profiles, layer
metadata with license provenance, election tools) registered on
`navigator.modelContext` with an `@mcp-b/global` polyfill fallback,
plus a tool manifest at `/webmcp-manifest.json`.

## New work in the submission period

All of the following was designed, built, tested (TDD), and reviewed
after the window opened, as pull requests #21 through #27 (all dated
Aug 26, 2026):

| PR  | What it adds                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #21 | `document.modelContext` as the primary surface per the current spec, with `navigator.modelContext` and polyfill fallback. Verified in the ChatGPT in-app browser, which provides only the document surface.                                                                                                                                |
| #22 | **The collaboration round-trip.** Two new tools: `set_finder_weights` (the agent moves the Kiez-Finder sliders; partial updates, unspecified weights stay) and `get_finder_state` (the agent reads what the human adjusted: weights, who changed them last, top matches). A new finder bridge module connects the tools to the live panel. |
| #23 | Live WebMCP diagnostics on `/webmcp`: which API surface the browser provides, where the tools registered, polyfill status, full tool list. Readable without devtools.                                                                                                                                                                      |
| #24 | Spec conformance: tool registration is awaited (`registerTool` returns a promise per the current IDL) and all ten read-only tools declare `annotations.readOnlyHint`.                                                                                                                                                                      |
| #25 | `voting_similarity` + `party` on `set_finder_weights`: the agent can weight similarity of local voting behavior (BTW 2025 Zweitstimme) to a chosen party.                                                                                                                                                                                  |
| #26 | Resilient registration: individual `registerTool` rejections are collected with readable reasons (DOMException-safe serialization) instead of failing the whole mount.                                                                                                                                                                     |
| #27 | **Cross-context sync via BroadcastChannel.** The ChatGPT agent operates on its own page instance; the bridge now broadcasts agent updates so the map the human is watching recolors live, and human slider changes flow back to the agent.                                                                                                 |

Also new in the period: the tool manifest and `/webmcp` documentation
page were updated to the 11-tool state, and the two new tools carry
full JSON schemas in the manifest.

## How to verify

- **Evidence:** `git log webmcp-challenge-baseline..main`, plus the
  dated, reviewed pull requests #21-#27 on GitHub.
- **Live check:** open `/webmcp` in the ChatGPT desktop app's built-in
  browser (site tools enabled, GPT-5.6 Sol or Terra) or Chrome 149+
  with `chrome://flags/#enable-webmcp-testing`. The diagnostics
  section shows the detected surface and all 11 registered tools.
- **The round-trip:** ask the agent for "quiet, green, close to an
  S-Bahn" on `/explore?finder=1`, watch the map recolor, drag a
  slider yourself, and ask the agent what changed.
