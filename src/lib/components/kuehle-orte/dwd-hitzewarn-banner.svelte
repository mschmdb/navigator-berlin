<script lang="ts">
	import { TriangleAlert, ExternalLink } from '@lucide/svelte';
	import type { HeatWarning } from '$lib/data/dwd-warnung.types.js';

	// Story 16.2: Live-DWD-Hitzewarnung. Ganzes Banner in {#if warning} → kein Layout-Sprung
	// bei Normallage. Stufe als Text (nicht nur Farbe), DWD-Quelle immer sichtbar (GeoNutzV).
	let { warning }: { warning: HeatWarning | null } = $props();

	const toneClass = $derived(
		warning?.level === 'extrem'
			? 'border-state-error/30 bg-state-error/12 text-state-error'
			: 'border-state-warning/30 bg-state-warning/12 text-state-warning'
	);
</script>

{#if warning}
	<div
		role="status"
		aria-live="polite"
		data-testid="dwd-hitzewarn-banner"
		class={`flex items-start gap-2.5 rounded border px-3 py-2.5 ${toneClass}`}
	>
		<TriangleAlert size={20} aria-hidden="true" class="mt-0.5 shrink-0" />
		<div class="flex flex-col gap-0.5">
			<span class="font-sans text-sm font-semibold" data-testid="dwd-level">{warning.label}</span>
			<span class="font-serif text-sm text-ink">{warning.headline}</span>
			<a
				href={warning.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex w-fit items-center gap-1 font-sans text-xs underline underline-offset-2"
				data-testid="dwd-source"
			>
				<ExternalLink size={11} aria-hidden="true" />
				{warning.source}
			</a>
		</div>
	</div>
{/if}
