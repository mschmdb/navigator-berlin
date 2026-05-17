<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
</script>

<SeoHead
	title="Architektur · navigator.berlin"
	description="navigator.berlin läuft auf einem EU-FOSS-Stack: Open-Source-Software, Hosting in Deutschland, keine US-Cloud-Anbieter, kein Tracking."
	pathname={page.url.pathname}
	origin={page.url.origin}
/>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-3xl">Architektur</h1>

	<p class="text-fg-muted mt-6 leading-relaxed">
		navigator.berlin ist mit einem EU-FOSS-Stack gebaut: alle eingesetzten Komponenten sind
		Open-Source, gehostet wird in Deutschland. Kein US-Cloud-Anbieter im Produktiv-Pfad, kein
		proprietäres Tracking, kein Cookie-Banner notwendig.
	</p>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Hosting</h2>
		<p class="mt-3 leading-relaxed">
			Server-Hosting in Deutschland bei einem europäischen Anbieter. Domain in Deutschland
			registriert.
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
		<p class="mt-3 leading-relaxed">
			Die Inhalte stammen aus offenen Verwaltungs-Quellen:
		</p>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				<a class="text-accent underline" href="https://daten.berlin.de/" rel="noopener noreferrer" target="_blank"
					>ODIS Berlin</a
				>
				(Open Data Information Stelle)
			</li>
			<li>FIS-Broker (Geoportal des Landes Berlin)</li>
			<li>Amt für Statistik Berlin-Brandenburg</li>
			<li>Deutscher Wetterdienst (DWD)</li>
			<li>OpenStreetMap</li>
		</ul>
		<p class="mt-3 leading-relaxed">
			Pro Layer ist die jeweilige Quelle, Lizenz und der Daten-Stand in der
			<a class="text-accent underline" href="/methodik">Methodik</a>
			und auf der
			<a class="text-accent underline" href="/lizenzen">Lizenzen-Seite</a>
			dokumentiert.
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Was bewusst nicht eingesetzt wird</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>Kein Cloudflare, kein AWS, kein GCP, kein Azure</li>
			<li>Kein Google Analytics, kein Facebook Pixel, keine Werbe-Netzwerke</li>
			<li>Keine Drittanbieter-Embeds</li>
			<li>Keine Tracking-Cookies, kein Cookie-Banner</li>
			<li>Keine User-Accounts, keine Login-Funktion, keine Newsletter-Sammlung</li>
		</ul>
	</section>
</main>
