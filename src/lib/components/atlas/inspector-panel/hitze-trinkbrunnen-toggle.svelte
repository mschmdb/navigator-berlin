<!--
	Hitze-Modus: Trinkbrunnen sind eine Abkühl-Kategorie neben den kühlen Orten.
	Der reduzierte Inspector bietet deshalb einen direkten Weg, den Trinkbrunnen-Layer
	auf der Karte ein- und auszublenden, ohne den vollen Explorer öffnen zu müssen.
-->
<script lang="ts">
	import { Eye, EyeOff, Droplet } from '@lucide/svelte';
	import { getLayerExplainEntry } from './internal/layer-explain.js';

	const SLUG = 'trinkbrunnen';

	type Props = {
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
	};

	let { isActive = false, onToggleLayer }: Props = $props();

	const explain = getLayerExplainEntry(SLUG);
</script>

<section
	data-testid="hitze-trinkbrunnen-toggle"
	data-layer={SLUG}
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<h4 class="flex min-w-0 items-center gap-1.5 font-sans text-sm font-semibold text-ink">
				<Droplet size={15} aria-hidden="true" class="shrink-0 text-[#0277BD]" />
				Trinkbrunnen
			</h4>
			<p class="mt-0.5 font-serif text-sm leading-snug text-ink-muted">{explain.short}</p>
		</div>
		{#if onToggleLayer}
			<button
				type="button"
				data-testid="trinkbrunnen-map-toggle"
				aria-pressed={isActive}
				aria-label={isActive
					? 'Trinkbrunnen von Karte entfernen'
					: 'Trinkbrunnen auf Karte zeigen'}
				title={isActive ? 'Von Karte entfernen' : 'Auf Karte zeigen'}
				onclick={() => onToggleLayer?.(SLUG)}
				class={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-bg ${isActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
			>
				{#if isActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
						size={14}
						aria-hidden="true"
					/>{/if}
			</button>
		{/if}
	</div>
</section>
