# WebMCP-Integration verifizieren

Quick-Check für die WebMCP-Adapter-Schicht (Story 2.7).

Ziel: nachweisen, dass ein LLM-Browser-Agent die fünf Tools, vier Resources und drei Prompt-Templates findet und das `cross_layer_query`-Tool eine zitierfähige Antwort liefert.

## Voraussetzungen

- `pnpm install` aktuell
- `pnpm dev` läuft auf `http://localhost:5173`
- Optional: Chrome 146+ (native `navigator.modelContext`-API). Falls nicht: der Polyfill `@mcp-b/global` lädt automatisch nach.

## Variante A: Manifest-Endpoint per curl

```bash
curl -s http://localhost:5173/webmcp-manifest.json | jq '{
  spec_version,
  tools: (.tools | map(.name)),
  prompts: (.prompts | map(.name)),
  resources: (.resources | map(.uri_template))
}'
```

Erwartung:

```json
{
  "spec_version": "0.3.0",
  "tools": ["address_lookup", "cross_layer_query", "list_layers_at_point", "get_kiez_profile", "get_layer_metadata"],
  "prompts": ["address_overview", "compare_kieze", "explain_layer"],
  "resources": [
    "navigator://address/current",
    "navigator://layers/active",
    "navigator://bezirk/{slug}",
    "navigator://kiez/{slug}"
  ]
}
```

Wenn alle drei Listen die erwarteten Slugs liefern: Manifest-Pfad ist intakt.

## Variante B: Adapter im Browser-DevTools

1. Browser-Console auf `http://localhost:5173` öffnen.
2. `navigator.modelContext` eingeben. Sollte ein Objekt sein (entweder native oder via Polyfill).
3. `navigator.modelContext.listTools?.()` oder `navigator.modelContext.getTools?.()` aufrufen (je nach Surface). Erwartung: Array mit fünf Einträgen.
4. Beispiel-Call:

   ```js
   await navigator.modelContext.callTool({
     name: 'list_layers_at_point',
     arguments: { lat: 52.5163, lng: 13.3777 }
   });
   ```

   Erwartung: Array mit Layer-Slugs und `has_value` Flags (Brandenburger Tor).

Wenn `navigator.modelContext` `undefined` bleibt: Polyfill-Load gescheitert. Konsole nach `[webmcp] mount failed` durchsuchen.

## Variante C: MCP-Inspector-CLI

Falls keine Browser-Extension verfügbar ist (Stand Mai 2026 unklar bei Anthropic Claude Browser):

```bash
npx @modelcontextprotocol/inspector --transport http http://localhost:5173/webmcp-manifest.json
```

Der Inspector listet `tools`, `resources` und `prompts` aus dem Manifest. Tool-Calls über den Inspector funktionieren nur, wenn der Inspector die WebMCP-Transport-Layer unterstützt (Pre-1.0, prüfen).

## Variante D: Claude Browser Extension (falls verfügbar)

1. Extension installieren.
2. `http://localhost:5173` öffnen.
3. Extension öffnen, Tool-Liste anzeigen lassen.
4. Prompt: "Liste alle Datenlayer am Brandenburger Tor und nenne die Quellen." Erwartung: Tool-Call `list_layers_at_point` oder `cross_layer_query` + zitierte Antwort.

## Häufige Probleme

- **`navigator.modelContext` undefined trotz Polyfill.** `console.warn`-Output prüfen. Möglich: User-Browser blockiert dynamische Imports. Workaround: Browser wechseln oder Network-Tab überprüfen.
- **Manifest-Endpoint liefert 404.** Build prüfen (`pnpm build`). Endpoint ist `prerender = true`, muss in `.svelte-kit/output/prerendered/pages/webmcp-manifest.json` erscheinen.
- **Tool-Call wirft Schema-Error.** Inputs müssen `snake_case` sein (`updated_at`, nicht `updatedAt`). Schema im Manifest gegenprüfen.

## CI-Pfad

Unit-Tests:

```bash
pnpm test:unit --project=server --run src/lib/webmcp src/routes/webmcp-manifest.json
```

Manifest-Build:

```bash
pnpm webmcp:manifest
```

Beide müssen vor Story-Close grün sein.
