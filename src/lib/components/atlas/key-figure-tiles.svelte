<!--
	L4: Kennzahl-Kacheln unter dem Hero von Kiez- und Bezirksseiten.
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
	}

	const { figures, regionName, kind, slug }: Props = $props();

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
		class="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-8"
	>
		<h2 id="key-figures-h" class="font-serif text-2xl text-ink">{m.key_figures_heading()}</h2>
		<p class="font-sans text-sm text-ink-muted">{m.key_figures_intro()}</p>
		<ul data-testid="key-figure-list" class="grid grid-cols-2 gap-3 md:grid-cols-3">
			{#each tiles as tile (tile.figure.id)}
				<li
					data-testid="key-figure-tile"
					data-figure={tile.figure.id}
					class="flex flex-col gap-1 rounded-md border border-rule p-3 font-sans"
				>
					<h3 class="text-sm font-semibold text-ink">{tile.title}</h3>
					<p data-testid="key-figure-value" class="text-2xl text-ink">
						{#if tile.valueText}
							{tile.valueText}
						{:else}
							<span class="text-base text-ink-muted">{m.key_figure_value_missing()}</span>
						{/if}
					</p>
					<p class="text-sm text-ink-muted">{tile.berlinText}</p>
					<p class="text-xs text-ink-muted">{tile.note}</p>
					<a
						href={tile.href}
						onclick={() => trackLanding('key_figure', kind)}
						data-testid="key-figure-link"
						class="hover:text-accent-strong mt-auto pt-1 text-sm text-accent underline underline-offset-2"
					>
						<span class="sr-only">{tile.context} </span>{m.key_figure_link_visible()}
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
