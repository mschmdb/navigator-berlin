<!--
	Story 2.11 T3: Open-Block — Daten-Quellen-Vertrauens-Sektion auf der
	Landing. Listet 6 zentrale offene Daten-Anbieter mit Lizenz-Marker
	damit Besucher sofort sehen: alles nachvollziehbar, alles offen.

	Story 2.12 ersetzt durch `src/lib/content/home-data-sources.ts` (6-10
	dynamisch); bis dahin hardcoded.
-->
<script lang="ts">
	interface Source {
		readonly name: string;
		readonly description: string;
		readonly license: string;
	}

	const SOURCES: readonly Source[] = [
		{
			name: 'ODIS Berlin',
			description: 'Open Data Informationsstelle · Bezirks- und LOR-Geometrien.',
			license: 'dl-de/zero-2-0'
		},
		{
			name: 'SenMVKU · Umweltatlas',
			description: 'Lärmkartierung, Klima-Atlas, Grünversorgung, Bioklima.',
			license: 'dl-de/zero-2-0'
		},
		{
			name: 'OpenStreetMap',
			description: 'Adress-Geocoding, POI-Daten, Routing-Graph.',
			license: 'ODbL 1.0'
		},
		{
			name: 'BVG · GTFS-VBB',
			description: 'ÖPNV-Halte aus dem GTFS-Export des VBB.',
			license: 'CC BY 4.0'
		},
		{
			name: 'SenStadt · Mietspiegel',
			description: 'Wohnlagen 2024 + Monitoring Soziale Stadtentwicklung 2025.',
			license: 'dl-de/zero-2-0'
		},
		{
			name: 'Geoportal Berlin · FIS-Broker',
			description: 'Denkmal-Datenbank, Bauleitplanung, Grundstückswerte.',
			license: 'dl-de/zero-2-0'
		}
	];
</script>

<section data-testid="home-open-block" class="space-y-6">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink">Wir nutzen offene Daten</h2>
		<p class="font-serif text-base text-ink-muted">
			Alle Aggregate hier basieren auf öffentlichen Datensätzen mit Open-Data-Lizenz. Kein
			Scraping geschlossener Quellen, kein Inkasso-Abo, keine Werbung.
		</p>
	</header>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each SOURCES as s (s.name)}
			<li class="space-y-1 border-l-2 border-rule pl-4">
				<p class="font-serif text-base font-semibold text-ink">{s.name}</p>
				<p class="font-serif text-sm text-ink-muted">{s.description}</p>
				<p class="font-mono text-xs uppercase tracking-wider text-ink-subtle">
					{s.license}
				</p>
			</li>
		{/each}
	</ul>
	<a
		class="inline-flex font-mono text-xs uppercase tracking-wider text-accent hover:text-ink"
		href="/lizenzen"
	>
		Alle 38 Quellen + Lizenzen
	</a>
</section>
