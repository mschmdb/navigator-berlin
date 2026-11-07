<!--
	Tooltip nach WCAG 1.4.13 (#200): erscheint bei Hover und Tastaturfokus, bleibt beim
	Überfahren, Escape schließt ihn ohne Fokuswechsel. Auf Touch-Geräten aus, dort tragen
	Labels und Text. Ohne `text` rendert die Komponente nur ihr Kind.
	Das Kind bekommt die ID des Tooltips und setzt sie als `aria-describedby`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import './steuerung.css';

	interface Props {
		readonly text?: string;
		/** Nach unten öffnen, wenn darüber kein Platz ist. */
		readonly below?: boolean;
		readonly children: Snippet<[describedBy: string | undefined]>;
	}

	let { text, below = false, children }: Props = $props();

	const id = $props.id();
	let wrap = $state<HTMLSpanElement>();
	let dismissed = $state(false);

	function onkeydown(e: KeyboardEvent): void {
		if (e.key !== 'Escape' || !wrap) return;
		if (wrap.matches(':hover, :focus-within')) dismissed = true;
	}
	const reset = (): void => {
		dismissed = false;
	};
</script>

<svelte:window {onkeydown} />

{#if text}
	<span
		bind:this={wrap}
		class="bq-tipwrap"
		class:below
		class:esc={dismissed}
		role="presentation"
		onmouseleave={reset}
		onfocusout={reset}
	>
		{@render children(`${id}-tip`)}
		<span class="bq-tip" role="tooltip" id="{id}-tip">{text}</span>
	</span>
{:else}
	{@render children(undefined)}
{/if}
