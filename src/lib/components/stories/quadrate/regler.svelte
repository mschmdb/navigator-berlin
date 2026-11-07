<!--
	Regler mit Ausgabe (#200). `format` liefert den sichtbaren und den vorgelesenen Wert.
	`oninput` feuert höchstens einmal pro Frame, damit teure Neuberechnungen nicht stauen.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import Hinweis from './hinweis.svelte';
	import './steuerung.css';

	interface Props {
		readonly label: string;
		readonly min: number;
		readonly max: number;
		readonly step?: number;
		value: number;
		readonly format: (value: number) => string;
		readonly help?: string;
		readonly oninput?: (value: number) => void;
	}

	let { label, min, max, step = 1, value = $bindable(), format, help, oninput }: Props = $props();

	const id = $props.id();
	const text = $derived(format(value));
	let frame = 0;

	// onDestroy läuft auch beim SSR, dort gibt es kein cancelAnimationFrame.
	onDestroy(() => {
		if (frame) cancelAnimationFrame(frame);
	});

	function input(e: Event & { currentTarget: HTMLInputElement }): void {
		value = Number(e.currentTarget.value);
		if (!oninput) return;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => oninput(value));
	}
</script>

<div class="bq-ctl">
	<label class="bq-lab" for="{id}-rng">{label}</label>
	<Hinweis text={help}>
		{#snippet children(describedBy)}
			<div class="bq-rng">
				<input
					type="range"
					id="{id}-rng"
					{min}
					{max}
					{step}
					{value}
					aria-valuetext={text}
					aria-describedby={describedBy}
					oninput={input}
				/>
				<output for="{id}-rng">{text}</output>
			</div>
		{/snippet}
	</Hinweis>
</div>
