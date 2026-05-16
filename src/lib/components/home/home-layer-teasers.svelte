<!--
	Story 2.11 T2: Layer-Teasers für die Home-Landing.

	5 Editorial-fixed Layer-Slugs mit Kurzbeschreibung. Story 2.12 ersetzt
	`TEASERS`-Liste durch `src/lib/content/home-layer-teasers.ts` mit
	redaktionellem Lead-Text pro Slug; bis dahin Placeholder-Strings.
-->
<script lang="ts">
	import { Volume2, TreePine, Thermometer, Train, Home } from '@lucide/svelte';

	interface Teaser {
		readonly slug: string;
		readonly label: string;
		readonly summary: string;
		readonly icon: typeof Volume2;
	}

	const TEASERS: readonly Teaser[] = [
		{
			slug: 'laerm-2023',
			label: 'Lärm 2023',
			summary:
				'Strategische Lärmkartierung Berlin. Ordinal-Kategorien pro Planungsraum statt dB-Punkt-Werte.',
			icon: Volume2
		},
		{
			slug: 'gruenversorgung-2023',
			label: 'Grünversorgung 2023',
			summary:
				'Wohnungsnahe Grünfläche pro Person, klassifiziert pro Planungsraum. Senatsverwaltung Stadtentwicklung.',
			icon: TreePine
		},
		{
			slug: 'klima-pet-2022',
			label: 'Klima PET 2022',
			summary:
				'Gefühlte Mittagstemperatur an Sommer-Hitzetagen aus dem Berliner Klima-Atlas.',
			icon: Thermometer
		},
		{
			slug: 'oepnv-composite',
			label: 'ÖPNV-Halte',
			summary:
				'Bus, Tram, U-Bahn, S-Bahn aggregiert. Haltedichte pro Quadratkilometer als grober Anbindungs-Indikator.',
			icon: Train
		},
		{
			slug: 'wohnlagen-2024',
			label: 'Wohnlagen 2024',
			summary:
				'Wohnlage-Klasse aus dem Berliner Mietspiegel-Verfahren (einfach / mittel / gut), block-genau.',
			icon: Home
		}
	];
</script>

<section data-testid="home-layer-teasers" class="space-y-6">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink">Datenquellen im Atlas</h2>
		<p class="font-serif text-base text-ink-muted">
			Fünf von 38 Datenquellen, die im Atlas zusammenkommen. Pro Quelle Methodik,
			Lizenz, Stand-Datum verlinkt.
		</p>
	</header>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each TEASERS as t (t.slug)}
			<li class="rounded border border-rule p-4">
				<a
					href={`/layer/${t.slug}`}
					class="flex flex-col gap-2 text-ink hover:text-accent"
				>
					<span class="flex items-center gap-2">
						<t.icon size={16} aria-hidden="true" />
						<span class="font-mono text-xs uppercase tracking-wider">{t.label}</span>
					</span>
					<span class="font-serif text-base leading-snug">{t.summary}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
