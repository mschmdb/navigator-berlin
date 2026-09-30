<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	const stages = [
		{ label: 'Source', detail: m.methodik_pipeline_stage_source_detail() },
		{ label: 'fetch', detail: 'WFS-Pull · Overpass-Query' },
		{ label: 'reproject', detail: 'EPSG:3035 → EPSG:4326' },
		{ label: 'simplify', detail: 'mapshaper visvalingam · keep-shapes' },
		{ label: 'hash', detail: 'SHA-256' },
		{ label: 'manifest', detail: 'MANIFEST.json' },
		{ label: 'build', detail: 'SvelteKit · prerender' },
		{ label: 'edge', detail: 'CDN · Hetzner' }
	];
</script>

<figure
	data-testid="methodik-pipeline-diagram"
	aria-label={m.methodik_pipeline_figure_aria_label()}
	class="border border-rule bg-bg p-4"
>
	<ol
		class="flex flex-wrap items-center gap-x-2 gap-y-3 font-mono text-xs text-ink"
		aria-label={m.methodik_pipeline_steps_aria_label()}
	>
		{#each stages as stage, i (stage.label)}
			<li class="flex items-center gap-2">
				<span class="border border-rule bg-bg-elevated px-2 py-1">
					<strong class="font-sans font-semibold text-ink">{stage.label}</strong>
					<span class="text-ink-muted"> · {stage.detail}</span>
				</span>
				{#if i < stages.length - 1}
					<span aria-hidden="true" class="text-ink-subtle">→</span>
				{/if}
			</li>
		{/each}
	</ol>
	<figcaption class="mt-3 font-mono text-xs text-ink-subtle">
		{m.methodik_pipeline_figcaption()}
	</figcaption>
</figure>
