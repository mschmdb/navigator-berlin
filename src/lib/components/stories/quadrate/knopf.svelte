<!-- Knopf im Steuerelement-System (#200), optional mit Tooltip. -->
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Hinweis from './hinweis.svelte';
	import './steuerung.css';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'type'> & {
		readonly text: string;
		readonly help?: string;
		readonly tipBelow?: boolean;
	};

	let { text, help, tipBelow = false, class: className = '', ...rest }: Props = $props();
</script>

<Hinweis text={help} below={tipBelow}>
	{#snippet children(describedBy)}
		<button type="button" class="bq-btn {className}" aria-describedby={describedBy} {...rest}
			>{text}</button
		>
	{/snippet}
</Hinweis>
