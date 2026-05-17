<!--
	Phase-1-Stub: Vollständige Datenschutz-Erklärung kommt in Story 4.6
	(Compliance-Pages Impressum + Datenschutz + Barrierefreiheit).
	Bis dahin Platzhalter, damit Footer-Link nicht 404t und Prerender-Pfad
	geschlossen ist.
-->
<script lang="ts">
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
</script>

<SeoHead
	title="Datenschutz · navigator.berlin"
	description="Datenschutz-Erklärung für navigator.berlin (in Vorbereitung)."
	noindex
/>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-3xl">Datenschutz</h1>
	<p class="text-fg-muted mt-6 leading-relaxed">
		Vollständige Datenschutz-Erklärung folgt vor Hard-Launch. Bis dahin gilt: navigator.berlin
		setzt keine Tracking-Cookies, kein Analytics-Drittanbieter, keine US-Cloud-Komponenten im
		Production-Pfad. Hosting in Deutschland (Hetzner Falkenstein).
	</p>
	<p class="text-fg-muted mt-4 leading-relaxed">
		Bei Fragen vorab: <a class="underline" href="mailto:matze.schmidbauer@gmail.com"
			>matze.schmidbauer@gmail.com</a
		>.
	</p>
</main>
