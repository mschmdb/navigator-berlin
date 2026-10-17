<!--
	Story 2.11 T2: Layer-Teasers für die Home-Landing.

	5 Editorial-fixed Layer-Slugs mit Kurzbeschreibung. Story 2.12 ersetzt
	`TEASERS`-Liste durch `src/lib/content/home-layer-teasers.ts` mit
	redaktionellem Lead-Text pro Slug; bis dahin Placeholder-Strings.
-->
<script lang="ts">
	import { Volume2, TreePine, Thermometer, Train, Home, Landmark, FileText } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { lineItem, lineList, lineRow } from './internal/line-list.js';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import {
		HOME_LAYER_TEASERS,
		homeLayerTeaserLabel,
		homeLayerTeaserSummary,
		type LayerTeaserIconKey
	} from '$lib/content/home-layer-teasers.js';

	interface Props {
		/** Aktive Geo-Layer gesamt (aus MANIFEST via Server-Load → bleibt nie stale). */
		readonly layerCount?: number;
	}
	const { layerCount }: Props = $props();
	const total = $derived(layerCount ?? HOME_LAYER_TEASERS.length);

	const ICON_MAP: Record<LayerTeaserIconKey, Component> = {
		'volume-2': Volume2,
		'tree-pine': TreePine,
		thermometer: Thermometer,
		train: Train,
		home: Home,
		landmark: Landmark,
		'file-text': FileText
	};
</script>

<section data-testid="home-layer-teasers" class="space-y-6">
	<header class="space-y-2">
		<h2 class="text-2xl font-bold text-ink md:text-3xl">
			{(total === 1 ? m.home_layer_teasers_heading_singular : m.home_layer_teasers_heading_plural)({
				count: total
			})}
		</h2>
		<p class="text-base text-ink-muted">
			{m.home_layer_teasers_lead()}
		</p>
	</header>
	<ul class="{lineList} sm:grid-cols-2">
		{#each HOME_LAYER_TEASERS as t (t.slug)}
			{@const Icon = ICON_MAP[t.iconKey]}
			<li class={lineItem}>
				<a href={localizedHref(`/layer/${t.slug}`)} class={lineRow}>
					<span class="flex items-center gap-2 font-semibold">
						<Icon size={16} aria-hidden="true" />
						{homeLayerTeaserLabel(t.slug)}
					</span>
					<span class="text-sm leading-snug text-ink-muted">{homeLayerTeaserSummary(t.slug)}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
