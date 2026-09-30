<script lang="ts">
	import { TriangleAlert, ExternalLink } from '@lucide/svelte';
	import type { HeatWarning } from '$lib/data/dwd-warnung.types.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	// Story 16.2: Live-DWD-Hitzewarnung. Ganzes Banner in {#if warning} → kein Layout-Sprung
	// bei Normallage. Stufe als Text (nicht nur Farbe), DWD-Quelle immer sichtbar (GeoNutzV).
	let { warning }: { warning: HeatWarning | null } = $props();

	// Stufe und Quelle sind feste UI-Texte und folgen der Seiten-Locale. Der Warntext
	// (`headline`) kommt live vom DWD und bleibt unverändert. Fehlt die DWD-Headline, setzt
	// der Server das DE-Stufen-Label ein: dann zeigen wir das übersetzte Label.
	const level = $derived(
		warning?.level === 'extrem'
			? m.dwd_banner_level_label_extrem()
			: m.dwd_banner_level_label_stark()
	);
	const isFallbackHeadline = $derived(
		warning !== null && (warning.headline.trim() === '' || warning.headline === warning.label)
	);
	const headline = $derived(isFallbackHeadline ? level : warning?.headline);
	// Live-Text vom DWD ist immer deutsch: auf anderssprachigen Seiten für Screenreader markieren.
	const headlineLang = $derived(!isFallbackHeadline && getLocale() !== 'de' ? 'de' : undefined);

	const toneClass = $derived(
		warning?.level === 'extrem'
			? 'border-state-error/30 bg-state-error/12 text-state-error'
			: 'border-state-warning/30 bg-state-warning/12 text-state-warning'
	);
</script>

{#if warning}
	<div
		role="status"
		aria-live="polite"
		data-testid="dwd-hitzewarn-banner"
		class={`flex items-start gap-2.5 rounded border px-3 py-2.5 ${toneClass}`}
	>
		<TriangleAlert size={20} aria-hidden="true" class="mt-0.5 shrink-0" />
		<div class="flex flex-col gap-0.5">
			<span class="font-sans text-sm font-semibold" data-testid="dwd-level">{level}</span>
			<span class="font-serif text-sm text-ink" lang={headlineLang}>{headline}</span>
			<a
				href={warning.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex w-fit items-center gap-1 font-sans text-xs underline underline-offset-2"
				data-testid="dwd-source"
			>
				<ExternalLink size={11} aria-hidden="true" />
				{m.dwd_banner_source()}
			</a>
		</div>
	</div>
{/if}
