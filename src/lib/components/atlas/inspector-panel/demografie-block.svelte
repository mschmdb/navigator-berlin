<script lang="ts">
	import { Users, Eye, EyeOff, ExternalLink, ChevronDown } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatCount, formatDecimal } from '$lib/i18n/format.js';
	import {
		demografieBezugLabel,
		type DemografieScope,
		type KiezDemografieData
	} from './internal/demografie-types.js';

	interface Props {
		data: KiezDemografieData | null;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		/** Aktiver räumlicher Bezug. Default 'standort' (= bisheriges PLR-Verhalten). */
		scope?: DemografieScope;
		/** Anzeigename des aktiven Kiez/Bezirk (für die Bezug-Zeile). */
		scopeName?: string | null;
		kiezAvailable?: boolean;
		bezirkAvailable?: boolean;
		/** Gesetzt = Scope-Umschaltung aktiv (rendert den Toggle). */
		onScopeChange?: (scope: DemografieScope) => void;
		lang?: Locale;
	}
	let {
		data,
		isActive = false,
		onToggleLayer,
		scope = 'standort',
		scopeName = null,
		kiezAvailable = false,
		bezirkAvailable = false,
		onScopeChange,
		lang
	}: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const SLUG = 'einwohner-dichte-2024';
	const learnMoreHref = $derived(localizedHref(`/layer/${SLUG}`, locale));

	let detailsOpen = $state(false);

	// `formatPercent` (format.ts) erzwingt immer `decimals` Nachkommastellen
	// (toFixed), das vormalige `Intl.NumberFormat(..., { maximumFractionDigits: 1 })`
	// zeigte ganze Prozentwerte ohne Nachkommastelle ("20 %", nicht "20,0 %") --
	// `formatDecimal` (ohne `minimumFractionDigits`) reicht dieses Alt-Verhalten
	// 1:1 durch (Boundary: DE-Ausgabe Zeichen für Zeichen gleich), nur die
	// "%"-Abstand-Konvention bleibt hier lokal, weil `formatPercent` sie nicht
	// ohne die feste Nachkommastelle anbietet.
	function pct(anteil: number): string {
		const numStr = formatDecimal(anteil * 100, { ...localeOpts, maximumFractionDigits: 1 });
		return locale === 'de' ? `${numStr} %` : `${numStr}%`;
	}

	function oneDecimal(n: number): string {
		return formatDecimal(n, { ...localeOpts, maximumFractionDigits: 1 });
	}

	const SCOPES: readonly DemografieScope[] = ['standort', 'kiez', 'bezirk'];
	const scopeLabel = $derived((s: DemografieScope): string => {
		if (s === 'standort') return m.inspector_demografie_scope_standort(undefined, localeOpts);
		if (s === 'kiez') return m.inspector_demografie_scope_kiez(undefined, localeOpts);
		return m.inspector_demografie_scope_bezirk(undefined, localeOpts);
	});

	function scopeAvailable(s: DemografieScope): boolean {
		if (s === 'standort') return true;
		if (s === 'kiez') return kiezAvailable;
		return bezirkAvailable;
	}

	// Bezug-Zeile: erklärt, worauf sich die Zahlen beziehen (löst die Scope-Ambiguität).
	// Gleiche Quelle wie der LLM-Export (demografieBezugLabel), damit beide übereinstimmen.
	const bezugText = $derived(
		m.inspector_demografie_bezug_prefix(
			{ label: demografieBezugLabel(scope, scopeName, localeOpts) },
			localeOpts
		)
	);

	let scopeButtons: HTMLButtonElement[] = $state([]);

	function selectScope(s: DemografieScope): void {
		if (!scopeAvailable(s)) return;
		onScopeChange?.(s);
	}

	function onScopeKeydown(event: KeyboardEvent, s: DemografieScope): void {
		const order = SCOPES.filter(scopeAvailable);
		const idx = order.indexOf(s);
		if (idx < 0) return;
		let nextIdx: number | null = null;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIdx = (idx + 1) % order.length;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
			nextIdx = (idx - 1 + order.length) % order.length;
		else if (event.key === 'Home') nextIdx = 0;
		else if (event.key === 'End') nextIdx = order.length - 1;
		if (nextIdx === null) return;
		event.preventDefault();
		const next = order[nextIdx];
		scopeButtons[SCOPES.indexOf(next)]?.focus();
		selectScope(next);
	}
</script>

<section
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
	aria-label={m.inspector_demografie_aria_label(undefined, localeOpts)}
	data-testid="demografie-block"
>
	<h4 class="flex min-w-0 items-center gap-2 font-sans text-sm font-semibold text-ink">
		<Users class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
		<span class="break-words hyphens-auto">{m.inspector_demografie_heading(undefined, localeOpts)}</span>
	</h4>

	{#if onScopeChange}
		<div
			role="radiogroup"
			aria-label={m.inspector_demografie_scope_toggle_aria_label(undefined, localeOpts)}
			data-testid="demografie-scope-toggle"
			class="mt-1.5 grid grid-cols-3 gap-1"
		>
			{#each SCOPES as s, i (s)}
				{@const available = scopeAvailable(s)}
				{@const checked = scope === s}
				<button
					bind:this={scopeButtons[i]}
					role="radio"
					type="button"
					data-testid={`demografie-scope-${s}`}
					aria-checked={checked}
					aria-disabled={!available}
					tabindex={checked ? 0 : -1}
					title={available
						? scopeLabel(s)
						: m.inspector_demografie_scope_unavailable({ label: scopeLabel(s) }, localeOpts)}
					onclick={() => selectScope(s)}
					onkeydown={(e) => onScopeKeydown(e, s)}
					class="rounded border border-ink px-1 py-1 text-center font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
					class:bg-ink={checked}
					class:text-bg={checked}
					class:bg-bg={!checked}
					class:text-ink={!checked && available}
					class:hover:bg-bg-muted={!checked && available}
					class:opacity-40={!available}
					class:cursor-not-allowed={!available}
					class:text-ink-subtle={!available}
				>
					{scopeLabel(s)}
				</button>
			{/each}
		</div>
	{/if}

	{#if data === null}
		<p class="mt-1 font-serif text-sm text-ink-muted" data-testid="demografie-empty">
			{m.inspector_demografie_empty(undefined, localeOpts)}
		</p>
	{:else}
		<p
			class="mt-1 font-mono text-[11px] break-words hyphens-auto text-ink-muted"
			data-testid="demografie-bezug"
		>
			{bezugText}
		</p>
		<p class="mt-0.5 font-serif text-xs break-words hyphens-auto text-ink-subtle">
			{m.inspector_demografie_neutral_hint(undefined, localeOpts)}
		</p>
		<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
			<dt class="text-ink-muted">{m.inspector_demografie_dichte_label(undefined, localeOpts)}</dt>
			<dd class="text-right font-mono text-ink">
				{data.dichteEwKm2 === null
					? '–'
					: m.inspector_demografie_dichte_unit(
							{ count: formatCount(Math.round(data.dichteEwKm2), localeOpts) },
							localeOpts
						)}
			</dd>
			<dt class="text-ink-muted">{m.inspector_demografie_einwohner_label(undefined, localeOpts)}</dt>
			<dd class="text-right font-mono text-ink">{formatCount(data.einwohner, localeOpts)}</dd>
			<dt class="break-words hyphens-auto text-ink-muted">
				{m.inspector_demografie_kinder_0_6_label(undefined, localeOpts)}
			</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilKinder0bis6)}</dd>
			<dt class="break-words hyphens-auto text-ink-muted">
				{m.inspector_demografie_kinder_6_12_label(undefined, localeOpts)}
			</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilKinder6bis12)}</dd>
			<dt class="break-words hyphens-auto text-ink-muted">
				{m.inspector_demografie_senioren_label(undefined, localeOpts)}
			</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilSenioren65plus)}</dd>
			{#if data.jugendquotient !== null}
				<dt class="break-words hyphens-auto text-ink-muted">
					{m.inspector_demografie_jugendquotient_label(undefined, localeOpts)}
				</dt>
				<dd class="text-right font-mono text-ink">{oneDecimal(data.jugendquotient)}</dd>
			{/if}
			{#if data.altenquotient !== null}
				<dt class="break-words hyphens-auto text-ink-muted">
					{m.inspector_demografie_altenquotient_label(undefined, localeOpts)}
				</dt>
				<dd class="text-right font-mono text-ink">{oneDecimal(data.altenquotient)}</dd>
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
			{m.inspector_common_details_toggle(undefined, localeOpts)}
		</button>
		<div class="flex shrink-0 items-center gap-1">
			{#if onToggleLayer}
				<button
					type="button"
					data-testid="map-toggle"
					aria-pressed={isActive}
					aria-label={isActive
						? m.inspector_demografie_map_toggle_remove(undefined, localeOpts)
						: m.inspector_demografie_map_toggle_add(undefined, localeOpts)}
					title={isActive
						? m.inspector_common_map_toggle_remove_title(undefined, localeOpts)
						: m.inspector_common_map_toggle_add_title(undefined, localeOpts)}
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
				aria-label={m.inspector_demografie_learn_more_aria(undefined, localeOpts)}
				title={m.inspector_common_learn_more_title(undefined, localeOpts)}
				class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-ink-subtle hover:bg-bg hover:text-ink"
			>
				<ExternalLink size={13} aria-hidden="true" />
			</a>
		</div>
	</div>

	{#if detailsOpen && data !== null}
		<p
			class="mt-1.5 font-mono text-xs break-words hyphens-auto text-ink-subtle"
			data-testid="demografie-details"
		>
			{m.inspector_demografie_details_text(
				{ datenstand: data.datenstand, quelle: data.quelle, lizenz: data.lizenz },
				localeOpts
			)}
		</p>
	{/if}
</section>
