<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const pageTitle = 'Methodik Wahldaten · navigator.berlin';
	const pageDescription =
		'Daten-Cutoff, Quellen, Briefwahl-Behandlung und Aggregations-Strategie der Wahldaten in navigator.berlin.';

	const breadcrumbs = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Methodik', path: '/methodik' },
				{ name: 'Wahldaten', path: '/methodik/wahldaten' }
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{origin}
	{pathname}
	locales={['de']}
/>

<JsonLd data={breadcrumbs} />

<article
	class="mx-auto max-w-3xl px-4 py-8 space-y-6 prose prose-stone"
	data-testid="wahl-methodik-page"
>
	<header class="space-y-2">
		<p class="font-mono text-xs uppercase tracking-wide text-ink-muted">
			<a href="/" class="hover:text-ink underline-offset-2 hover:underline">Berlin</a>
			·
			<a href="/methodik" class="hover:text-ink underline-offset-2 hover:underline">Methodik</a>
		</p>
		<h1 class="font-sans text-3xl font-bold text-ink">Methodik · Wahldaten</h1>
	</header>

	<section class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">Daten-Cutoff</h2>
		<ul class="space-y-1">
			<li>Bundestagswahlen: 2013, 2017, 2021, 2025</li>
			<li>Abgeordnetenhauswahlen: 2011, 2016, 2021, 2023 (Wiederholung)</li>
			<li>Bezirksverordneten-Versammlungen: 2011, 2016, 2021, 2023 (Wiederholung)</li>
			<li>Europawahlen: Phase 2 Backlog, aktuell nicht enthalten</li>
		</ul>
	</section>

	<section class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">Quellen</h2>
		<ul class="space-y-2">
			<li>
				<strong>Bundestagswahlen:</strong> Bundeswahlleiterin Wahlbezirksstatistik
				(<code class="font-mono text-xs">_wbz.zip</code>), Lizenz Datenlizenz Deutschland
				Namensnennung 2.0.
			</li>
			<li>
				<strong>AGH + BVV:</strong> Amt für Statistik Berlin-Brandenburg
				XLSX-Sheet-Pipeline (DL_BE_*.xlsx), Lizenz Datenlizenz Deutschland
				Namensnennung 2.0.
			</li>
		</ul>
	</section>

	<section class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">Aggregations-Strategie</h2>
		<p>
			Stimmbezirks-Werte werden räumlich auf vier Ebenen aggregiert: Stimmbezirk, Kiez (LOR-
			Bezirksregion), Bezirk (12) und Berlin gesamt. Pro Stimmbezirk wird der Polygon-
			Centroid berechnet und in die enthaltene LOR-Bezirksregion gemappt
			(Punkt-in-Polygon-Lookup).
		</p>
	</section>

	<section class="space-y-3" id="wahldaten-briefwahl">
		<h2 class="font-sans text-xl font-semibold text-ink">Briefwahl-Behandlung</h2>
		<p>
			Stimmbezirks-Werte enthalten nur Urne-Stimmen. Brief-Stimmen werden separat
			erfasst und nur in Bezirks- und Berlin-Aggregaten verrechnet, weil ein
			Briefwahlbezirk keine räumliche Zuordnung im Stimmbezirks-Schnitt hat.
		</p>
		<p>
			Auf der Stimmbezirks-Ebene visualisiert ein dezenter Schraffur-Streifen rechts am
			Stacked-Bar diese Unsicherheits-Zone.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">Geometrien</h2>
		<p>
			Stimmbezirks-Geometrien sind ab 2016 (AGH/BVV) bzw. 2017 (BTW) verfügbar
			(Quelle Amt für Statistik). Pre-2017 BTW und pre-2011 AGH/BVV fehlen
			komplett, Kiez-Aggregat ist für diese Wahlen leer.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">Wiederholungswahlen</h2>
		<p>
			AGH 2021 + BVV 2021 wurden vom Berliner Verfassungsgerichtshof teilweise für
			ungültig erklärt. AGH 2023 und BVV 2023 sind Wiederholungswahlen und in der
			Datenbank mit Verweis auf die jeweilige Original-Wahl gekennzeichnet.
		</p>
	</section>

	<section
		class="space-y-3 border-t border-rule pt-6 text-sm text-ink-muted font-serif italic"
		data-testid="wahl-methodik-stub-notice"
	>
		<p>
			Diese Seite ist ein Foundation-Stub. Vollständige Methodik mit Schema-Drift-
			Analysen, Parteien-Alias-Tabelle und Spalten-Mapping kommt mit Story 6.9.
		</p>
	</section>

	<a
		href="/wahl"
		class="inline-block font-mono text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
	>
		Zurück zur Wahl-Übersicht
	</a>
</article>
