<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';

	type Props = {
		fetchedAt: string;
		sectorName?: string;
	};

	let { fetchedAt, sectorName }: Props = $props();
</script>

<section
	data-testid="mauer-sektoren-detail"
	data-osm-sourced="true"
	class="flex flex-col gap-2"
>
	{#if sectorName}
		<h4 class="font-serif text-base font-semibold text-ink">
			{sectorName}
		</h4>
	{/if}
	<p class="font-serif italic text-sm text-ink-muted">
		Historischer Stand: Berliner Mauer 1961 bis 1989. Geometrie aus OpenStreetMap-Community-Daten.
	</p>
	<a
		data-testid="mauer-source-link"
		href="https://www.berlin-mauer.de/"
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex w-fit items-center gap-1 text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
	>
		<ExternalLink size={12} aria-hidden="true" />
		<span>Berliner Mauer Gedenkstätte</span>
	</a>
	<p data-testid="mauer-footer" class="font-mono text-xs text-ink-subtle">
		Quelle: OpenStreetMap · Stand: {fetchedAt}
	</p>
</section>
