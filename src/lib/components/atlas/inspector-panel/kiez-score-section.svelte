<script lang="ts">
	import { Eye, EyeOff, ExternalLink } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import KiezScoreDimensionRow from './kiez-score-dimension-row.svelte';
	import KiezScoreRing from '../charts/kiez-score-ring.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { COMPOSITE_DIMENSIONS } from '$lib/data';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	const GESAMT_SLUG = 'kiez-score-gesamt';

	type Props = {
		score: KiezScore | null;
		methodikHref?: string;
		lang?: Locale;
		activeLayerSlugs?: readonly string[];
		onToggleLayer?: (slug: string) => void;
	};
	let {
		score,
		methodikHref = '/methodik/kiez-score',
		lang,
		activeLayerSlugs = [],
		onToggleLayer
	}: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const gesamtActive = $derived(activeLayerSlugs.includes(GESAMT_SLUG));
	const gesamtHref = $derived(localizedHref(`/layer/${GESAMT_SLUG}`, locale));

	const enabled = $derived(featureFlags.kiezScore && score !== null);
	// Option C: der Gesamt-Score ist das Mittel der fünf Composite-Dimensionen (Kultur zählt
	// nicht hinein). Der Zähler bezieht sich daher nur auf die Composite-Dimensionen.
	const usedDimsCount = $derived.by(() => {
		if (!score) return 0;
		return score.dimensions.filter(
			(d) => d.value !== null && COMPOSITE_DIMENSIONS.includes(d.dimension)
		).length;
	});

	let expandedDim = $state<KiezScoreDimension | null>(null);

	function toggleDim(dim: KiezScoreDimension): void {
		expandedDim = expandedDim === dim ? null : dim;
	}
</script>

{#if enabled && score}
	<section data-testid="kiez-score-section" class="space-y-3">
		<h3
			class="font-mono text-xs tracking-wide text-ink-muted uppercase"
			data-testid="kiez-score-section-header"
		>
			{m.inspector_kiez_score_heading(undefined, localeOpts)}
		</h3>

		{#if score.overall !== undefined}
			<div class="flex flex-col items-center gap-1 pb-1" data-testid="kiez-score-overall">
				<KiezScoreRing {score} onSegmentClick={toggleDim} />
				<span
					class="font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
					data-testid="kiez-score-overall-meta"
				>
					{m.inspector_kiez_score_overall_meta(
						{ used: String(usedDimsCount), total: String(COMPOSITE_DIMENSIONS.length) },
						localeOpts
					)}
				</span>
				<div class="flex items-center gap-1" data-testid="kiez-score-overall-actions">
					{#if onToggleLayer}
						<button
							type="button"
							data-testid="kiez-score-map-toggle-gesamt"
							aria-pressed={gesamtActive}
							aria-label={gesamtActive
								? m.inspector_kiez_score_map_toggle_remove_gesamt(undefined, localeOpts)
								: m.inspector_kiez_score_map_toggle_add_gesamt(undefined, localeOpts)}
							title={gesamtActive
								? m.inspector_common_map_toggle_remove_title(undefined, localeOpts)
								: m.inspector_common_map_toggle_add_title(undefined, localeOpts)}
							onclick={() => onToggleLayer?.(GESAMT_SLUG)}
							class={`inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-bg ${gesamtActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
						>
							{#if gesamtActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
									size={14}
									aria-hidden="true"
								/>{/if}
						</button>
					{/if}
					<a
						href={gesamtHref}
						data-testid="kiez-score-learn-more-gesamt"
						aria-label={m.inspector_kiez_score_learn_more_gesamt_aria(undefined, localeOpts)}
						title={m.inspector_common_learn_more_title(undefined, localeOpts)}
						class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-ink-subtle hover:bg-bg hover:text-ink"
					>
						<ExternalLink size={13} aria-hidden="true" />
					</a>
				</div>
			</div>
		{/if}

		<div class="divide-y divide-rule">
			{#each score.dimensions as dim (dim.dimension)}
				<KiezScoreDimensionRow
					score={dim}
					open={expandedDim === dim.dimension}
					onToggle={toggleDim}
					lang={locale}
					isActive={activeLayerSlugs.includes(`kiez-score-${dim.dimension}`)}
					{onToggleLayer}
				/>
			{/each}
		</div>

		<EditorialDisclaimer variant="kiez-score-explainer" />
		<a
			href={localizedHref(methodikHref, locale)}
			data-testid="kiez-score-methodik-link"
			class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
		>
			{m.inspector_kiez_score_methodik_link(undefined, localeOpts)}
		</a>
	</section>
{/if}
