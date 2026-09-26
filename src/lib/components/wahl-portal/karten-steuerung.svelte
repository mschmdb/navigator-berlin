<script lang="ts">
	/**
	 * Story 10 (Steuerungs-Klarheit): Jahr- und Ebenen-Controls gelten nur für
	 * das Karte-Kapitel (Winner-Map/Panel/Small-Multiples-Zeitschnitt), nicht
	 * seitenweit -- deshalb rendert dieses Control im Karte-Kapitel, direkt vor
	 * der Winner-Map, statt in einer globalen Steuerleiste.
	 *
	 * Aufgespalten aus `portal-steuerleiste.svelte` (Story 3): Testids
	 * (`steuerleiste-jahr*`, `steuerleiste-ebene*`) und Tastatursteuerung
	 * bleiben unverändert, damit die bestehenden E2E-Stellen stabil bleiben.
	 */
	import { EBENE_VALUES, type WahlPortalEbene } from '$lib/utils/wahl-portal-url-state.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';
	import { m } from '$lib/paraglide/messages.js';
	import { wahlEbeneLabel, wahlWiederholungLabel } from '$lib/data/wahl-labels.js';

	export interface JahrOption {
		readonly jahr: number;
		readonly isRepeatElection: boolean;
	}

	type Props = {
		jahr: number | null;
		ebene: WahlPortalEbene;
		jahrOptions: readonly JahrOption[];
		/** DB-los / API leer (AC I/O-Matrix): Ebene-Toggle gesperrt. */
		disabled?: boolean;
		onJahrChange: (jahr: number) => void;
		onEbeneChange: (ebene: WahlPortalEbene) => void;
	};

	let { jahr, ebene, jahrOptions, disabled = false, onJahrChange, onEbeneChange }: Props = $props();

	let jahrButtons: HTMLButtonElement[] = $state([]);
	let ebeneButtons: HTMLButtonElement[] = $state([]);

	function onJahrKeydown(event: KeyboardEvent, index: number): void {
		if (disabled) return;
		const next = nextRadioIndex(event.key, index, jahrOptions.length);
		if (next === null) return;
		event.preventDefault();
		jahrButtons[next]?.focus();
		onJahrChange(jahrOptions[next].jahr);
	}

	function onEbeneKeydown(event: KeyboardEvent, index: number): void {
		if (disabled) return;
		const next = nextRadioIndex(event.key, index, EBENE_VALUES.length);
		if (next === null) return;
		event.preventDefault();
		ebeneButtons[next]?.focus();
		onEbeneChange(EBENE_VALUES[next]);
	}
</script>

<div data-testid="karten-steuerung" class="flex flex-col gap-3 border border-rule bg-bg p-3">
	<div class="flex flex-col gap-1.5">
		<span
			id="steuerleiste-jahr-label"
			class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
		>
			{m.wahl_portal_spalte_jahr()}
		</span>
		{#if jahrOptions.length === 0}
			<p data-testid="steuerleiste-jahr-empty" class="font-mono text-xs text-ink-subtle">
				{m.wahl_portal_jahr_keine_optionen()}
			</p>
		{:else}
			<div
				role="radiogroup"
				aria-labelledby="steuerleiste-jahr-label"
				data-testid="steuerleiste-jahr"
				class="flex flex-wrap gap-1"
			>
				{#each jahrOptions as opt, i (opt.jahr)}
					{@const checked = jahr === opt.jahr}
					<button
						bind:this={jahrButtons[i]}
						role="radio"
						type="button"
						data-testid={`steuerleiste-jahr-${opt.jahr}`}
						aria-checked={checked}
						aria-disabled={disabled}
						aria-label={opt.isRepeatElection
							? `${opt.jahr} · ${wahlWiederholungLabel()}`
							: String(opt.jahr)}
						tabindex={checked ? 0 : -1}
						onclick={() => !disabled && onJahrChange(opt.jahr)}
						onkeydown={(e) => onJahrKeydown(e, i)}
						class="rounded border border-ink px-2 py-0.5 font-mono text-xs tabular-nums transition-colors"
						class:bg-ink={checked}
						class:text-bg={checked}
						class:bg-bg={!checked}
						class:text-ink={!checked}
						class:hover:bg-bg-muted={!checked && !disabled}
						class:opacity-40={disabled}
						class:cursor-not-allowed={disabled}
					>
						{opt.jahr}
						{#if opt.isRepeatElection}
							<span
								data-testid={`steuerleiste-jahr-${opt.jahr}-wiederholung`}
								aria-hidden="true"
								class="ml-0.5 text-[10px] text-ink-subtle"
								title={wahlWiederholungLabel()}
							>
								{m.wahl_portal_wiederholung_kuerzel()}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-1.5">
		<span
			id="steuerleiste-ebene-label"
			class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
		>
			{m.wahl_portal_feld_ebene()}
		</span>
		<div
			role="radiogroup"
			aria-labelledby="steuerleiste-ebene-label"
			data-testid="steuerleiste-ebene"
			class="flex flex-wrap gap-1"
		>
			{#each EBENE_VALUES as value, i (value)}
				{@const checked = ebene === value}
				<button
					bind:this={ebeneButtons[i]}
					role="radio"
					type="button"
					data-testid={`steuerleiste-ebene-${value}`}
					aria-checked={checked}
					aria-disabled={disabled}
					tabindex={checked ? 0 : -1}
					onclick={() => !disabled && onEbeneChange(value)}
					onkeydown={(e) => onEbeneKeydown(e, i)}
					class="rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
					class:bg-ink={checked}
					class:text-bg={checked}
					class:bg-bg={!checked}
					class:text-ink={!checked}
					class:hover:bg-bg-muted={!checked && !disabled}
					class:opacity-40={disabled}
					class:cursor-not-allowed={disabled}
				>
					{wahlEbeneLabel(value)}
				</button>
			{/each}
		</div>
	</div>
</div>
