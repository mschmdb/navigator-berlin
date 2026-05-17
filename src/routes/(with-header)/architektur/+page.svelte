<!--
	Phase-1-Stub: EU-FOSS-Architektur-Showcase kommt in Story 4.7
	(Architektur-Page EU-FOSS-Showcase). Platzhalter damit Footer-Link
	nicht 404t.
-->
<script lang="ts">
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
</script>

<SeoHead
	title="Architektur · navigator.berlin"
	description="Technische Architektur und EU-FOSS-Stack hinter navigator.berlin (in Vorbereitung)."
	noindex
/>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-3xl">Architektur</h1>
	<p class="text-fg-muted mt-6 leading-relaxed">
		Detail-Aufbau (SvelteKit + Postgres-17 + Coolify + Traefik auf Hetzner-Falkenstein, EU-FOSS-only)
		folgt vor Hard-Launch.
	</p>
	<p class="text-fg-muted mt-4 leading-relaxed">
		Vorab-Indizien:
	</p>
	<ul class="text-fg-muted ml-6 mt-2 list-disc leading-relaxed">
		<li>Tile-Source: maptiler.com (EU, OpenStreetMap-Basis)</li>
		<li>Hosting: Hetzner Cloud (Falkenstein, DE)</li>
		<li>Code: Svelte 5 + SvelteKit 2, Open-Source-Stack</li>
		<li>Daten: ODIS Berlin, FIS-Broker, Statistisches Landesamt, DWD</li>
	</ul>
</main>
