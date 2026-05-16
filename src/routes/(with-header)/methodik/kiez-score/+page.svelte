<script lang="ts">
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';

	const pageTitle = 'Wo lebt es sich gut? · Methodik des Kiez-Scores · navigator.berlin';
	const pageDescription =
		'Wie der Kiez-Score aus fünf Dimensionen pro Planungsraum entsteht. Ruhe & Luft, Grün, Mobilität, Soziale Lage, Versorgung. Gewichte, Normalisierung, was bewusst fehlt.';

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
			layers: 'laerm-2023, luft-2023, bioklima-2023 · Fallback umweltgerechtigkeit-2023',
			detail:
				'Lärm- und Luftbelastung (Gewicht je 0.4) plus thermische Belastung (0.2). Kategorisches 3-Stufen-Mapping (gering bis hoch). Fehlen alle drei Roh-Layer, greift der Umweltgerechtigkeits-Aggregat als Fallback.'
		},
		{
			id: 'gruen',
			label: 'Grün',
			layers: 'gruenversorgung-2023, klima-kaltlufteinwirkbereich-2022, klima-leitbahnkorridor-2022',
			detail:
				'Pro-Kopf-Grünversorgung pro Planungsraum (Gewicht 0.6) plus Kaltluft-Einwirkbereich und Leitbahnkorridor (je 0.2). Vier-Stufen-Skala für Grünversorgung harmonisiert mit Story 1.22.'
		},
		{
			id: 'mobilitaet',
			label: 'Mobilität',
			layers: 'U-Bahn-, S-Bahn-, Tram-, Bus-Stops · radverkehrsnetz-2025, fahrradstrassen-2024',
			detail:
				'Luftlinien-Distanz vom Adress-Punkt zur nächsten Haltestelle, mit 1,3-fachem Umwegfaktor. U-Bahn 0.35, S-Bahn 0.25, Tram 0.20, Bus 0.10, Radverkehrs-Presence 0.10. Bei 0 m hundert Punkte, bei 1.000 m null. Mobilität nutzt die exakte Adress-Distance, andere Dimensionen Planungsraum-Centroid.'
		},
		{
			id: 'soziale-lage',
			label: 'Soziale Lage',
			layers: 'mss-gesamtindex-2025 (Senatsverwaltung Stadtentwicklung Berlin)',
			detail:
				'Status-Achse des Monitoring Soziale Stadtentwicklung 2025 pro Planungsraum (sehr niedrig bis hoch). Planungsräume mit „kom != gültig" (unter 300 Einwohner:innen oder Ausreißer) bleiben ohne Wert. Einzel-Indikatoren wie Arbeitslosen-Quote oder Transferbezug bewusst nicht ausgespielt. Niedriger Status bedeutet nicht „schlechter Kiez", sondern strukturelle Unterschiede.'
		},
		{
			id: 'versorgung',
			label: 'Versorgung',
			layers: 'kitas-2024, schulen-2024, krankenhaeuser-plan, spielplaetze, gruenanlagen',
			detail:
				'Distance vom Planungsraum-Centroid zu nächster Kita (Gewicht 0.25, Threshold 500 m), Schule (0.25, 800 m), Plan-Krankenhaus (0.20, 2.000 m), Spielplatz (0.15, 400 m) und Grünanlage (0.15, 600 m). Polygon-Layer (Spielplätze, Grünanlagen) kollabieren zum Geometrie-Mittelpunkt. Belegungsquote, Trägerschaft und Pflege-Qualität bleiben außen vor.'
		}
	];

	const omissions = [
		{
			label: 'Bezahlbarkeit',
			reason:
				'Politisch sensibel und ambivalent. Hohe Bodenrichtwerte oder gut bewertete Wohnlagen bedeuten teure Miete, nicht schlechte Wohnqualität. Mietspiegel-Werte liefert mietspiegel.berlin.de.'
		},
		{
			label: 'Familienfreundlichkeit',
			reason:
				'Hängt stark von Persona ab (Eltern mit Kita-Kind, Schulkind, Pflegebedarf). Kita-, Schul- und Krankenhaus-Layer bleiben separat im Inspector statt in einer Composite-Dimension zu verschwinden.'
		},
		{
			label: 'Hitze-Resilienz als eigene Dimension',
			reason:
				'PET-Werte (Story 1.25) variieren stark auf Block-Ebene und wären in einer LOR-Aggregation unscharf. Kaltluft und Leitbahn fließen in Grün ein.'
		},
		{
			label: 'Composite-Single-Score',
			reason:
				'Keine einzelne „Wo lebt es sich gut?"-Zahl auf der Karte. Wer Familie sucht, gewichtet anders als jemand mit Hitze-Empfindlichkeit. Persönliche Prioritäten lassen sich nicht aggregieren.'
		}
	];
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
</svelte:head>

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
			Wo lebt es sich gut?
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			Methodik des Kiez-Scores. Fünf Dimensionen pro Planungsraum, gleich gewichtet, transparent
			zurückverfolgbar.
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
			Der Kiez-Score ist kein „Berlin-Ranking". Die Karte zeigt vier Dimensionen separat pro
			Planungsraum, der Inspector aggregiert sie für eine konkrete Adresse. Was zutrifft, steht
			dort. Was fehlt oder bewusst weggelassen ist, sagen wir auch.
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
				<tr><td class="px-3 py-2">Grün</td><td class="px-3 py-2 font-mono">0.20</td></tr>
				<tr><td class="px-3 py-2">Mobilität</td><td class="px-3 py-2 font-mono">0.20</td></tr>
				<tr><td class="px-3 py-2">Soziale Lage</td><td class="px-3 py-2 font-mono">0.20</td></tr>
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
			<dt class="font-mono text-xs text-ink-muted">MSS Status</dt>
			<dd class="text-ink">sehr niedrig 0, niedrig 33, mittel 66, hoch 100</dd>
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
			Stigma-Schutz: kein Composite-Choropleth auf der Karte. Die einzelne Bezirks-Zahl zeigt sich
			nur in Steckbrief-Tabellen und im Ranking, immer mit Disclaimer. Pro Dimension darf eine
			Choropleth gezeigt werden (Story 1.31 Familie-Mapping). Soziale Lage bleibt Strukturell-Indigo
			ohne Rot-Grün-Sprünge.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Build-Pipeline: <code class="font-mono text-sm">pnpm data:aggregate-scores</code> liest die
			Planungsraum-Quelle, baut die LOR-Hierarchie und schreibt die Aggregate idempotent in die
			Postgres-Tabellen <code class="font-mono text-sm">bezirk_score</code> und
			<code class="font-mono text-sm">kiez_score</code>. Details unter
			<a
				href="https://github.com/MatzeKitt/navigator.berlin/blob/main/docs/scoring-methodology.md"
				class="text-accent underline underline-offset-2 hover:text-accent-strong">
				docs/scoring-methodology.md
			</a>.
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
			Der Kiez-Score ist statistische Lage-Beschreibung, keine Wohnungsbewertung. Wir nennen keinen
			Mietpreis und geben keine rechtliche Auskunft.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			Die Dimension Soziale Lage spiegelt strukturelle MSS-Daten, keine Wohnqualität. Choropleth-
			Farben sind neutral, keine Rot-Grün-Sprünge, keine Severity-Wertung. Einzel-Indikatoren des
			MSS-Datensatzes bleiben bewusst hinter dem Aggregat. Einzelne Adressen können stark vom
			Planungsraum-Mittel abweichen.
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
