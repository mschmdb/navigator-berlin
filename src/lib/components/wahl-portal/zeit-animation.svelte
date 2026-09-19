<script lang="ts">
	/**
	 * Story 7 (Zeit-Animation mit Wechsel-Markierung): Zeit-Leiste unter der
	 * Winner-Map. Play/Pause + Jahr-Slider auf kiez/bezirk; auf Stimmbezirk
	 * (Boundary: nie Zeit-Animation dort, Zuschnitts-Wechsel zwischen
	 * Wahl-Generationen) nur ein Hinweis-Satz + "Zur Kiez-Ebene"-Button.
	 *
	 * Zustand/Timer/Drossel-Logik liegt komplett in `ZeitAnimationController`
	 * (internal/zeit-animation.svelte.ts); diese Komponente ist reine
	 * Darstellung + Event-Verdrahtung.
	 */
	import { untrack } from 'svelte';
	import { Play, Pause, StepForward } from '@lucide/svelte';
	import type { WahlPortalEbene } from '$lib/utils/wahl-portal-url-state.js';
	import { ZeitAnimationController } from './internal/zeit-animation.svelte.js';

	export interface ZeitAnimationJahrOption {
		readonly jahr: number;
		readonly isRepeatElection: boolean;
	}

	type Props = {
		ebene: WahlPortalEbene;
		/** Aufsteigend sortiert, reale Jahre mit Kiez/Bezirk-Daten. */
		jahrOptions: readonly ZeitAnimationJahrOption[];
		/** Extern committed/aufgelöstes Jahr (Portal-State) -- Sync-Quelle. */
		jahr: number;
		/** Sofort bei jeder visuellen Änderung, treibt die Karten-Umfärbung. */
		onDisplayJahr: (jahr: number) => void;
		/** Gedrosselt; committed ins Portal (`setJahr`), URL-Schreib-Limit. */
		onCommitJahr: (jahr: number) => void;
		onZurKiez: () => void;
	};

	let { ebene, jahrOptions, jahr, onDisplayJahr, onCommitJahr, onZurKiez }: Props = $props();

	// svelte-ignore state_referenced_locally -- Initialwert einmalig, danach
	// hält der Controller sein eigenes Anzeige-Jahr (Muster mapCtl/sbLoader).
	const ctl = new ZeitAnimationController({
		jahre: () => jahrOptions.map((o) => o.jahr),
		initialJahr: jahr,
		onDisplayJahr,
		onCommitJahr
	});

	// Effect darf NUR von `jahr` (Prop) abhängen: `syncExternalJahr` liest
	// `ctl.displayJahr`/`ctl.playing` (beide $state) -- ohne `untrack` würde
	// Svelte diese als zusätzliche Abhängigkeiten aufnehmen und den Effect bei
	// JEDEM Play-Tick erneut laufen lassen, was die Wiedergabe mit dem
	// (unveränderten) externen `jahr` sofort wieder zurückdrehen würde.
	$effect(() => {
		const externalJahr = jahr;
		untrack(() => ctl.syncExternalJahr(externalJahr));
	});

	$effect(() => {
		return () => ctl.destroy();
	});

	// Jahr fehlt in jahrOptions (Reihen-/Ebenen-Wechsel-Zwischenstand): Index auf
	// 0 klemmen statt den Slider/aria-valuetext leer zu lassen.
	const activeIndex = $derived(Math.max(0, jahrOptions.findIndex((o) => o.jahr === ctl.displayJahr)));
	const activeOption = $derived(jahrOptions[activeIndex] ?? null);
	const valueText = $derived(
		activeOption
			? `${activeOption.jahr}${activeOption.isRepeatElection ? ' Wiederholungswahl' : ''}`
			: String(ctl.displayJahr)
	);

	function onSliderInput(event: Event): void {
		const index = Number((event.currentTarget as HTMLInputElement).value);
		ctl.setDisplayJahrByIndex(index);
	}

	function onSliderChange(): void {
		ctl.flushPendingCommit();
	}
</script>

{#if ebene === 'stimmbezirk'}
	<div data-testid="zeit-animation-hinweis" class="flex flex-wrap items-center gap-3 border border-rule bg-bg p-3">
		<p class="font-mono text-xs text-ink-subtle">
			Zeit-Animation gibt es nur auf Kiez- oder Bezirks-Ebene (Stimmbezirke wechseln zwischen
			Wahl-Generationen ihren Zuschnitt).
		</p>
		<button
			type="button"
			data-testid="zeit-animation-zur-kiez-button"
			onclick={onZurKiez}
			class="rounded border border-ink bg-bg px-2.5 py-1 font-mono text-xs text-ink transition-colors hover:bg-bg-muted"
		>
			Zur Kiez-Ebene
		</button>
	</div>
{:else if jahrOptions.length > 0}
	<div data-testid="zeit-animation" class="flex flex-wrap items-center gap-3 border border-rule bg-bg p-3">
		{#if ctl.reducedMotion}
			<button
				type="button"
				data-testid="zeit-animation-play"
				aria-label="Ein Jahr weiter"
				onclick={() => ctl.togglePlay()}
				class="inline-flex items-center justify-center rounded border border-ink p-1.5 text-ink transition-colors hover:bg-bg-muted"
			>
				<StepForward size={16} aria-hidden="true" />
			</button>
		{:else}
			<button
				type="button"
				data-testid="zeit-animation-play"
				aria-pressed={ctl.playing}
				aria-label={ctl.playing ? 'Wiedergabe pausieren' : 'Wiedergabe starten'}
				onclick={() => ctl.togglePlay()}
				class="inline-flex items-center justify-center rounded border border-ink p-1.5 text-ink transition-colors hover:bg-bg-muted"
			>
				{#if ctl.playing}
					<Pause size={16} aria-hidden="true" />
				{:else}
					<Play size={16} aria-hidden="true" />
				{/if}
			</button>
		{/if}

		<input
			type="range"
			data-testid="zeit-animation-slider"
			min="0"
			max={jahrOptions.length - 1}
			step="1"
			value={activeIndex}
			aria-label="Jahr"
			aria-valuetext={valueText}
			oninput={onSliderInput}
			onchange={onSliderChange}
			class="min-w-[10rem] flex-1 accent-ink"
		/>

		<span data-testid="zeit-animation-jahr" class="font-mono text-xs tabular-nums text-ink">
			{activeOption?.jahr ?? ctl.displayJahr}
			{#if activeOption?.isRepeatElection}
				<span
					data-testid="zeit-animation-wiederholung"
					aria-hidden="true"
					class="ml-0.5 text-[10px] text-ink-subtle"
					title="Wiederholungswahl"
				>
					·W
				</span>
			{/if}
		</span>
	</div>

	<p data-testid="zeit-animation-wechsel-hinweis" class="font-mono text-xs text-ink-subtle">
		Gestrichelte Kontur: Wechsel der stärksten Kraft im gewählten Jahr.
	</p>
{/if}
