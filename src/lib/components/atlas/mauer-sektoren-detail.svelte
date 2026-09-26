<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';

	/**
	 * i18n Block B3a (Fundament): Labels als Props mit DE-Default, wie
	 * `address-search`/`KiezScoreRing` (Lehre Block-B2-Review #2) --
	 * `mauer-sektoren-detail` rendert aktuell nur innerhalb von
	 * `layer-hit-row.svelte` (Inspector-Panel, B3b, ruft ohne Props auf und
	 * bleibt damit DE). Kein Boundary-Verstoss: der Baustein selbst ist damit
	 * übersetzungsfähig, sobald B3b ihn mit EN-Labels aufruft.
	 */
	type Props = {
		fetchedAt: string;
		sectorName?: string;
		historicalNoteLabel?: string;
		memorialLinkLabel?: string;
		sourcePrefixLabel?: string;
		sourceLabel?: string;
		standLabel?: string;
	};

	let {
		fetchedAt,
		sectorName,
		historicalNoteLabel = 'Historischer Stand: Berliner Mauer 1961 bis 1989. Geometrie aus OpenStreetMap-Community-Daten.',
		memorialLinkLabel = 'Berliner Mauer Gedenkstätte',
		sourcePrefixLabel = 'Quelle',
		sourceLabel = 'OpenStreetMap',
		standLabel = 'Stand'
	}: Props = $props();
</script>

<section data-testid="mauer-sektoren-detail" data-osm-sourced="true" class="flex flex-col gap-2">
	{#if sectorName}
		<h4 class="font-serif text-base font-semibold text-ink">
			{sectorName}
		</h4>
	{/if}
	<p class="font-serif text-sm text-ink-muted italic">
		{historicalNoteLabel}
	</p>
	<a
		data-testid="mauer-source-link"
		href="https://www.berlin-mauer.de/"
		target="_blank"
		rel="noopener noreferrer"
		class="hover:text-accent-strong inline-flex w-fit items-center gap-1 text-sm text-accent underline underline-offset-2"
	>
		<ExternalLink size={12} aria-hidden="true" />
		<span>{memorialLinkLabel}</span>
	</a>
	<p data-testid="mauer-footer" class="font-mono text-xs text-ink-subtle">
		{sourcePrefixLabel}: {sourceLabel} · {standLabel}: {fetchedAt}
	</p>
</section>
