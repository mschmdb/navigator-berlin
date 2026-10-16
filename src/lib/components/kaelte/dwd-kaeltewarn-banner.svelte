<script lang="ts">
	import { Snowflake, ExternalLink } from '@lucide/svelte';
	import type { ColdEvent, ColdLevel, ColdWarning } from '$lib/data/dwd-warnung.types.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	// Issue #60: Live-DWD-Kältewarnungen. Ganzes Banner in {#if} → kein Layout-Sprung bei
	// Normallage. Stufe als Text (nicht nur Farbe), DWD-Quelle immer sichtbar (GeoNutzV).
	let { warnings }: { warnings: ColdWarning[] } = $props();

	const EVENT_LABELS: Record<ColdEvent, () => string> = {
		'strenger-frost': () => m.dwd_kaelte_event_strenger_frost(),
		'markante-glaette': () => m.dwd_kaelte_event_markante_glaette(),
		glatteis: () => m.dwd_kaelte_event_glatteis(),
		'extremes-glatteis': () => m.dwd_kaelte_event_extremes_glatteis(),
		schneefall: () => m.dwd_kaelte_event_schneefall(),
		'starker-schneefall': () => m.dwd_kaelte_event_starker_schneefall(),
		'extrem-starker-schneefall': () => m.dwd_kaelte_event_extrem_starker_schneefall(),
		schneeverwehung: () => m.dwd_kaelte_event_schneeverwehung(),
		'starke-schneeverwehung': () => m.dwd_kaelte_event_starke_schneeverwehung(),
		'extrem-starke-schneeverwehung': () => m.dwd_kaelte_event_extrem_starke_schneeverwehung()
	};

	const LEVEL_MEANINGS: Record<ColdLevel, () => string> = {
		2: () => m.dwd_kaelte_level_meaning_2(),
		3: () => m.dwd_kaelte_level_meaning_3(),
		4: () => m.dwd_kaelte_level_meaning_4()
	};

	// Fehlt die DWD-Headline (`null`), zeigen wir das übersetzte Ereignis. Echter DWD-Text ist
	// immer deutsch und bleibt unverändert.
	const items = $derived(
		warnings.map((w) => {
			const label = EVENT_LABELS[w.event]();
			return {
				key: w.event,
				label,
				level: `${m.dwd_kaelte_level({ level: w.level })} · ${LEVEL_MEANINGS[w.level]()}`,
				headline: w.headline ?? label,
				headlineLang: w.headline !== null && getLocale() !== 'de' ? 'de' : undefined
			};
		})
	);

	const highest = $derived(warnings.reduce((max, w) => Math.max(max, w.level), 0));
	const toneClass = $derived(
		highest >= 3
			? 'border-state-error/30 bg-state-error/12 text-state-error'
			: 'border-state-warning/30 bg-state-warning/12 text-state-warning'
	);
	const source = $derived(warnings[0]);
</script>

{#if source}
	<div
		role="status"
		aria-live="polite"
		aria-label={m.dwd_kaelte_region_label()}
		data-testid="dwd-kaeltewarn-banner"
		class={`flex items-start gap-2.5 rounded border px-3 py-2.5 ${toneClass}`}
	>
		<Snowflake size={20} aria-hidden="true" class="mt-0.5 shrink-0" />
		<div class="flex flex-col gap-2">
			<ul class="flex flex-col gap-2">
				{#each items as item (item.key)}
					<li class="flex flex-col gap-0.5" data-testid="dwd-kaelte-warnung">
						<span class="font-sans text-sm font-semibold">
							<span data-testid="dwd-kaelte-event">{item.label}</span>
							<span aria-hidden="true">·</span>
							<span data-testid="dwd-kaelte-level">{item.level}</span>
						</span>
						<span class="font-serif text-sm text-ink" lang={item.headlineLang}>{item.headline}</span
						>
					</li>
				{/each}
			</ul>
			<a
				href={source.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex w-fit items-center gap-1 font-sans text-xs underline underline-offset-2"
				data-testid="dwd-kaelte-source"
			>
				<ExternalLink size={11} aria-hidden="true" />
				{m.dwd_kaelte_source()}
				<span class="sr-only"> {m.kaelte_new_tab_hint()}</span>
			</a>
		</div>
	</div>
{/if}
