<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import { ExternalLink, Mail } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import DataStandBanner from './data-stand-banner.svelte';
	import { formatLayerValue } from './internal/value-formatters.js';
	import { explainLayer, getLayerExternalLink } from './internal/layer-explain.js';
	import { isOutdated } from './internal/source-shortener.js';

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: string;
		addressDisplayName?: string;
	};

	let { hit, layerName, lang = 'de', addressDisplayName = '' }: Props = $props();

	type RowState = 'with-value' | 'no-coverage' | 'seasonal' | 'outdated';

	const formatted = $derived(formatLayerValue(hit.layer, hit.value));
	const explain = $derived(explainLayer(hit.layer));
	const externalLink = $derived(getLayerExternalLink(hit.layer));
	const outdated = $derived(isOutdated(hit.updatedAt));

	const state: RowState = $derived.by(() => {
		if (hit.reason === 'no-coverage') return 'no-coverage';
		if (hit.reason === 'seasonal') return 'seasonal';
		if (outdated) return 'outdated';
		return 'with-value';
	});

	const valueText = $derived.by(() => {
		if (state === 'no-coverage') return 'Daten nicht vorhanden';
		if (state === 'seasonal') return 'Layer Mai–Oktober aktiv';
		return formatted.text;
	});

	const groupLabel = $derived(`${layerName}: ${valueText}`);

	const mailHref = $derived(
		`mailto:hallo@navigator.berlin?subject=${encodeURIComponent(
			`Fehler im Eintrag: ${hit.layer}`
		)}&body=${encodeURIComponent(
			`Layer: ${hit.layer}\nAdresse: ${addressDisplayName}\nDatenstand: ${hit.updatedAt}`
		)}`
	);

	const learnMoreHref = $derived(resolve(`/${lang}/layer/${hit.layer}` as Pathname));
</script>

<div
	role="group"
	aria-label={groupLabel}
	data-testid="layer-hit-row"
	data-state={state}
	data-layer={hit.layer}
	class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-rule py-3 last:border-b-0"
>
	<div class="flex flex-col gap-1">
		<div class="flex flex-wrap items-baseline gap-x-3">
			<span class="text-base font-medium text-ink" data-testid="layer-name">
				{layerName}
			</span>
			{#if state === 'no-coverage'}
				<span
					class="font-serif italic text-ink-subtle"
					data-testid="value-no-coverage"
				>
					Daten nicht vorhanden
				</span>
			{:else if state === 'seasonal'}
				<span class="font-mono text-sm text-ink-muted" data-testid="value-seasonal">
					Layer Mai–Oktober aktiv
				</span>
			{:else if formatted.isNumeric}
				<span class="font-mono text-base font-semibold text-ink tabular-nums" data-testid="value">
					{valueText}
				</span>
			{:else}
				<span class="text-base font-semibold text-ink" data-testid="value">
					{valueText}
				</span>
			{/if}
		</div>
		{#if explain}
			<p class="font-serif text-sm leading-snug text-ink-muted" data-testid="explain">
				{explain}
			</p>
		{/if}
		{#if externalLink && state !== 'no-coverage'}
			<a
				href={externalLink.href}
				target="_blank"
				rel="noopener noreferrer"
				data-testid="external-link"
				class="inline-flex w-fit items-center gap-1 font-sans text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				<ExternalLink size={12} aria-hidden="true" />
				{externalLink.label}
			</a>
		{/if}
		<DataStandBanner {hit} />
	</div>
	<div class="flex shrink-0 items-start gap-3 pt-1 text-sm">
		{#if state === 'outdated'}
			<span
				data-testid="outdated-pill"
				class="inline-flex items-center rounded-sm bg-state-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-state-warning"
				title={`Datenstand: ${hit.updatedAt}`}
			>
				Veraltet
			</span>
		{/if}
		<a
			href={learnMoreHref}
			class="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
			data-testid="learn-more"
			aria-label={`Mehr erfahren über ${layerName}`}
		>
			<ExternalLink size={14} aria-hidden="true" />
			<span class="sr-only">Mehr erfahren</span>
		</a>
		<svelte:element
			this={'a'}
			href={mailHref}
			class="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
			data-testid="report-error"
			aria-label={`Fehler im Eintrag ${layerName} melden`}
		>
			<Mail size={14} aria-hidden="true" />
			<span class="sr-only">Fehler melden</span>
		</svelte:element>
	</div>
</div>
