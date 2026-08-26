<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildBreadcrumbList } from '$lib/seo/index.js';
	import WebmcpDiagnose from '$lib/components/webmcp-diagnose.svelte';

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'WebMCP', path: '/webmcp' }
			]
		})
	);
</script>

<SeoHead
	title="WebMCP - Schnittstelle für KI-Assistenten - navigator.berlin"
	description="WebMCP-Tools von navigator.berlin: Berliner Daten an LLM-Agenten ausliefern. Spec-Status, Browser-Support, Tool-Aufrufe."
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/architektur.png`}
	ogImageAlt="navigator.berlin WebMCP"
/>
<JsonLd data={breadcrumbJsonLd} testid="webmcp-breadcrumb-jsonld" />

<main class="mx-auto max-w-2xl px-4 py-12" data-testid="webmcp-page">
	<h1 class="font-serif text-2xl break-words hyphens-auto sm:text-3xl" lang="de">WebMCP</h1>

	<p class="text-fg-muted mt-6 leading-relaxed">
		WebMCP ist eine Browser-API, mit der Websites strukturierte Tools an KI-Agenten ausliefern
		können. Statt HTML zu scrapen, fragt der Agent eine Adresse oder einen Datensatz direkt ab und
		bekommt Zahl, Quelle und Lizenz zurück. navigator.berlin liefert seit Mai 2026 solche Tools aus,
		inzwischen elf, seit August 2026 auch schreibende: Ein Agent kann den Kiez-Finder bedienen, den
		ein Mensch vor sich sieht.
	</p>

	<WebmcpDiagnose />

	<section class="mt-10">
		<h2 class="font-serif text-xl">Status der Spec</h2>
		<p class="mt-3 leading-relaxed">
			WebMCP ist ein
			<a
				class="text-accent underline"
				href="https://webmachinelearning.github.io/webmcp/"
				rel="noopener noreferrer"
				target="_blank"
			>
				W3C-Community-Group-Draft
			</a>, gemeinsam von Microsoft und Google entwickelt, gehostet in der Web Machine Learning
			Community Group. Laufend aktualisiert, Stand August 2026; die API-Surface ist inzwischen von
			<code class="font-mono text-sm">navigator.modelContext</code>
			zu
			<code class="font-mono text-sm">document.modelContext</code>
			umgezogen. Ausdrücklich nicht auf dem W3C-Standards-Track. Das heißt: interessierte Parteien haben
			sich auf einen Entwurf geeinigt, aber noch ist kein Commitment, daraus eine offizielle Web-Plattform-API
			zu machen.
		</p>
		<p class="mt-3 leading-relaxed">
			Spec-URL:
			<a
				class="text-accent underline"
				href="https://github.com/webmachinelearning/webmcp"
				rel="noopener noreferrer"
				target="_blank"
			>
				github.com/webmachinelearning/webmcp
			</a>.
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Browser-Support</h2>
		<dl class="mt-3 space-y-3 leading-relaxed">
			<div>
				<dt class="font-medium">Chrome 149+</dt>
				<dd class="text-fg-muted">
					Native Implementation auf <code class="font-mono text-sm">document.modelContext</code>
					(erste Fassung ab Canary 146 noch auf navigator). Aktivierung über Flag
					<code class="font-mono text-sm">chrome://flags/#enable-webmcp-testing</code>
					plus Neustart.
				</dd>
			</div>
			<div>
				<dt class="font-medium">ChatGPT-Desktop-App</dt>
				<dd class="text-fg-muted">
					Der eingebaute Browser stellt <code class="font-mono text-sm">document.modelContext</code>
					nativ bereit; Tool-Aufrufe setzen ein Runtime-Modell mit Site-Tools-Support voraus (GPT-5.6
					Sol oder Terra) und die Freigabe unter Settings → Browser → Permissions.
				</dd>
			</div>
			<div>
				<dt class="font-medium">Microsoft Edge 147</dt>
				<dd class="text-fg-muted">
					Support angekündigt für März 2026. Vermutlich gleiche Flag- Mechanik wie Chrome.
				</dd>
			</div>
			<div>
				<dt class="font-medium">Firefox und Safari</dt>
				<dd class="text-fg-muted">
					In Spec-Diskussion, kein Release-Datum. Realistische Schätzung: Q3 2026 frühestens.
				</dd>
			</div>
			<div>
				<dt class="font-medium">Polyfill</dt>
				<dd class="text-fg-muted">
					Für Browser ohne native Implementation laden LLM-Browser-Extensions oft einen Polyfill,
					der die API nachreicht. navigator.berlin prüft
					<code class="font-mono text-sm">document.modelContext</code>
					zuerst und fällt auf
					<code class="font-mono text-sm">navigator.modelContext</code>
					plus Polyfill zurück. So funktionieren die Tools auch in Chrome Stable, Firefox oder Safari,
					sofern der Agent diesen Weg fährt.
				</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Begründung für frühen Einsatz</h2>
		<p class="mt-3 leading-relaxed">
			Die Spec ist Draft und der Browser-Support frisch. Wir liefern WebMCP- Tools trotzdem aus,
			weil:
		</p>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				Strukturierte Tool-Discovery ist die richtige Richtung. HTML-Scraping durch LLMs erzeugt
				schlechte Antworten und unnötigen Traffic. Eine deklarative Schnittstelle mit Quelle und
				Lizenz pro Antwort ist eine ehrliche Datenausgabe.
			</li>
			<li>
				Standards entstehen, wenn früh Sites mitmachen. Eine Bürger-Daten- Plattform sollte solche
				Open-Web-Initiativen unterstützen, nicht nur kommerzielle.
			</li>
			<li>
				Der Aufwand ist gering. Die Tools sind Wrapper um Funktionen, die ohnehin existieren
				(Adress-Lookup, Layer-Abfrage, Wahl-Daten). Spec-Änderungen wirken sich nur auf eine
				Adapter-Datei aus.
			</li>
			<li>
				Bricht die Spec, fällt eine Subseite aus. Die Hauptseite bleibt bedienbar. Damit ist das
				Risiko eingegrenzt.
			</li>
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Verfügbare Tools</h2>
		<p class="mt-3 leading-relaxed">
			Aktuell sind elf Tools registriert, zehn lesende und ein schreibendes. Volltext-Manifest mit
			JSON-Schemas pro Tool unter
			<a class="text-accent underline" href="/webmcp-manifest.json">/webmcp-manifest.json</a>.
		</p>
		<dl class="mt-3 space-y-2 leading-relaxed">
			<div>
				<dt class="font-mono text-sm">address_lookup</dt>
				<dd class="text-fg-muted text-sm">Berliner Adressen, Straßen und POIs suchen.</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">cross_layer_query</dt>
				<dd class="text-fg-muted text-sm">
					Alle Daten-Layer an einer Koordinate abfragen, mit Quelle pro Wert.
				</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">list_layers_at_point</dt>
				<dd class="text-fg-muted text-sm">
					Welche Layer decken den Punkt ab? Schlanker Vorab-Check.
				</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">get_kiez_profile</dt>
				<dd class="text-fg-muted text-sm">
					Profil einer LOR-Bezirksregion: Name, Bezirk, Einwohner, Fläche.
				</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">get_layer_metadata</dt>
				<dd class="text-fg-muted text-sm">
					Quelle, Lizenz, Stand-Datum und Methodik eines Daten-Layers.
				</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">list_elections</dt>
				<dd class="text-fg-muted text-sm">Alle 12 Berliner Wahlen seit 2011 auflisten.</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">get_election_result</dt>
				<dd class="text-fg-muted text-sm">
					Ergebnis an einer Adresse für eine bestimmte Wahl, auf wählbarer Ebene (Stimmbezirk, Kiez,
					Bezirk, Berlin).
				</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">compare_elections</dt>
				<dd class="text-fg-muted text-sm">
					Mehrere Wahlen am selben Ort vergleichen, Sparkline-tauglich.
				</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">get_voting_district_geometry</dt>
				<dd class="text-fg-muted text-sm">GeoJSON-Polygon zu einer Stimmbezirks-ID liefern.</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">set_finder_weights</dt>
				<dd class="text-fg-muted text-sm">
					Schreibend: Der Agent stellt die Kiez-Finder-Regler, die Karte vor den Augen des Menschen
					färbt sich live um.
				</dd>
			</div>
			<div>
				<dt class="font-mono text-sm">get_finder_state</dt>
				<dd class="text-fg-muted text-sm">
					Rückkanal: Gewichte, letzte Änderungsquelle (Mensch oder Agent) und Top-Kieze lesen.
				</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Einsatz in Chrome Canary</h2>
		<ol class="mt-3 ml-6 list-decimal space-y-2 leading-relaxed">
			<li>
				<a
					class="text-accent underline"
					href="https://www.google.com/chrome/canary/"
					rel="noopener noreferrer"
					target="_blank"
				>
					Chrome Canary
				</a>
				ab Version 149 installieren (oder Chrome Stable 149+).
			</li>
			<li>
				<code class="font-mono text-sm">chrome://flags/#enable-webmcp-testing</code>
				öffnen, „WebMCP for testing" auf „Enabled" setzen, Canary neu starten.
			</li>
			<li>
				navigator.berlin öffnen. Die elf Tools registrieren sich automatisch bei
				<code class="font-mono text-sm">document.modelContext</code>; die Live-Diagnose oben auf
				dieser Seite zeigt Surface und Tool-Liste.
			</li>
			<li>
				Optional: Chrome-Team-Extension
				<a
					class="text-accent underline"
					href="https://chromewebstore.google.com/"
					rel="noopener noreferrer"
					target="_blank"
				>
					Model Context Tool Inspector
				</a>
				installieren, um Tools zu inspizieren und manuell aufzurufen.
			</li>
		</ol>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Einsatz ohne Canary</h2>
		<p class="mt-3 leading-relaxed">
			Die ChatGPT-Desktop-App bringt WebMCP im eingebauten Browser nativ mit. Wer im Stable-Chrome
			ohne Flag, Firefox oder Safari bleibt, kann WebMCP über eine LLM-Browser-Extension nutzen, die
			einen Polyfill mitlädt.
		</p>
		<p class="mt-3 leading-relaxed">
			Discovery-Pfad (Konvention, nicht Standard):
			<a class="text-accent underline" href="/.well-known/webmcp.json">/.well-known/webmcp.json</a>
			spiegelt
			<a class="text-accent underline" href="/webmcp-manifest.json">/webmcp-manifest.json</a>.
			Klartext-Variante für Crawler nach
			<a
				class="text-accent underline"
				href="https://llmstxt.org"
				rel="noopener noreferrer"
				target="_blank"
			>
				llmstxt.org
			</a>:
			<a class="text-accent underline" href="/llms.txt">/llms.txt</a> und
			<a class="text-accent underline" href="/llms-full.txt">/llms-full.txt</a>.
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Quellen</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				<a
					class="text-accent underline"
					href="https://webmachinelearning.github.io/webmcp/"
					rel="noopener noreferrer"
					target="_blank"
				>
					WebMCP Editor's Draft, Web Machine Learning CG
				</a>
			</li>
			<li>
				<a
					class="text-accent underline"
					href="https://github.com/webmachinelearning/webmcp"
					rel="noopener noreferrer"
					target="_blank"
				>
					GitHub-Repository der Spec
				</a>
			</li>
			<li>
				<a
					class="text-accent underline"
					href="https://patrickbrosset.com/articles/2026-02-23-webmcp-updates-clarifications-and-next-steps/"
					rel="noopener noreferrer"
					target="_blank"
				>
					Patrick Brosset: WebMCP updates, clarifications, and next steps (Feb 2026)
				</a>
			</li>
		</ul>
	</section>
</main>
