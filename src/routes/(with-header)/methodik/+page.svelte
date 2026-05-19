<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildBreadcrumbList } from '$lib/seo/index.js';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import MethodikDatenTabelle from './methodik-daten-tabelle.svelte';
	import MethodikPipelineDiagram from './methodik-pipeline-diagram.svelte';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const manifest = $derived(data.manifest);
	const layerCount = $derived(manifest.layers.length);

	const sections = [
		{ id: 'mission', label: 'Worum es geht' },
		{ id: 'datenarchitektur', label: 'Datenarchitektur' },
		{ id: 'aggregations-ebenen', label: 'Aggregations-Ebenen' },
		{ id: 'cross-layer', label: 'Aggregat-Indizes' },
		{ id: 'wahldaten-section', label: 'Wahldaten' },
		{ id: 'coverage-strategie', label: 'Coverage-Strategie' },
		{ id: 'omissions', label: 'Was wir weglassen' },
		{ id: 'editorial', label: 'Editorial-Verantwortung' },
		{ id: 'daten-stand', label: 'Daten-Stand' },
		{ id: 'lizenzen', label: 'Quellen und Lizenzen' },
		{ id: 'feedback', label: 'Feedback' }
	];

	const pageTitle = 'Methodik - Berlin in Daten - navigator.berlin';
	const pageDescription =
		'Wie navigator.berlin Daten verarbeitet, was wir zeigen, was wir bewusst weglassen.';

	/**
	 * Story 2.2 AC-4: Methodik-Page bleibt bei `TechArticle`. Inline-Object,
	 * weil dieser Generator nicht in der Lib lebt (Methodik ist die einzige
	 * Konsumentin). Typed via JSON-LD-Object-Shape, NICHT via schema-dts-Union.
	 */
	const jsonLd = $derived({
		'@context': 'https://schema.org' as const,
		'@type': 'TechArticle',
		headline: 'Methodik der Daten',
		description: pageDescription,
		datePublished: '2026-05-15',
		dateModified: manifest.generatedAt,
		author: { '@type': 'Organization', name: 'navigator.berlin' }
	});

	const aggregationLevels = [
		{
			level: 'Adress-genau',
			detail: 'Punkt-Geocode + Punkt-Layer (Stolpersteine, Kitas, ÖPNV-Stops)'
		},
		{
			level: 'LOR-Planungsraum (538)',
			detail: 'Lärm, Luft, Bioklima, Grünversorgung, Umweltgerechtigkeit, Wohnlagen-2024'
		},
		{
			level: 'Bezirk (12) und Ortsteil (96)',
			detail: 'Verwaltungs-Stammdaten'
		},
		{
			level: 'Block-Aggregat',
			detail: 'Bodenrichtwerte, Klima-PET, Milieuschutz, Einschulbereiche'
		},
		{
			level: 'Punkt-OSM',
			detail: 'Radverkehrsnetz, Fahrradstraßen, ÖPNV-Stationen, Stolpersteine, Trinkbrunnen'
		}
	];

	const coverageReasons = [
		{ key: 'no-coverage', text: 'Datensatz für diese Adresse nicht verfügbar.' },
		{ key: 'outdated', text: 'Geo-Datensatz älter als 5 Jahre.' },
		{ key: 'seasonal', text: 'Layer aktiv nur in Saison (Trinkbrunnen Mai bis Oktober).' },
		{
			key: 'coverage-out-of-scope',
			text: 'Adresse außerhalb des räumlichen Geltungsbereichs.'
		},
		{
			key: 'out-of-concept',
			text: 'Layer konzeptionell nicht anwendbar (Mietspiegel-Layer in Gewerbe-Lage).'
		}
	];

	const omissions = [
		{
			label: 'Cookies, Tracker, User-Konten',
			reason: 'Keine Browser-Identifikation. Bookmarks liegen im LocalStorage.'
		},
		{
			label: 'Mietpreise',
			reason: 'Wir nennen keinen €/m². Den offiziellen Wert liefert mietspiegel.berlin.de.'
		},
		{
			label: 'Personenbezogene Daten',
			reason: 'Kein Profil, keine Verhaltens-Auswertung, keine Login-Pflicht.'
		},
		{
			label: 'Algorithmisch generierte Layer-Texte',
			reason:
				'Layer-Beschreibungen schreiben wir manuell. Kein LLM-Output für Personen-Biografien.'
		},
		{
			label: 'Composite-Single-Score',
			reason:
				'Kein „Berlin-Lebensqualitäts-Score" als eine Zahl. Persönliche Prioritäten lassen sich nicht aggregieren.'
		},
		{ label: 'Werbung, Partner-Tracking, A/B-Tests', reason: 'Kein kommerzielles Modell.' }
	];

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Methodik', path: '/methodik' }
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/methodik.png`}
	ogImageAlt="navigator.berlin Methodik"
/>

<JsonLd data={jsonLd} testid="methodik-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="methodik-breadcrumb-jsonld" />

<article
	data-testid="methodik-page"
	class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<h1 data-testid="methodik-page-title" class="font-serif text-3xl text-ink">
			Methodik
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			{pageDescription}
		</p>
	</header>

	<nav
		data-testid="methodik-toc"
		aria-label="Inhalt"
		class="border border-rule bg-bg p-4"
	>
		<p class="mb-2 font-mono text-xs uppercase tracking-wide text-ink-subtle">Inhalt</p>
		<ol class="grid gap-1.5 font-sans text-sm sm:grid-cols-2">
			{#each sections as sec (sec.id)}
				<li>
					<a
						href={`#${sec.id}`}
						class="text-accent underline underline-offset-2 hover:text-accent-strong"
					>
						{sec.label}
					</a>
				</li>
			{/each}
		</ol>
	</nav>

	<section id="mission" aria-labelledby="mission-h" class="flex flex-col gap-3">
		<h2 id="mission-h" class="font-serif text-2xl text-ink">Worum es geht</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			navigator.berlin sammelt {layerCount} öffentliche Berliner Geo-Datensätze und zeigt pro
			Adresse die zutreffenden Werte. Statisch ausgeliefert, ohne Cookies, ohne Login, ohne
			Tracker.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Die Idee: Daten lesbar machen, ohne sie zu einem „Wohn-Score" zu verdichten.
			Stadtteil-Statistik bleibt Stadtteil-Statistik. Was an einer Adresse zutrifft, steht im
			Inspector. Was nicht zutrifft, sagen wir auch.
		</p>
	</section>

	<section id="datenarchitektur" aria-labelledby="datenarchitektur-h" class="flex flex-col gap-3">
		<h2 id="datenarchitektur-h" class="font-serif text-2xl text-ink">Datenarchitektur</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Beim Build-Schritt fetchen wir jeden Layer von der Quelle, reprojizieren auf EPSG:4326,
			vereinfachen die Geometrie mit mapshaper und schreiben Hash plus Datenstand ins Manifest.
			Zur Laufzeit liefert ein Punkt-im-Polygon-Lookup pro Adresse die zutreffenden Werte.
			Keine Datenbank, kein API-Call zum Server.
		</p>
		<MethodikPipelineDiagram />
	</section>

	<section
		id="aggregations-ebenen"
		aria-labelledby="aggregations-ebenen-h"
		class="flex flex-col gap-3"
	>
		<h2 id="aggregations-ebenen-h" class="font-serif text-2xl text-ink">Aggregations-Ebenen</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Nicht jeder Wert ist adressgenau. Lärm und Luft stammen aus Stadtteil-Statistiken
			(LOR-Planungsraum, 538 Polygone). Bodenrichtwerte hängen am Häuserblock. Wer im
			Inspector einen Lärm-Wert liest, sieht den Mittelwert für den ganzen Planungsraum, nicht
			das eigene Schlafzimmer.
		</p>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			{#each aggregationLevels as agg (agg.level)}
				<dt class="font-mono text-xs text-ink-muted">{agg.level}</dt>
				<dd class="text-ink">{agg.detail}</dd>
			{/each}
		</dl>
	</section>

	<section id="cross-layer" aria-labelledby="cross-layer-h" class="flex flex-col gap-3">
		<h2 id="cross-layer-h" class="font-serif text-2xl text-ink">Aggregat-Indizes</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Der Kiez-Score fasst pro Planungsraum fünf Dimensionen zusammen: Ruhe und Luft, Grün,
			Mobilität, Soziale Lage und Versorgung (Kitas, Schulen, Krankenhäuser, Spielplätze,
			Grünanlagen). Jede Dimension bleibt separat abrufbar im Inspector und als eigener
			Karten-Layer. Fünf mal 20 Prozent Gewicht, kein Composite-Score auf der Karte.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Es gibt keinen einzelnen „Berlin-Score". Aggregation auf eine Zahl würde Stigmatisierung
			erzeugen und individuelle Prioritäten verschleiern. Wer Familie sucht, gewichtet anders
			als jemand mit Hitze-Empfindlichkeit.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Anti-Doppelzählung: umweltgerechtigkeit-2023 fasst bereits Lärm, Luft, Bioklima und Grün
			zusammen. Indizes zählen es nicht zusätzlich, sondern greifen nur als Coverage-Fallback.
		</p>
		<p class="font-mono text-xs text-ink-muted">
			Vollständige Methodik:
			<a
				href="/methodik/kiez-score"
				data-testid="methodik-kiez-score-link"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>/methodik/kiez-score</a
			>
		</p>
		<h3 class="font-serif text-xl text-ink mt-2">Soziale Lage (MSS 2025)</h3>
		<p class="font-serif text-base leading-relaxed text-ink">
			Das Monitoring Soziale Stadtentwicklung der Senatsverwaltung Berlin liefert pro
			Planungsraum einen Gesamtindex aus Status (Einkommen, Beschäftigung, Bildung) und
			Dynamik (Veränderung). Wir zeigen nur diesen Aggregat-Wert, nicht die Einzel-Indikatoren
			wie Arbeitslosen-Quote oder Transferbezugs-Anteil. Einzelwerte wären auf Adress-Ebene
			schärfer und stigmatisierender.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Niedriger Status bedeutet nicht „schlechter Kiez". Die Stufe spiegelt strukturelle
			Unterschiede, keine Wohnqualität. Choropleth-Farben sind neutral gehalten, kein
			Rot-Grün. Quelle: SenStadt MSS 2025, Lizenz dl-de/zero-2-0.
		</p>
	</section>

	<section
		id="wahldaten-section"
		aria-labelledby="wahldaten-section-h"
		class="flex flex-col gap-3"
	>
		<h2 id="wahldaten-section-h" class="font-serif text-2xl text-ink">Wahldaten</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Bundestags-, Abgeordnetenhaus- und BVV-Wahlen seit 2011 mit Aggregaten auf
			vier Ebenen: Stimmbezirk, Kiez (LOR-Bezirksregion), Bezirk und Berlin gesamt.
			Quellen sind Bundeswahlleiterin (BTW) und Amt für Statistik
			Berlin-Brandenburg (AGH + BVV). Werte beschreiben Stimmenanteile, keine
			Bewertung.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Spezialfälle dokumentieren wir transparent: Briefwahl-Asymmetrie pre-2021
			(Stimmbezirks-Werte ohne Briefstimmen), Wiederholungswahlen 2023 mit
			Original-Wahl-Verweis, Coverage-Lücken pre-2017 ohne Stimmbezirks-Geometrie.
		</p>
		<p class="font-mono text-xs text-ink-muted">
			Vollständige Methodik:
			<a
				href="/methodik/wahldaten"
				data-testid="methodik-wahldaten-link"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>/methodik/wahldaten</a
			>
			·
			<a
				href="/wahl"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>Übersicht aller Wahlen</a
			>
		</p>
	</section>

	<section
		id="coverage-strategie"
		aria-labelledby="coverage-strategie-h"
		class="flex flex-col gap-3"
	>
		<h2 id="coverage-strategie-h" class="font-serif text-2xl text-ink">Coverage-Strategie</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Liefert ein Layer für eine Adresse keinen Wert, nennen wir den Grund.
		</p>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			{#each coverageReasons as reason (reason.key)}
				<dt class="font-mono text-xs text-ink-muted">{reason.key}</dt>
				<dd class="text-ink">{reason.text}</dd>
			{/each}
		</dl>
	</section>

	<section id="omissions" aria-labelledby="omissions-h" class="flex flex-col gap-3">
		<h2 id="omissions-h" class="font-serif text-2xl text-ink">Was wir weglassen</h2>
		<ul class="flex flex-col gap-3">
			{#each omissions as o (o.label)}
				<li class="border-l-2 border-rule pl-3">
					<p class="font-sans text-base font-semibold text-ink">{o.label}</p>
					<p class="font-serif text-sm text-ink-muted">{o.reason}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section id="editorial" aria-labelledby="editorial-h" class="flex flex-col gap-3">
		<h2 id="editorial-h" class="font-serif text-2xl text-ink">Editorial-Verantwortung</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Stolpersteine zeigen wir als Erinnerungs-Marker. Wir zählen sie nicht und werten sie nicht.
			Personen-Biografien gehören zur Primärquelle stolpersteine-berlin.de.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			navigator.berlin nennt keinen Mietpreis und gibt keine rechtliche Auskunft. Den
			gesetzlichen Wohnlagen-Mietspiegel liefert mietspiegel.berlin.de.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Aggregierte Werte sind Stadtteil-Mittel, keine Wohnungs-Eigenschaften. Wir verzichten
			bewusst auf einen „Berlin-Score" und zeigen keine Bezirks-Rankings.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Layer-Texte schreiben wir manuell. Kein Layer-Inhalt wird per LLM zusammengefasst, keine
			Personen-Biografie generiert.
		</p>
	</section>

	<section id="daten-stand" aria-labelledby="daten-stand-h" class="flex flex-col gap-3">
		<h2 id="daten-stand-h" class="font-serif text-2xl text-ink">Daten-Stand</h2>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			Alphabetisch sortiert nach Layer-Name, kein Aktualitäts-Ranking.
		</p>
		<MethodikDatenTabelle layers={manifest.layers} />
	</section>

	<section id="lizenzen" aria-labelledby="lizenzen-h" class="flex flex-col gap-3">
		<h2 id="lizenzen-h" class="font-serif text-2xl text-ink">Quellen und Lizenzen</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Die meisten Layer stehen unter dl-de/zero-2-0 oder dl-de/by-2-0. OSM-basierte Layer
			(Stolpersteine, ÖPNV, Trinkbrunnen, Radverkehr) unter ODbL 1.0 mit Namensnennung
			OpenStreetMap-Contributors.
		</p>
		<p class="font-mono text-xs text-ink-muted">
			Vollständige Auflistung: <a
				href="/lizenzen"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>/lizenzen</a
			>
		</p>
	</section>

	<section id="feedback" aria-labelledby="feedback-h" class="flex flex-col gap-3">
		<h2 id="feedback-h" class="font-serif text-2xl text-ink">Feedback</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Methodik-Korrektur, Datenfehler oder Layer-Vorschlag: per Mail.
		</p>
		<p class="font-mono text-sm">
			<a
				href={`mailto:${FEEDBACK_EMAIL}?subject=Methodik-Feedback`}
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				{FEEDBACK_EMAIL}
			</a>
		</p>
	</section>
</article>
