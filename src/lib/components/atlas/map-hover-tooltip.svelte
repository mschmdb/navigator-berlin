<script lang="ts" module>
	export type HoverPoint = { x: number; y: number };
	export type HoverEvent = { point: HoverPoint };

	export interface HoverFeature {
		readonly layer: { readonly id: string };
		readonly properties: Record<string, unknown> | null;
	}

	export interface MapHoverApi {
		on: (event: 'mousemove' | 'mouseleave', handler: (e: HoverEvent) => void) => void;
		off: (event: 'mousemove' | 'mouseleave', handler: (e: HoverEvent) => void) => void;
		queryRenderedFeatures: (
			point: HoverPoint,
			opts: { layers: string[] }
		) => readonly HoverFeature[];
		/** Optionaler Layer-Existence-Check; defensive Filter gegen Race-Condition. */
		getLayer?: (id: string) => unknown | undefined;
	}
</script>

<script lang="ts">
	import {
		buildHoverTooltipContent,
		pickTopmostHover,
		slugFromLayerId,
		type HoverTooltipContent
	} from './internal/hover-tooltip-logic.js';
	import { layerIdFor } from './internal/layer-diff.js';

	type Props = {
		map: MapHoverApi | null;
		activeLayerSlugs: readonly string[];
		isMobile?: boolean;
	};

	let { map, activeLayerSlugs, isMobile = false }: Props = $props();

	let visible = $state(false);
	let pos = $state<HoverPoint>({ x: 0, y: 0 });
	let content = $state<HoverTooltipContent | null>(null);

	const layerIds = $derived(activeLayerSlugs.map((s) => layerIdFor(s)));

	function onMouseMove(e: HoverEvent): void {
		if (!map) return;
		// Defensive Filter: queryRenderedFeatures wirft wenn LayerID fehlt (Race waehrend
		// Symbol-Sprite-Loading oder Layer-Add-Cycle). map.getLayer ist falsy bei missing.
		const existing = map.getLayer ? layerIds.filter((id) => Boolean(map.getLayer!(id))) : layerIds;
		if (existing.length === 0) {
			visible = false;
			return;
		}
		const features = map.queryRenderedFeatures(e.point, { layers: existing });
		const topmost = pickTopmostHover(features);
		if (!topmost) {
			visible = false;
			return;
		}
		const slug = slugFromLayerId(topmost.layer.id);
		if (!slug) {
			visible = false;
			return;
		}
		content = buildHoverTooltipContent(slug, topmost.properties);
		pos = { x: e.point.x, y: e.point.y };
		visible = true;
	}

	let leaveTimer: ReturnType<typeof setTimeout> | null = null;

	function onMouseLeave(): void {
		if (leaveTimer) clearTimeout(leaveTimer);
		leaveTimer = setTimeout(() => {
			visible = false;
			leaveTimer = null;
		}, 300);
	}

	$effect(() => {
		if (isMobile || !map || activeLayerSlugs.length === 0) return;
		map.on('mousemove', onMouseMove);
		map.on('mouseleave', onMouseLeave);
		return () => {
			map.off('mousemove', onMouseMove);
			map.off('mouseleave', onMouseLeave);
			if (leaveTimer) clearTimeout(leaveTimer);
		};
	});
</script>

{#if visible && content && !isMobile}
	<div
		data-testid="map-hover-tooltip"
		data-slug={content.slug}
		data-variant={content.kind}
		role="tooltip"
		aria-live="polite"
		class="pointer-events-none absolute z-30 max-w-xs border border-rule bg-bg-elevated/95 px-2.5 py-1.5 text-xs text-ink shadow-lg backdrop-blur-sm"
		style="left: {pos.x + 12}px; top: {pos.y + 12}px;"
	>
		{#if content.kind === 'poi'}
			<p class="font-serif text-sm font-semibold text-ink" data-testid="poi-popover-title">
				{content.poiTitle ?? content.layerName}
			</p>
			{#if content.poiSubtitle}
				<p class="font-sans text-xs leading-snug text-ink-muted" data-testid="poi-popover-subtitle">
					{content.poiSubtitle}
				</p>
			{/if}
			<p
				class="mt-1 font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
				data-testid="poi-popover-hint"
			>
				{content.hint}
			</p>
		{:else}
			<p class="font-serif text-sm font-semibold text-ink">{content.layerName}</p>
			<p class="font-mono text-xs text-ink" data-testid="hover-tooltip-value">
				{content.valueText}
			</p>
			{#if content.shortExplain}
				<p
					class="font-serif text-[11px] leading-snug text-ink-muted italic"
					data-testid="hover-tooltip-explain"
				>
					{content.shortExplain}
				</p>
			{/if}
			<p class="mt-1 font-sans text-[10px] tracking-wide text-ink-subtle uppercase">
				{content.hint}
			</p>
		{/if}
	</div>
{/if}
