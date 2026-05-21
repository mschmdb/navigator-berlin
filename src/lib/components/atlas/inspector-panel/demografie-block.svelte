<script lang="ts">
	import { Users, Eye, EyeOff, ExternalLink, ChevronDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { KiezDemografieData } from './internal/demografie-types.js';

	interface Props {
		data: KiezDemografieData | null;
		lang?: string;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
	}
	let { data, lang = 'de', isActive = false, onToggleLayer }: Props = $props();

	const SLUG = 'einwohner-dichte-2024';
	const learnMoreHref = $derived((resolve as (p: string) => string)(`/${lang}/layer/${SLUG}`));

	let detailsOpen = $state(false);

	const intFmt = new Intl.NumberFormat('de-DE');
	const oneFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

	function pct(anteil: number): string {
		return `${oneFmt.format(anteil * 100)} %`;
	}
</script>

<section
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
	aria-label="Bevölkerungsprofil an dieser Adresse"
	data-testid="demografie-block"
>
	<h4 class="flex min-w-0 items-center gap-2 font-sans text-sm font-semibold text-ink">
		<Users class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
		<span class="hyphens-auto break-words">Bevölkerungsprofil</span>
	</h4>

	{#if data === null}
		<p class="mt-1 font-serif text-sm text-ink-muted" data-testid="demografie-empty">
			Keine Bevölkerungsdaten vorhanden.
		</p>
	{:else}
		<p class="mt-0.5 font-serif text-xs text-ink-subtle hyphens-auto break-words">
			Neutraler Kontext, keine Wertung: dicht ist nicht besser als locker.
		</p>
		<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
			<dt class="text-ink-muted">Einwohnerdichte</dt>
			<dd class="text-right font-mono text-ink">
				{data.dichteEwKm2 === null ? '–' : `${intFmt.format(Math.round(data.dichteEwKm2))} EW/km²`}
			</dd>
			<dt class="text-ink-muted">Einwohner gesamt</dt>
			<dd class="text-right font-mono text-ink">{intFmt.format(data.einwohner)}</dd>
			<dt class="text-ink-muted hyphens-auto break-words">Kinder 0–6</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilKinder0bis6)}</dd>
			<dt class="text-ink-muted hyphens-auto break-words">Kinder 6–12</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilKinder6bis12)}</dd>
			<dt class="text-ink-muted hyphens-auto break-words">Senioren 65+</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilSenioren65plus)}</dd>
			{#if data.jugendquotient !== null}
				<dt class="text-ink-muted hyphens-auto break-words">Jugendquotient</dt>
				<dd class="text-right font-mono text-ink">{oneFmt.format(data.jugendquotient)}</dd>
			{/if}
			{#if data.altenquotient !== null}
				<dt class="text-ink-muted hyphens-auto break-words">Altenquotient</dt>
				<dd class="text-right font-mono text-ink">{oneFmt.format(data.altenquotient)}</dd>
			{/if}
		</dl>
	{/if}

	<div class="mt-2 flex items-center justify-between gap-2">
		<button
			type="button"
			data-testid="demografie-details-toggle"
			aria-expanded={detailsOpen}
			onclick={() => (detailsOpen = !detailsOpen)}
			class="inline-flex items-center gap-1 font-mono text-[11px] text-ink-subtle hover:text-ink"
		>
			<ChevronDown
				size={12}
				aria-hidden="true"
				class={detailsOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
			/>
			Quelle &amp; Details
		</button>
		<div class="flex shrink-0 items-center gap-1">
			{#if onToggleLayer}
				<button
					type="button"
					data-testid="map-toggle"
					aria-pressed={isActive}
					aria-label={isActive
						? 'Einwohnerdichte von Karte entfernen'
						: 'Einwohnerdichte auf Karte zeigen'}
					title={isActive ? 'Von Karte entfernen' : 'Auf Karte zeigen'}
					onclick={() => onToggleLayer?.(SLUG)}
					class={`inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-bg ${isActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
				>
					{#if isActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
							size={14}
							aria-hidden="true"
						/>{/if}
				</button>
			{/if}
			<a
				href={learnMoreHref}
				data-testid="learn-more"
				aria-label="Mehr über Einwohnerdichte"
				title="Layer-Details"
				class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-ink-subtle hover:bg-bg hover:text-ink"
			>
				<ExternalLink size={13} aria-hidden="true" />
			</a>
		</div>
	</div>

	{#if detailsOpen && data !== null}
		<p
			class="mt-1.5 font-mono text-xs text-ink-subtle hyphens-auto break-words"
			data-testid="demografie-details"
		>
			Stand {data.datenstand} · {data.quelle} · {data.lizenz}
		</p>
	{/if}
</section>
