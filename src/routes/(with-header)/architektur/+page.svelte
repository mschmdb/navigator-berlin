<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
</script>

<SeoHead
	title="Architektur - Berlin in Daten - navigator.berlin"
	description="navigator.berlin läuft auf einem EU-FOSS-Stack: Open-Source-Software, Hosting in Deutschland, keine US-Cloud-Anbieter, kein Tracking."
	pathname={page.url.pathname}
	origin={page.url.origin}
/>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-2xl break-words hyphens-auto sm:text-3xl" lang="de">Architektur</h1>

	<p class="text-fg-muted mt-6 leading-relaxed">
		Open-Source-Stack, gehostet in Deutschland. Kein US-Cloud-Anbieter, kein Tracking,
		kein Cookie-Banner.
	</p>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Hosting</h2>
		<p class="mt-3 leading-relaxed">
			Server in Deutschland bei einem europäischen Anbieter. Domain ebenfalls bei
			einem deutschen Registrar.
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Anwendung</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				<a class="text-accent underline" href="https://svelte.dev/" rel="noopener noreferrer" target="_blank"
					>Svelte</a
				>
				mit
				<a class="text-accent underline" href="https://kit.svelte.dev/" rel="noopener noreferrer" target="_blank"
					>SvelteKit</a
				>
				(Server-Side-Rendering, Prerender-first)
			</li>
			<li>
				Karte:
				<a class="text-accent underline" href="https://maplibre.org/" rel="noopener noreferrer" target="_blank"
					>MapLibre GL</a
				>
				+
				<a class="text-accent underline" href="https://openfreemap.org/" rel="noopener noreferrer" target="_blank"
					>OpenFreeMap</a
				>
				(EU-FOSS, basiert auf OpenStreetMap)
			</li>
			<li>
				Geocoding:
				<a class="text-accent underline" href="https://nominatim.openstreetmap.org/" rel="noopener noreferrer" target="_blank"
					>Nominatim</a
				>
				(OpenStreetMap Foundation, EU)
			</li>
			<li>Styling: Tailwind CSS, IBM Plex Font-Familie (OFL-Lizenz)</li>
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Daten-Quellen</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				<a class="text-accent underline" href="https://daten.berlin.de/" rel="noopener noreferrer" target="_blank"
					>ODIS Berlin</a
				>
			</li>
			<li>FIS-Broker (Geoportal Berlin)</li>
			<li>Amt für Statistik Berlin-Brandenburg</li>
			<li>Deutscher Wetterdienst (DWD)</li>
			<li>OpenStreetMap</li>
		</ul>
		<p class="mt-3 leading-relaxed">
			Quelle, Lizenz und Stand-Datum pro Layer in der
			<a class="text-accent underline" href="/methodik">Methodik</a> und auf der
			<a class="text-accent underline" href="/lizenzen">Lizenzen-Seite</a>.
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Schnittstelle für KI-Assistenten (alpha)</h2>
		<p class="mt-3 leading-relaxed">
			Fünf Tools für strukturierte Abfragen statt HTML-Scraping: Adress-Suche,
			Punkt-Abfrage, Layer-Discovery, Kiez-Profil, Layer-Metadaten. Antwort
			enthält jeweils Quelle, Lizenz und Stand-Datum.
		</p>
		<p class="mt-3 leading-relaxed">
			<a class="text-accent underline" href="https://github.com/webmachinelearning/webmcp" rel="noopener noreferrer" target="_blank">WebMCP</a>
			ist ein W3C-Community-Group-Draft seit August 2025: eine browser-native
			JavaScript-API für Websites, die Tools an LLMs ausliefern. Noch keine
			Recommendation, Spec in Bewegung.
		</p>
		<p class="mt-3 leading-relaxed">
			Diese Site nutzt
			<a class="text-accent underline" href="https://github.com/MiguelsPizza/WebMCP" rel="noopener noreferrer" target="_blank">mcp-b</a>
			als Polyfill, bis WebMCP browser-nativ verfügbar ist.
		</p>
		<p class="mt-3 leading-relaxed">
			Manifest-Discovery (Convention, nicht Standard):
			<a class="text-accent underline" href="/.well-known/webmcp.json">/.well-known/webmcp.json</a>
			(spiegelt <a class="text-accent underline" href="/webmcp-manifest.json">/webmcp-manifest.json</a>).
			Klartext-Variante:
			<a class="text-accent underline" href="/llms.txt">/llms.txt</a> /
			<a class="text-accent underline" href="/llms-full.txt">/llms-full.txt</a>
			nach <a class="text-accent underline" href="https://llmstxt.org" rel="noopener noreferrer" target="_blank">llmstxt.org</a>.
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Nicht verwendet</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>Cloudflare, AWS, GCP, Azure</li>
			<li>Google Analytics, Facebook Pixel, Werbe-Netzwerke</li>
			<li>Drittanbieter-Embeds</li>
			<li>Tracking-Cookies, Cookie-Banner</li>
			<li>User-Accounts, Login, Newsletter-Sammlung</li>
		</ul>
	</section>
</main>
