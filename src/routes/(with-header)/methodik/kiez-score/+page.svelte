<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildBreadcrumbList, buildSpeakableWebPage } from '$lib/seo/index.js';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';

	const pageTitle =
		'Methodik des Umwelt- & Infrastruktur-Scores - Berlin in Daten - navigator.berlin';
	const pageDescription =
		'Kiez-Score-Methodik: fünf Dimensionen, Normalisierung, Gewichte. Warum Sozialstruktur nicht eingerechnet wird. Berliner Daten-Atlas.';

	const sections = [
		{ id: 'worum', label: 'Worum es geht' },
		{ id: 'dimensionen', label: 'Dimensionen' },
		{ id: 'gewichte', label: 'Gewichte' },
		{ id: 'normalisierung', label: 'Normalisierung' },
		{ id: 'kiez-score', label: 'Kiez-Score (Bezirksregion)' },
		{ id: 'bezirks-score', label: 'Bezirks-Score' },
		{ id: 'fehlt', label: 'Was fehlt und warum' },
		{ id: 'quellen', label: 'Datenquellen' },
		{ id: 'editorial', label: 'Editorial-Verantwortung' },
		{ id: 'feedback', label: 'Feedback' }
	];

	const dimensions = [
		{
			id: 'ruhe-luft',
			label: 'Ruhe & Luft',
			layers: 'laerm-2023, luft-2023',
			detail:
				'Lärm- und Luftbelastung, je zur Hälfte gewichtet. Kategorisches 3-Stufen-Mapping von gering bis hoch. Bioklima zählt nicht mehr hier mit, es ist nach Grün & Hitze gewandert.'
		},
		{
			id: 'gruen-hitze',
			label: 'Grün & Hitze',
			layers:
				'gruenversorgung-2023, gruenanlagen, bioklima-2023, klima-pet-2022, klima-kaltlufteinwirkbereich-2022, klima-leitbahnkorridor-2022',
			detail:
				'Nutzbares Grün und Schutz vor Hitze. Grünversorgung 0.30, Grünanlagen-Nähe 0.15, Bioklima 0.20, PET-Hitzebelastung 0.15, Kaltluft-Einwirkbereich 0.10, Leitbahnkorridor 0.10. PET zählt invertiert: kühlere Werte geben mehr Punkte.'
		},
		{
			id: 'mobilitaet',
			label: 'Mobilität',
			layers: 'U-Bahn-, S-Bahn-, Tram-, Bus-Stops · radverkehrsnetz-2025, fahrradstrassen-2024',
			detail:
				'Luftlinien-Distanz vom Adress-Punkt zur nächsten Haltestelle, mit 1,3-fachem Umwegfaktor. U-Bahn 0.35, S-Bahn 0.25, Tram 0.20, Bus 0.10, Radverkehrs-Presence 0.10. Bei 0 m hundert Punkte, bei 1.000 m null. Mobilität nutzt die exakte Adress-Distance, andere Dimensionen den Planungsraum-Centroid.'
		},
		{
			id: 'versorgung',
			label: 'Versorgung',
			layers: 'kitas-2024, schulen-2024, krankenhaeuser-plan, spielplaetze',
			detail:
				'Distance vom Planungsraum-Centroid zur nächsten Kita (Gewicht 0.30, Threshold 500 m), Schule (0.30, 800 m), Plan-Krankenhaus (0.25, 2.000 m) und Spielplatz (0.15, 400 m). Grünanlagen zählen jetzt unter Grün & Hitze. Belegungsquote, Trägerschaft und Pflege-Qualität bleiben außen vor.'
		},
		{
			id: 'wohnschutz',
			label: 'Wohnschutz',
			layers: 'milieuschutz-erhaltungsmiete, milieuschutz-staedtebau',
			detail:
				'Verdrängungsschutz: Liegt ein Planungsraum in einem Milieuschutzgebiet, gilt Schutz als vorhanden. Erhaltungssatzung Wohnraum oder städtebauliche Erhaltungssatzung, ODER-verknüpft. Diese Größe ist positiv eindeutig, mehr Schutz ist besser für Bewohner. Schutz-Status sagt nichts über die tatsächliche Mietentwicklung.'
		}
	];

	const omissions = [
		{
			label: 'Sozialstruktur',
			reason:
				'Der soziale Status eines Kiezes ist kein Qualitäts-Kriterium. Würden wir ihn werten, schnitten Kieze mit niedrigem Status schlechter ab und würden stigmatisiert. Das MSS-Aggregat bleibt als neutraler Kontext sichtbar, fließt aber nicht in den Score.'
		},
		{
			label: 'Bezahlbarkeit',
			reason:
				'Kontestiert und ambivalent. Hohe Bodenrichtwerte oder gut bewertete Wohnlagen bedeuten teure Miete, nicht schlechte Wohnqualität. Belastbare Adress-Daten fehlen. Mietspiegel-Werte liefert mietspiegel.berlin.de.'
		},
		{
			label: 'Familienfreundlichkeit',
			reason:
				'Hängt stark von der Persona ab: Eltern mit Kita-Kind, Schulkind oder Pflegebedarf gewichten anders. Kita-, Schul- und Krankenhaus-Layer bleiben separat im Inspector statt in einer Composite-Dimension zu verschwinden.'
		}
	];

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Methodik', path: '/methodik' },
				{ name: 'Kiez-Score', path: '/methodik/kiez-score' }
			]
		})
	);

	const speakableJsonLd = $derived(
		buildSpeakableWebPage({
			origin: page.url.origin,
			urlPath: '/methodik/kiez-score',
			name: 'Methodik des Umwelt- & Infrastruktur-Scores',
			cssSelectors: [
				'#worum',
				'#dimensionen',
				'#gewichte',
				'#normalisierung',
				'#fehlt'
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/methodik-kiez-score.png`}
	ogImageAlt="navigator.berlin Kiez-Score Methodik"
/>
<JsonLd data={breadcrumbJsonLd} testid="methodik-kiez-score-breadcrumb-jsonld" />
<JsonLd data={speakableJsonLd} testid="methodik-kiez-score-speakable-jsonld" />

<article
	data-testid="methodik-kiez-score-page"
	class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<nav
			aria-label="Brotkrumen"
			data-testid="methodik-kiez-score-breadcrumb"
			class="font-mono text-xs text-ink-muted"
		>
			<a
				href="/methodik"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>Methodik</a
			>
			<span aria-hidden="true">·</span>
			<span>Kiez-Score</span>
		</nav>
		<h1 data-testid="methodik-kiez-score-h1" class="font-serif text-3xl text-ink">
			Umwelt- & Infrastruktur-Score
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			Fünf Dimensionen pro Planungsraum, gleich gewichtet, transparent zurückverfolgbar. Der Score
			misst Umwelt und Infrastruktur, nicht den sozialen Status.
		</p>
	</header>

	<nav aria-label="Inhalt" class="border border-rule bg-bg p-4">
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

	<section id="worum" aria-labelledby="worum-h" class="flex flex-col gap-3">
		<h2 id="worum-h" class="font-serif text-2xl text-ink">Worum es geht</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Der Umwelt- & Infrastruktur-Score ist kein „Berlin-Ranking". Die Karte zeigt fünf Dimensionen
			separat pro Planungsraum, der Inspector aggregiert sie für eine konkrete Adresse. Was zutrifft,
			steht dort. Was fehlt oder bewusst weggelassen ist, sagen wir auch.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Aggregations-Ebene Planungsraum entspricht rund 7.500 Einwohner:innen. Wohnungs-Mikrolagen
			liegen darunter und tauchen im Aggregat nicht auf.
		</p>
	</section>

	<section id="dimensionen" aria-labelledby="dimensionen-h" class="flex flex-col gap-3">
		<h2 id="dimensionen-h" class="font-serif text-2xl text-ink">Dimensionen</h2>
		<ul class="flex flex-col gap-4">
			{#each dimensions as dim (dim.id)}
				<li class="border-l-2 border-rule pl-3">
					<p class="font-sans text-base font-semibold text-ink">{dim.label}</p>
					<p class="font-mono text-xs text-ink-muted">{dim.layers}</p>
					<p class="mt-1 font-serif text-sm text-ink">{dim.detail}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section id="gewichte" aria-labelledby="gewichte-h" class="flex flex-col gap-3">
		<h2 id="gewichte-h" class="font-serif text-2xl text-ink">Gewichte</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Persona „allgemein" gewichtet die fünf Dimensionen gleich (je 20 Prozent). Persona-Switcher
			für Familie, Single oder Senior:innen liegt in Phase 2. Eigene Slider-Gewichtung kommt
			ebenfalls später.
		</p>
		<table class="border border-rule text-sm">
			<thead class="bg-bg">
				<tr>
					<th class="px-3 py-2 text-left font-mono text-xs uppercase text-ink-muted">Dimension</th>
					<th class="px-3 py-2 text-left font-mono text-xs uppercase text-ink-muted">Gewicht</th>
				</tr>
			</thead>
			<tbody>
				<tr><td class="px-3 py-2">Ruhe & Luft</td><td class="px-3 py-2 font-mono">0.20</td></tr>
				<tr><td class="px-3 py-2">Grün & Hitze</td><td class="px-3 py-2 font-mono">0.20</td></tr>
				<tr><td class="px-3 py-2">Mobilität</td><td class="px-3 py-2 font-mono">0.20</td></tr>
				<tr><td class="px-3 py-2">Wohnschutz</td><td class="px-3 py-2 font-mono">0.20</td></tr>
				<tr><td class="px-3 py-2">Versorgung</td><td class="px-3 py-2 font-mono">0.20</td></tr>
			</tbody>
		</table>
	</section>

	<section id="normalisierung" aria-labelledby="normalisierung-h" class="flex flex-col gap-3">
		<h2 id="normalisierung-h" class="font-serif text-2xl text-ink">Normalisierung</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Jeder Roh-Wert wird in eine 0-bis-100-Skala übersetzt. Höher heißt günstiger.
		</p>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			<dt class="font-mono text-xs text-ink-muted">Ordinal-3</dt>
			<dd class="text-ink">gering 100, mittel 50, hoch 0 (Belastung)</dd>
			<dt class="font-mono text-xs text-ink-muted">Ordinal-4</dt>
			<dd class="text-ink">gering 0, mittel 33, hoch 66, sehr hoch 100 (Versorgung)</dd>
			<dt class="font-mono text-xs text-ink-muted">PET invertiert</dt>
			<dd class="text-ink">29 °C oder kühler 100, 41 °C oder heißer 0, linear dazwischen</dd>
			<dt class="font-mono text-xs text-ink-muted">Distance</dt>
			<dd class="text-ink">linear: 0 m → 100, 1.000 m → 0</dd>
			<dt class="font-mono text-xs text-ink-muted">Presence</dt>
			<dd class="text-ink">vorhanden 100, fehlend 0</dd>
		</dl>
		<p class="font-serif text-base leading-relaxed text-ink">
			Aus den 0-bis-100-Werten innerhalb einer Dimension wird mit den Layer-Gewichten ein
			gewichteter Mittelwert. Der Dimensions-Wert wird in vier UI-Stufen abgebildet: gering (0–25),
			mittel (26–50), hoch (51–75), sehr hoch (76–100).
		</p>
	</section>

	<section id="kiez-score" aria-labelledby="kiez-score-h" class="flex flex-col gap-3">
		<h2 id="kiez-score-h" class="font-serif text-2xl text-ink">Kiez-Score (Bezirksregion)</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Die 542 Planungsraum-Werte werden zu 143 LOR-Bezirksregionen flächen-gewichtet aggregiert. Pro
			Dimension wird ein gewichteter Mittelwert gebildet, wobei jeder Planungsraum mit seiner Fläche
			gewichtet wird. Mindestens 50 Prozent der enthaltenen Planungsräume müssen einen Wert haben,
			sonst bleibt die Dimension ohne Aggregat.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Der Composite-Score einer Bezirksregion entsteht als ungewichtetes Mittel der nicht-null-Werte
			ihrer fünf Dimensionen, parallel zur Adress-Logik.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			LOR-Hierarchie: die ersten sechs Zeichen einer Planungsraum-ID ergeben die Bezirksregion-ID,
			die ersten zwei den Bezirks-Code. Property-basiertes Mapping ohne Geometrie-Test. Falls zwei
			Bezirksregionen denselben Namen tragen, wird der Bezirks-Slug als Suffix angehängt (z.B.
			heerstrasse-spandau, heerstrasse-charlottenburg-wilmersdorf).
		</p>
	</section>

	<section id="bezirks-score" aria-labelledby="bezirks-score-h" class="flex flex-col gap-3">
		<h2 id="bezirks-score-h" class="font-serif text-2xl text-ink">Bezirks-Score</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Auf Bezirks-Ebene werden die 542 Planungsräume direkt flächen-gewichtet aggregiert, nicht über
			die Bezirksregion-Zwischenebene. Damit bleibt das Gewicht jedes Planungsraums proportional zu
			seiner tatsächlichen Fläche und ist unabhängig von der LOR-Zwischengruppierung.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Seit der Score-Neuordnung (ADR-015) sind alle fünf Dimensionen positiv eindeutig. Deshalb
			zeigen wir auch einen Gesamt-Choropleth auf der Karte (Layer „Kiez-Score · Gesamt", Gut-Skala),
			zusätzlich zu den fünf Einzel-Dimensionen. Das MSS-Aggregat bleibt als neutraler Kontext-Layer
			in Strukturell-Indigo, ohne Rot-Grün-Sprünge. Einen stadtweiten „Berlin-Score" gibt es nicht.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Build-Pipeline: <code class="font-mono text-sm">pnpm data:aggregate-scores</code> liest die
			Planungsraum-Quelle, baut die LOR-Hierarchie und schreibt die Aggregate idempotent in die
			Postgres-Tabellen <code class="font-mono text-sm">bezirk_score</code> und
			<code class="font-mono text-sm">kiez_score</code>.
		</p>
	</section>

	<section id="fehlt" aria-labelledby="fehlt-h" class="flex flex-col gap-3">
		<h2 id="fehlt-h" class="font-serif text-2xl text-ink">Was fehlt und warum</h2>
		<ul class="flex flex-col gap-3">
			{#each omissions as o (o.label)}
				<li class="border-l-2 border-rule pl-3">
					<p class="font-sans text-base font-semibold text-ink">{o.label}</p>
					<p class="font-serif text-sm text-ink-muted">{o.reason}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section id="quellen" aria-labelledby="quellen-h" class="flex flex-col gap-3">
		<h2 id="quellen-h" class="font-serif text-2xl text-ink">Datenquellen</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Berliner Umweltatlas (Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt),
			Monitoring Soziale Stadtentwicklung (Senatsverwaltung Stadtentwicklung Berlin) und
			ÖPNV-Standorte aus OpenStreetMap (ODbL 1.0). Vollständige Liste mit Lizenz und Datenstand
			pro Layer:
			<a
				href="/lizenzen"
				class="text-accent underline underline-offset-2 hover:text-accent-strong">/lizenzen</a
			>.
		</p>
	</section>

	<section id="editorial" aria-labelledby="editorial-h" class="flex flex-col gap-3">
		<h2 id="editorial-h" class="font-serif text-2xl text-ink">Editorial-Verantwortung</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Der Score ist statistische Lage-Beschreibung, keine Wohnungsbewertung. Wir nennen keinen
			Mietpreis und geben keine rechtliche Auskunft.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Der Score wertet keine Sozialstruktur. Ein Kiez mit niedrigem Sozialstatus lebt nicht
			„schlechter". Das MSS-Aggregat zeigen wir als neutralen Kontext, nicht als Bewertung.
			Choropleth-Farben dafür bleiben neutral, ohne Rot-Grün-Sprünge. Einzelne Adressen können stark
			vom Planungsraum-Mittel abweichen.
		</p>
	</section>

	<section id="feedback" aria-labelledby="feedback-h" class="flex flex-col gap-3">
		<h2 id="feedback-h" class="font-serif text-2xl text-ink">Feedback</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Methodik-Korrektur, Datenfehler oder Layer-Vorschlag: per Mail.
		</p>
		<p class="font-mono text-sm">
			<a
				href={`mailto:${FEEDBACK_EMAIL}?subject=Kiez-Score-Methodik`}
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>{FEEDBACK_EMAIL}</a
			>
		</p>
	</section>

	<footer class="border-t border-rule pt-4">
		<a
			href="/methodik"
			data-testid="methodik-kiez-score-back-link"
			class="font-mono text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
		>
			Zur Atlas-Methodik
		</a>
	</footer>
</article>
