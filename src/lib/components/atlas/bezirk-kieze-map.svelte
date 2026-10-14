<!--
	L5: Statische SVG-Karte der Kieze eines Bezirks, eingefärbt nach Kiez-Score
	(Klassen und Palette des Score-Layers). Kein MapLibre. Jeder Kiez ist ein Link
	mit sprechendem Namen; die Kiez-Liste daneben ist die gleichwertige
	Textalternative. Die Karten-Links liegen nicht in der Tab-Reihenfolge, die
	Liste erreicht dieselben Seiten per Tastatur; Mausklick bleibt ein Link. Die Kontur sichert 3:1 gegen den Hintergrund.
-->
<script lang="ts">
	import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';
	import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { NO_SCORE_FILL, scoreClassFill } from './internal/score-class-color.js';

	interface Props {
		readonly outline: RegionOutline | null;
		readonly kieze: readonly KiezListEntry[];
		readonly bezirkName: string;
	}

	const { outline, kieze, bezirkName }: Props = $props();

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

{#if outline && entries.length > 0}
	<figure class="m-0 flex flex-col gap-2" data-testid="bezirk-kieze-map">
		<svg
			viewBox={outline.viewBox}
			role="img"
			aria-label={m.bezirk_map_aria({ bezirk: bezirkName }, localeOpts)}
			class="block h-auto max-h-40 w-full sm:max-h-80"
			preserveAspectRatio="xMidYMid meet"
		>
			{#each entries as entry (entry.slug)}
				<a
					href={entry.href}
					tabindex="-1"
					onclick={() => trackLanding('map_link', 'bezirk')}
					aria-label={entry.label}
					class="kiez-link"
					data-testid="bezirk-map-link"
					data-slug={entry.slug}
				>
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
		<figcaption>
			<ul
				class="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 font-sans text-sm text-ink-muted"
				aria-label={m.bezirk_map_legend_label(undefined, localeOpts)}
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
		</figcaption>
	</figure>
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
