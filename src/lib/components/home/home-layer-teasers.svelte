<!--
	Story 2.11 T2: Layer-Teasers für die Home-Landing.

	5 Editorial-fixed Layer-Slugs mit Kurzbeschreibung. Story 2.12 ersetzt
	`TEASERS`-Liste durch `src/lib/content/home-layer-teasers.ts` mit
	redaktionellem Lead-Text pro Slug; bis dahin Placeholder-Strings.
-->
<script lang="ts">
	import { Volume2, TreePine, Thermometer, Train, Home, Landmark, FileText } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import {
		HOME_LAYER_TEASERS,
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
		<h2 class="font-serif text-2xl text-ink md:text-3xl">{total} Datensätze</h2>
		<p class="font-serif text-base text-ink-muted">
			Sieben davon hier verkürzt, darunter die neuen Kontext-Schichten Kultur und Kriminalität.
			Pro Schicht eine eigene Detail-Seite mit Methodik, Lizenz und Stand-Datum.
		</p>
	</header>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each HOME_LAYER_TEASERS as t (t.slug)}
			{@const Icon = ICON_MAP[t.iconKey]}
			<li class="rounded border border-rule p-4">
				<a
					href={`/layer/${t.slug}`}
					class="flex flex-col gap-2 text-ink hover:text-accent"
				>
					<span class="flex items-center gap-2">
						<Icon size={16} aria-hidden="true" />
						<span class="font-mono text-xs uppercase tracking-wider">{t.label}</span>
					</span>
					<span class="font-serif text-base leading-snug">{t.summary}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
