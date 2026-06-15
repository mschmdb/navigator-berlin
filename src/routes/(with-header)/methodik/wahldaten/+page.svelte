<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const pageTitle = 'Methodik · Wahldaten · navigator.berlin';
	const pageDescription =
		'Wahldaten-Methodik: Quellen, Daten-Cutoff, Briefwahl, Stimmbezirks-zu-Kiez-Aggregation und Wiederholungswahlen im Berliner Daten-Atlas.';

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

<SeoHead title={pageTitle} description={pageDescription} {origin} {pathname} locales={['de']} />

<JsonLd data={breadcrumbs} />

<article
	class="mx-auto prose max-w-3xl space-y-8 px-4 py-8 prose-stone"
	data-testid="wahl-methodik-page"
>
	<header class="space-y-2">
		<p class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			<a href="/" class="underline-offset-2 hover:text-ink hover:underline">Berlin</a>
			·
			<a href="/methodik" class="underline-offset-2 hover:text-ink hover:underline">Methodik</a>
		</p>
		<h1
			class="font-sans text-2xl font-bold break-words hyphens-auto text-ink sm:text-3xl"
			lang="de"
		>
			Methodik · Wahldaten
		</h1>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			Diese Seite dokumentiert Datenquellen, Aggregations-Strategie und bekannte Coverage-Lücken der
			Wahl-Daten. Werte beschreiben Stimmenanteile, keine Bewertung.
		</p>
	</header>

	<nav aria-label="Inhalt" class="space-y-1 font-mono text-xs text-ink-muted">
		<p class="tracking-wide uppercase">Inhalt</p>
		<ol class="space-y-0.5">
			<li>
				<a href="#datenquellen" class="underline-offset-2 hover:text-ink hover:underline"
					>1. Datenquellen</a
				>
			</li>
			<li>
				<a href="#cutoff" class="underline-offset-2 hover:text-ink hover:underline"
					>2. Daten-Cutoff</a
				>
			</li>
			<li>
				<a href="#wahldaten-briefwahl" class="underline-offset-2 hover:text-ink hover:underline"
					>3. Briefwahl-Asymmetrie</a
				>
			</li>
			<li>
				<a href="#aggregation" class="underline-offset-2 hover:text-ink hover:underline"
					>4. Stimmbezirks-zu-Kiez-Aggregation</a
				>
			</li>
			<li>
				<a href="#wiederholungswahl" class="underline-offset-2 hover:text-ink hover:underline"
					>5. Wiederholungswahl 2023</a
				>
			</li>
			<li>
				<a href="#geometrien" class="underline-offset-2 hover:text-ink hover:underline"
					>6. Geometrien + Coverage</a
				>
			</li>
			<li>
				<a href="#update-cadence" class="underline-offset-2 hover:text-ink hover:underline"
					>7. Update-Cadence</a
				>
			</li>
			<li>
				<a href="#parteien-alias" class="underline-offset-2 hover:text-ink hover:underline"
					>8. Parteien-Aliase</a
				>
			</li>
			<li>
				<a href="#cross-layer" class="underline-offset-2 hover:text-ink hover:underline"
					>9. Cross-Layer-Verknüpfung</a
				>
			</li>
		</ol>
	</nav>

	<section id="datenquellen" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">1. Datenquellen</h2>
		<dl class="space-y-3">
			<dt class="font-medium text-ink">Bundestagswahlen</dt>
			<dd class="text-ink-muted">
				Bundeswahlleiterin Wahlbezirksstatistik (<code class="font-mono text-xs">_wbz.zip</code>).
				Direkt-Bezug pro Wahl-Jahr von
				<a
					href="https://www.bundeswahlleiterin.de"
					rel="noopener noreferrer"
					class="hover:text-accent-strong text-accent underline underline-offset-2"
					>bundeswahlleiterin.de</a
				>. Lizenz Datenlizenz Deutschland Namensnennung 2.0.
			</dd>
			<dt class="font-medium text-ink">Abgeordnetenhaus + BVV</dt>
			<dd class="text-ink-muted">
				Amt für Statistik Berlin-Brandenburg, XLSX-Sheet-Pipeline (<code class="font-mono text-xs"
					>DL_BE_*.xlsx</code
				>). Bezug von
				<a
					href="https://www.statistik-berlin-brandenburg.de"
					rel="noopener noreferrer"
					class="hover:text-accent-strong text-accent underline underline-offset-2"
					>statistik-berlin-brandenburg.de</a
				>. Lizenz Datenlizenz Deutschland Namensnennung 2.0.
			</dd>
			<dt class="font-medium text-ink">Stimmbezirks-Geometrien</dt>
			<dd class="text-ink-muted">
				Amt für Statistik Berlin-Brandenburg, Shapefile-Releases pro Wahlgang:
				<code class="font-mono text-xs">RBS_OD_Wahlgebiete_BTW17.zip</code>,
				<code class="font-mono text-xs">RBS_OD_UWB_AH21.zip</code> u. a. Reprojektion von ETRS89 UTM33
				nach WGS84 via mapshaper-Pipeline, Simplify visvalingam + keep-shapes.
			</dd>
		</dl>
	</section>

	<section id="cutoff" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">2. Daten-Cutoff</h2>
		<p>
			Aktuell ist Phase 1 mit Wahlen ab 2011 abgedeckt. Pre-2011-Daten liegen bei der
			Bundeswahlleiterin teilweise in unterschiedlichen Formaten vor und erfordern Mapping zur
			Bezirksreform 2001. Reaktivierung als FragDenStaat-Backlog für Phase 2.
		</p>
		<ul class="space-y-1">
			<li><strong>Bundestagswahlen:</strong> 2013, 2017, 2021, 2025</li>
			<li><strong>Abgeordnetenhauswahlen:</strong> 2011, 2016, 2021, 2023 (Wiederholung)</li>
			<li>
				<strong>Bezirksverordneten-Versammlungen:</strong> 2011, 2016, 2021, 2023 (Wiederholung)
			</li>
			<li><strong>Europawahlen:</strong> Phase 2 Backlog, aktuell nicht enthalten</li>
			<li><strong>Volksentscheide:</strong> out-of-scope Phase 1</li>
		</ul>
	</section>

	<section id="wahldaten-briefwahl" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">3. Briefwahl-Asymmetrie</h2>
		<p>
			Stimmbezirks-Werte enthalten Urne-Stimmen plus eine räumliche Zuteilung der Briefstimmen,
			sofern die jeweilige Wahlleitung diese Zuordnung publiziert. In den Berliner
			Wahlbezirks-Datensätzen vor 2021 sind Briefstimmen ausschließlich als separater
			Brief-Wahlbezirks-Aggregat erfasst, der keinen räumlichen Bezug zu den Urnenwahl-Stimmbezirken
			besitzt.
		</p>
		<p>
			Konsequenz für die Aggregation: auf den Ebenen Bezirk und Berlin sind alle abgegebenen Stimmen
			enthalten. Auf Stimmbezirks-Ebene fehlen die Brief- Stimmen pre-2021, weswegen Inspector +
			Stimmbezirks-Choropleth in dieser Konstellation einen dezenten Schraffur-Streifen und einen
			Inline-Badge zeigen (siehe Story 6.5).
		</p>
		<p>
			Für 2021+ verteilen die Wahlleitungen Briefstimmen auf Brief-Wahlbezirks- Distrikte, die
			räumlich auf Stimmbezirks-Ebene mit-ausgewiesen werden. Die Asymmetrie entfällt damit ab BTW
			2021 / AGH 2021 / BVV 2021.
		</p>
	</section>

	<section id="aggregation" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">4. Stimmbezirks-zu-Kiez-Aggregation</h2>
		<p>
			Stimmbezirks-Werte werden räumlich auf vier Ebenen aggregiert: Stimmbezirk, Kiez
			(LOR-Bezirksregion), Bezirk (12) und Berlin gesamt.
		</p>
		<p>
			Für die Kiez-Ebene wird pro Stimmbezirk der Polygon-Centroid berechnet (via turf-center) und
			in die enthaltene LOR-Bezirksregion gemappt (booleanPointInPolygon). Stimmbezirke außerhalb
			aller LOR-Polygone bleiben ungemappt und fließen nur in Bezirk + Berlin ein. Die
			SQL-Aggregation summiert pro Kiez und Partei aus den Roh-Stimmbezirks-Rows (siehe
			scripts/build-wahl-kiez-aggregat.ts).
		</p>
		<p>
			Brief-Wahlbezirks-Rows (<code class="font-mono text-xs">ist_briefwahl_aggregat = true</code>)
			werden für das Kiez-Aggregat ausgeschlossen, weil sie keinen räumlichen Bezug haben. Sie
			zählen ausschließlich für Bezirk und Berlin gesamt.
		</p>
	</section>

	<section id="wiederholungswahl" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">5. Wiederholungswahl 2023</h2>
		<p>
			AGH 2021 + BVV 2021 wurden vom Berliner Verfassungsgerichtshof teilweise für ungültig erklärt.
			AGH 2023 und BVV 2023 sind die jeweiligen Wiederholungswahlen. In der Datenbank tragen sie das
			Flag
			<code class="font-mono text-xs">is_repeat_election</code> mit Verweis auf die jeweilige
			Original-Wahl über
			<code class="font-mono text-xs">parent_election_id</code>.
		</p>
		<p>
			Die Wahlbezirks-Geometrie der Wiederholungswahl ist identisch zur Original- Wahl von Sept
			2021. Die separate SBB-Quelle
			<code class="font-mono text-xs">RBS_OD_Wahllokale_AH23.zip</code>
			enthält ausschließlich Wahllokal-Standorte (Punkte), nicht Wahlbezirks- Polygone; deshalb mappt
			navigator.berlin AGH 2023 und BVV 2023 für Choropleth + Kiez-Aggregation auf den Polygon-Layer
			<code class="font-mono text-xs">ah21</code>.
		</p>
	</section>

	<section id="geometrien" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">6. Geometrien + Coverage</h2>
		<p>
			Stimmbezirks-Polygone sind verfügbar für: BTW 2017, 2021, 2025 sowie AGH + BVV 2016 und 2021
			(verwendet auch für 2023-Wiederholung). Pre-2017 BTW und pre-2011 AGH/BVV besitzen keine
			publizierten Stimmbezirks-Geometrien. Diese Wahlen sind ausschließlich auf Bezirks- und
			Berlin-Aggregat zugänglich; das Kiez-Aggregat ist für sie leer und die Choropleth-Komponente
			fällt auf 12 Bezirks-Polygone zurück mit einem Inline-Hinweis.
		</p>
		<p>
			Reprojektion: ETRS89 UTM33 → WGS84 via mapshaper Node-API, Simplify visvalingam + <code
				class="font-mono text-xs">keep-shapes</code
			> (Memory project_simplify_keep_shapes) damit Sliver-Polygone den Simplify-Schritt überleben.
		</p>
	</section>

	<section id="update-cadence" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">7. Update-Cadence</h2>
		<p>
			Wahldaten werden manuell nach jedem Wahlgang aktualisiert. Es gibt keinen Live-Refresh aus den
			Quell-APIs, weil die offiziellen Endgültige-Ergebnisse erst Wochen nach dem Wahltag vorliegen
			und die Bundeswahlleiterin / SBB ihre Datensätze nicht via stabile API ausspielen.
		</p>
		<p>
			Build-Pipeline: <code class="font-mono text-xs">pnpm data:wahl-fetch</code>
			lädt + parsed Roh-Daten, <code class="font-mono text-xs">pnpm data:wahl-geo</code>
			rebuilded Stimmbezirks-Layer, <code class="font-mono text-xs">pnpm data:wahl-kiez</code>
			rebuildet das Kiez-Aggregat. Lint-Gate
			<code class="font-mono text-xs">pnpm lint:wahl</code> blockt Wertungsvokabel in Code + Doku.
		</p>
	</section>

	<section id="parteien-alias" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">8. Parteien-Aliase</h2>
		<p>
			Parteien-Namen variieren über die Jahre (PDS → Die Linke, GRÜNE in Schreibvarianten). Eine
			case-insensitive Alias-Tabelle in
			<code class="font-mono text-xs">scripts/wahlen/lib/partei-seed.ts</code>
			resolvt Quell-Spalten zu kanonischen
			<code class="font-mono text-xs">kurzname</code>-Werten. Nicht-aufgelöste Eintragungen landen
			unter „Sonstige" und werden im Inspector nicht in Top-N geführt.
		</p>
	</section>

	<section id="cross-layer" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">9. Cross-Layer-Verknüpfung</h2>
		<p>
			Wahl-Daten werden in Kiez-Pages (siehe Wahl-Verlauf-Block) und im Adress-Inspector mit anderen
			Layern (Mietspiegel-Wohnlage, Lärmkartierung, Mietspiegel-Soziale-Stufe, Kiez-Score)
			nebeneinander angezeigt, ohne kausale Verknüpfung oder wertendes Framing. Editorial-
			Richtlinien dazu im
			<a
				href="/methodik/cross-layer-templates"
				class="hover:text-accent-strong text-accent underline underline-offset-2"
				>Cross-Layer-Templates-Preview</a
			>
			(noindex, Co-Design-Stage).
		</p>
	</section>

	<a
		href="/wahl"
		class="hover:text-accent-strong inline-block font-mono text-sm text-accent underline underline-offset-2"
	>
		Zurück zur Wahl-Übersicht
	</a>
</article>
