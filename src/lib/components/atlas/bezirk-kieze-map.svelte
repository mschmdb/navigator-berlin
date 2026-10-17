<!--
	L5: Statische SVG-Karte der Kieze (Inhalt des Rahmens `hero-map-card`) eines Bezirks, eingefärbt nach Kiez-Score
	(Klassen und Palette des Score-Layers). Kein MapLibre. Für Hilfstechnik ist die Karte
	ein benanntes Bild ohne Inhalt; die Kiez-Liste darunter ist die gleichwertige
	Alternative. Die Grafik selbst ist aria-hidden und ohne Rolle: axe meldet jede
	role="img" mit Links darin als nested-interactive, auch mit tabindex="-1" (#103).
	Die Kiez-Links sind reine Mausziele ohne Tab-Stopp, Name und Score stehen als
	<title>-Tooltip. Die Kontur sichert 3:1 gegen den Hintergrund.
-->
<script lang="ts">
	import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';
	import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { hasRenderableOutline } from './internal/has-renderable-outline.js';
	import { NO_SCORE_FILL, scoreClassFill } from './internal/score-class-color.js';

	interface Props {
		readonly outline: RegionOutline | null;
		readonly kieze: readonly KiezListEntry[];
		readonly bezirkName: string;
	}

	const { outline, kieze, bezirkName }: Props = $props();

	const uid = $props.id();
	const legendId = `${uid}-legend`;
	const localeOpts = $derived({ locale: getLocale() });
	const bySlug = $derived(new Map(kieze.map((k) => [k.slug, k])));

	const entries = $derived(
		(outline?.paths ?? []).flatMap((p) => {
			const kiez = bySlug.get(p.id);
			if (!kiez) return [];
			const label =
				kiez.composite === null
					? m.bezirk_map_kiez_label_no_score({ name: kiez.name }, localeOpts)
					: m.bezirk_map_kiez_label({ name: kiez.name, score: kiez.composite }, localeOpts);
			return [
				{
					slug: kiez.slug,
					d: p.d,
					label,
					fill: scoreClassFill(kiez.composite),
					href: localizedHref(`/kiez/${kiez.slug}`)
				}
			];
		})
	);

	const legend = $derived([
		{ fill: scoreClassFill(10), text: m.bezirk_map_legend_class_1(undefined, localeOpts) },
		{ fill: scoreClassFill(30), text: m.bezirk_map_legend_class_2(undefined, localeOpts) },
		{ fill: scoreClassFill(60), text: m.bezirk_map_legend_class_3(undefined, localeOpts) },
		{ fill: scoreClassFill(90), text: m.bezirk_map_legend_class_4(undefined, localeOpts) },
		{ fill: NO_SCORE_FILL, text: m.bezirk_map_legend_none(undefined, localeOpts) }
	]);
</script>

{#if outline && hasRenderableOutline(outline, bySlug.keys())}
	<div class="flex flex-col gap-3" data-testid="bezirk-kieze-map">
		<div
			role="img"
			aria-label={m.bezirk_map_aria({ bezirk: bezirkName }, localeOpts)}
			class="sr-only"
		></div>
		<svg
			viewBox={outline.viewBox}
			aria-hidden="true"
			class="block h-auto max-h-32 w-full sm:max-h-80"
			preserveAspectRatio="xMinYMid meet"
		>
			{#each entries as entry (entry.slug)}
				<a
					href={entry.href}
					tabindex="-1"
					onclick={() => trackLanding('map_link', 'bezirk')}
					class="kiez-link"
					data-testid="bezirk-map-link"
					data-slug={entry.slug}
				>
					<title>{entry.label}</title>
					<path
						d={entry.d}
						fill={entry.fill}
						stroke="var(--rule-strong)"
						stroke-width="2"
						stroke-linejoin="round"
						fill-rule="evenodd"
					/>
				</a>
			{/each}
		</svg>
		<div class="space-y-1">
			<p id={legendId} class="sr-only">
				{m.bezirk_map_legend_label(undefined, localeOpts)}
			</p>
			<ul
				class="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 font-sans text-sm text-ink-muted"
				aria-labelledby={legendId}
				data-testid="bezirk-map-legend"
			>
				{#each legend as item (item.text)}
					<li class="flex items-center gap-1.5">
						<span
							class="inline-block size-3.5 shrink-0 border border-rule-strong"
							style:background-color={item.fill}
							aria-hidden="true"
						></span>
						{item.text}
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	.kiez-link path {
		transition: stroke-width 0.1s;
	}
	.kiez-link:hover path {
		stroke: var(--ink);
		stroke-width: 4;
	}
</style>
