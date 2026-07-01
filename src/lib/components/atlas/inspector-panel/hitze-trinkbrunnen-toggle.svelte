<!--
	Hitze-Modus: Trinkbrunnen sind eine Abkühl-Kategorie neben den kühlen Orten.
	Der reduzierte Inspector zeigt den nächsten Trinkbrunnen mit Weg dorthin (Navi-Links
	aus den Koordinaten, OSM liefert keine Adresse) und blendet den Layer auf der Karte ein.
-->
<script lang="ts">
	import { Eye, EyeOff, Droplet, Navigation } from '@lucide/svelte';
	import { getLayerExplainEntry } from './internal/layer-explain.js';
	import {
		findNearestTrinkbrunnen,
		type Trinkbrunnen
	} from '$lib/data/get-trinkbrunnen-index.js';
	import { formatDistanceDe } from './internal/format-distance.js';

	const SLUG = 'trinkbrunnen';

	type Props = {
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		address?: { lat: number; lng: number } | null;
		index?: readonly Trinkbrunnen[] | null;
	};

	let { isActive = false, onToggleLayer, address = null, index = null }: Props = $props();

	const explain = getLayerExplainEntry(SLUG);

	const nearest = $derived(address && index ? findNearestTrinkbrunnen(address, index) : null);

	function badges(b: Trinkbrunnen): string {
		const parts: string[] = [];
		if (b.kostenlos) parts.push('kostenlos');
		if (b.bottle) parts.push('Flaschen auffüllen');
		if (b.wheelchair === 'yes') parts.push('barrierefrei');
		else if (b.wheelchair === 'limited') parts.push('teils barrierefrei');
		return parts.slice(0, 2).join(' · ');
	}
</script>

<section
	data-testid="hitze-trinkbrunnen-toggle"
	data-layer={SLUG}
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
>
	<h4 class="flex min-w-0 items-center gap-1.5 font-sans text-sm font-semibold text-ink">
		<Droplet size={15} aria-hidden="true" class="shrink-0 text-[#0277BD]" />
		Trinkbrunnen
	</h4>
	<p class="mt-0.5 font-serif text-sm leading-snug text-ink-muted">{explain.short}</p>

	{#if nearest}
		{@const badgeText = badges(nearest)}
		<div class="mt-2 border-t border-rule pt-2" data-testid="trinkbrunnen-nearest">
			<div class="flex items-baseline justify-between gap-2">
				<span class="min-w-0 truncate font-sans text-sm font-medium text-ink">
					Nächster: {nearest.name}
				</span>
				<span class="shrink-0 font-mono text-xs text-ink-subtle tabular-nums">
					{formatDistanceDe(nearest.distanceM)}
				</span>
			</div>
			{#if badgeText}
				<p class="mt-0.5 font-mono text-[11px] text-ink-muted">{badgeText}</p>
			{/if}
			<div class="mt-1 flex flex-wrap gap-3">
				<a
					href={nearest.googleMapsUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
				>
					<Navigation size={11} aria-hidden="true" /> Google Maps
				</a>
				<a
					href={nearest.appleMapsUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
				>
					<Navigation size={11} aria-hidden="true" /> Apple Maps
				</a>
			</div>
		</div>
	{/if}

	{#if onToggleLayer}
		<button
			type="button"
			data-testid="trinkbrunnen-map-toggle"
			aria-pressed={isActive}
			onclick={() => onToggleLayer?.(SLUG)}
			class={`mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 font-sans text-sm font-medium transition-colors ${
				isActive
					? 'border-accent bg-accent/10 text-accent hover:bg-accent/15'
					: 'border-rule text-ink hover:border-ink-subtle hover:bg-bg'
			}`}
		>
			{#if isActive}
				<EyeOff size={14} aria-hidden="true" />
				Trinkbrunnen ausblenden
			{:else}
				<Eye size={14} aria-hidden="true" />
				Trinkbrunnen einblenden
			{/if}
		</button>
	{/if}
</section>
