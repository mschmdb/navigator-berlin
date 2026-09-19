<script lang="ts">
	import {
		REIHE_VALUES,
		EBENE_VALUES,
		REIHE_LABELS,
		EBENE_LABELS,
		type WahlPortalReihe,
		type WahlPortalEbene
	} from '$lib/utils/wahl-portal-url-state.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';

	export interface JahrOption {
		readonly jahr: number;
		readonly isRepeatElection: boolean;
	}

	type Props = {
		reihe: WahlPortalReihe;
		jahr: number | null;
		ebene: WahlPortalEbene;
		jahrOptions: readonly JahrOption[];
		/** DB-los / API leer (AC I/O-Matrix): Reihe+Ebene-Toggles gesperrt. */
		disabled?: boolean;
		onReiheChange: (reihe: WahlPortalReihe) => void;
		onJahrChange: (jahr: number) => void;
		onEbeneChange: (ebene: WahlPortalEbene) => void;
	};

	let {
		reihe,
		jahr,
		ebene,
		jahrOptions,
		disabled = false,
		onReiheChange,
		onJahrChange,
		onEbeneChange
	}: Props = $props();

	let reiheButtons: HTMLButtonElement[] = $state([]);
	let jahrButtons: HTMLButtonElement[] = $state([]);
	let ebeneButtons: HTMLButtonElement[] = $state([]);

	function onReiheKeydown(event: KeyboardEvent, index: number): void {
		if (disabled) return;
		const next = nextRadioIndex(event.key, index, REIHE_VALUES.length);
		if (next === null) return;
		event.preventDefault();
		reiheButtons[next]?.focus();
		onReiheChange(REIHE_VALUES[next]);
	}

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

<div data-testid="portal-steuerleiste" class="flex flex-col gap-3 border border-rule bg-bg p-3">
	<div class="flex flex-col gap-1.5">
		<span
			id="steuerleiste-reihe-label"
			class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
		>
			Wahl-Reihe
		</span>
		<div
			role="radiogroup"
			aria-labelledby="steuerleiste-reihe-label"
			data-testid="steuerleiste-reihe"
			class="flex flex-wrap gap-1"
		>
			{#each REIHE_VALUES as value, i (value)}
				{@const checked = reihe === value}
				<button
					bind:this={reiheButtons[i]}
					role="radio"
					type="button"
					data-testid={`steuerleiste-reihe-${value}`}
					aria-checked={checked}
					aria-disabled={disabled}
					tabindex={checked ? 0 : -1}
					onclick={() => !disabled && onReiheChange(value)}
					onkeydown={(e) => onReiheKeydown(e, i)}
					class="rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
					class:bg-ink={checked}
					class:text-bg={checked}
					class:bg-bg={!checked}
					class:text-ink={!checked}
					class:hover:bg-bg-muted={!checked && !disabled}
					class:opacity-40={disabled}
					class:cursor-not-allowed={disabled}
				>
					{REIHE_LABELS[value]}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-1.5">
		<span
			id="steuerleiste-jahr-label"
			class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
		>
			Jahr
		</span>
		{#if jahrOptions.length === 0}
			<p data-testid="steuerleiste-jahr-empty" class="font-mono text-xs text-ink-subtle">
				Keine Wahl-Daten verfügbar.
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
						aria-label={opt.isRepeatElection ? `${opt.jahr} · Wiederholungswahl` : String(opt.jahr)}
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
								title="Wiederholungswahl"
							>
								·W
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
			Ebene
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
					{EBENE_LABELS[value]}
				</button>
			{/each}
		</div>
	</div>
</div>
