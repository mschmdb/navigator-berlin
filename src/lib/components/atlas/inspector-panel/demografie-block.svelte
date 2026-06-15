<script lang="ts">
	import { Users, Eye, EyeOff, ExternalLink, ChevronDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';
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
	}
	let {
		data,
		isActive = false,
		onToggleLayer,
		scope = 'standort',
		scopeName = null,
		kiezAvailable = false,
		bezirkAvailable = false,
		onScopeChange
	}: Props = $props();

	const SLUG = 'einwohner-dichte-2024';
	const learnMoreHref = resolve('/(with-header)/layer/[slug]', { slug: SLUG });

	let detailsOpen = $state(false);

	const intFmt = new Intl.NumberFormat('de-DE');
	const oneFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

	function pct(anteil: number): string {
		return `${oneFmt.format(anteil * 100)} %`;
	}

	const SCOPES: readonly DemografieScope[] = ['standort', 'kiez', 'bezirk'];
	const SCOPE_LABELS: Record<DemografieScope, string> = {
		standort: 'Umgebung',
		kiez: 'Kiez',
		bezirk: 'Bezirk'
	};

	function scopeAvailable(s: DemografieScope): boolean {
		if (s === 'standort') return true;
		if (s === 'kiez') return kiezAvailable;
		return bezirkAvailable;
	}

	// Bezug-Zeile: erklärt, worauf sich die Zahlen beziehen (löst die Scope-Ambiguität).
	// Gleiche Quelle wie der LLM-Export (demografieBezugLabel), damit beide übereinstimmen.
	const bezugText = $derived(`Bezug: ${demografieBezugLabel(scope, scopeName)}`);

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
	aria-label="Bevölkerungsprofil an dieser Adresse"
	data-testid="demografie-block"
>
	<h4 class="flex min-w-0 items-center gap-2 font-sans text-sm font-semibold text-ink">
		<Users class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
		<span class="break-words hyphens-auto">Bevölkerungsprofil</span>
	</h4>

	{#if onScopeChange}
		<div
			role="radiogroup"
			aria-label="Räumlicher Bezug des Bevölkerungsprofils"
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
						? SCOPE_LABELS[s]
						: `${SCOPE_LABELS[s]} · an dieser Stelle nicht verfügbar`}
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
					{SCOPE_LABELS[s]}
				</button>
			{/each}
		</div>
	{/if}

	{#if data === null}
		<p class="mt-1 font-serif text-sm text-ink-muted" data-testid="demografie-empty">
			Keine Bevölkerungsdaten vorhanden.
		</p>
	{:else}
		<p
			class="mt-1 font-mono text-[11px] break-words hyphens-auto text-ink-muted"
			data-testid="demografie-bezug"
		>
			{bezugText}
		</p>
		<p class="mt-0.5 font-serif text-xs break-words hyphens-auto text-ink-subtle">
			Neutraler Kontext, keine Wertung: dicht ist nicht besser als locker.
		</p>
		<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
			<dt class="text-ink-muted">Einwohnerdichte</dt>
			<dd class="text-right font-mono text-ink">
				{data.dichteEwKm2 === null ? '–' : `${intFmt.format(Math.round(data.dichteEwKm2))} EW/km²`}
			</dd>
			<dt class="text-ink-muted">Einwohner gesamt</dt>
			<dd class="text-right font-mono text-ink">{intFmt.format(data.einwohner)}</dd>
			<dt class="break-words hyphens-auto text-ink-muted">Kinder 0–6</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilKinder0bis6)}</dd>
			<dt class="break-words hyphens-auto text-ink-muted">Kinder 6–12</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilKinder6bis12)}</dd>
			<dt class="break-words hyphens-auto text-ink-muted">Senioren 65+</dt>
			<dd class="text-right font-mono text-ink">{pct(data.anteilSenioren65plus)}</dd>
			{#if data.jugendquotient !== null}
				<dt class="break-words hyphens-auto text-ink-muted">Jugendquotient</dt>
				<dd class="text-right font-mono text-ink">{oneFmt.format(data.jugendquotient)}</dd>
			{/if}
			{#if data.altenquotient !== null}
				<dt class="break-words hyphens-auto text-ink-muted">Altenquotient</dt>
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
			class="mt-1.5 font-mono text-xs break-words hyphens-auto text-ink-subtle"
			data-testid="demografie-details"
		>
			Stand {data.datenstand} · {data.quelle} · {data.lizenz}
		</p>
	{/if}
</section>
