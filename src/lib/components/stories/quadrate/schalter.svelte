<!--
	Schalter (#200): Knopf mit aria-pressed und Häkchen, damit der Zustand nicht nur an der
	Farbe hängt. Der zugängliche Name verbindet Label und Text, z. B. „Nichtwähler Mitzählen“.
-->
<script lang="ts">
	import Hinweis from './hinweis.svelte';
	import './steuerung.css';

	interface Props {
		readonly label?: string;
		readonly text: string;
		pressed: boolean;
		readonly help?: string;
		readonly onchange?: (pressed: boolean) => void;
	}

	let { label, text, pressed = $bindable(), help, onchange }: Props = $props();

	const id = $props.id();

	function toggle(): void {
		pressed = !pressed;
		onchange?.(pressed);
	}
</script>

<div class="bq-ctl">
	{#if label}<span class="bq-lab" id="{id}-lab">{label}</span>{/if}
	<Hinweis text={help}>
		{#snippet children(describedBy)}
			<button
				type="button"
				class="bq-btn"
				aria-pressed={pressed}
				aria-labelledby={label ? `${id}-lab ${id}-txt` : undefined}
				aria-describedby={describedBy}
				onclick={toggle}
			>
				<span class="bq-box" aria-hidden="true"></span>
				<span id="{id}-txt">{text}</span>
			</button>
		{/snippet}
	</Hinweis>
</div>
