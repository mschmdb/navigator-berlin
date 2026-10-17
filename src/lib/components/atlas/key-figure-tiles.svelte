<!--
	L4: Kennzahlen auf Kiez- und Bezirksseiten, seit #90 als Zeilen mit Linie statt Kacheln.
	Je Kachel: Wert, Berlin-Wert und Link auf /explore mit dem Layer und dem Ortsfokus.
	Neutrale Darstellung: keine Gut/Schlecht-Farben (Stigma-Lock, ADR-014).
-->
<script lang="ts">
	import type { KeyFigure, KeyFigureId } from '$lib/data/region-key-figures.js';
	import { buildRegionFocusHref } from '$lib/utils/url-state.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { formatPercent } from '$lib/i18n/format.js';
	import {
		formatLayerValue,
		translateClosedCategory
	} from './inspector-panel/internal/value-formatters.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		readonly figures: readonly KeyFigure[];
		readonly regionName: string;
		readonly kind: 'kiez' | 'bezirk';
		readonly slug: string;
		/** false, wenn die Liste in einem Container mit eigenem Rand steht (Kiez-Seite, #90). */
		readonly inset?: boolean;
	}

	const { figures, regionName, kind, slug, inset = true }: Props = $props();

	const locale = $derived(getLocale());

	const TITLES: Record<KeyFigureId, () => string> = {
		bestandsmiete: () => m.key_figure_bestandsmiete_title(),
		altbau: () => m.key_figure_altbau_title(),
		laerm: () => m.key_figure_laerm_title(),
		gruen: () => m.key_figure_gruen_title(),
		hitze: () => m.key_figure_hitze_title(),
		milieuschutz: () => m.key_figure_milieuschutz_title()
	};

	const NOTES: Record<KeyFigureId, () => string> = {
		bestandsmiete: () => m.key_figure_bestandsmiete_note(),
		altbau: () => m.key_figure_altbau_note(),
		laerm: () => m.key_figure_laerm_note(),
		gruen: () => m.key_figure_gruen_note(),
		hitze: () => m.key_figure_hitze_note(),
		milieuschutz: () => m.key_figure_milieuschutz_note()
	};

	function formatNumber(figure: KeyFigure, value: number): string {
		const opts = { locale };
		switch (figure.id) {
			case 'bestandsmiete':
				return formatLayerValue(figure.layer, { miete: value }, opts).text;
			case 'altbau':
				return formatLayerValue(figure.layer, { altbau_anteil: value }, opts).text;
			case 'hitze':
				return formatLayerValue(figure.layer, { pet14h: value }, opts).text;
			default:
				return formatPercent(value / 100, { locale, decimals: 1 });
		}
	}

	function formatFigure(figure: KeyFigure, own: boolean): string | null {
		if (figure.unit === 'level') {
			const level = own ? figure.level : figure.berlinLevel;
			return level
				? m.key_figure_level_dominant({ level: translateClosedCategory(level, { locale }) })
				: null;
		}
		const value = own ? figure.value : figure.berlin;
		return value === null ? null : formatNumber(figure, value);
	}

	const tiles = $derived(
		figures.map((figure) => {
			const title = TITLES[figure.id]();
			return {
				figure,
				title,
				note: NOTES[figure.id](),
				valueText: formatFigure(figure, true),
				berlinText: (() => {
					const berlin = formatFigure(figure, false);
					return berlin === null
						? m.key_figure_berlin_missing()
						: m.key_figure_berlin({ value: berlin });
				})(),
				href: localizedHref(buildRegionFocusHref(kind, slug, [figure.layer])),
				context: m.key_figure_link_context({ title, region: regionName })
			};
		})
	);
</script>

{#if figures.length > 0}
	<section
		data-testid="key-figures"
		aria-labelledby="key-figures-h"
		class={inset ? 'mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-8' : 'flex flex-col gap-3'}
	>
		<h2 id="key-figures-h" class="text-2xl font-bold text-ink">{m.key_figures_heading()}</h2>
		<p class="font-sans text-sm text-ink-muted">{m.key_figures_intro()}</p>
		<ul data-testid="key-figure-list" class="flex flex-col border-t border-rule">
			{#each tiles as tile (tile.figure.id)}
				<li
					data-testid="key-figure-tile"
					data-figure={tile.figure.id}
					class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-rule py-3 font-sans"
				>
					<h3 class="text-base font-semibold text-ink">{tile.title}</h3>
					<p
						data-testid="key-figure-value"
						class="text-right text-base font-semibold text-ink tabular-nums"
					>
						{#if tile.valueText}
							{tile.valueText}
						{:else}
							<span class="font-normal text-ink-muted">{m.key_figure_value_missing()}</span>
						{/if}
					</p>
					<p class="text-sm text-ink-muted">{tile.note}</p>
					<p class="text-right text-sm text-ink-muted tabular-nums">{tile.berlinText}</p>
					<a
						href={tile.href}
						onclick={() => trackLanding('key_figure', kind)}
						data-testid="key-figure-link"
						class="col-span-2 inline-flex min-h-(--target-min) w-fit items-center text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
					>
						<span class="sr-only">{tile.context} </span>{m.key_figure_link_visible()}
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
