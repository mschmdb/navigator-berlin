<!--
	Segment-Gruppe (#200): aneinanderstoßende Knöpfe, genau einer gedrückt. Das Label steht
	sichtbar darüber und benennt die Gruppe. Ein Klick auf den gedrückten Knopf meldet nichts.
-->
<script lang="ts" generics="T extends string">
	import Hinweis from './hinweis.svelte';
	import './steuerung.css';

	interface Item {
		readonly value: T;
		readonly text: string;
		readonly help?: string;
	}

	interface Props {
		readonly label: string;
		readonly items: readonly Item[];
		value: T;
		readonly onchange?: (value: T) => void;
		readonly tipBelow?: boolean;
	}

	let { label, items, value = $bindable(), onchange, tipBelow = false }: Props = $props();

	const id = $props.id();

	function pick(v: T): void {
		if (v === value) return;
		value = v;
		onchange?.(v);
	}
</script>

<div class="bq-ctl">
	<span class="bq-lab" id="{id}-lab">{label}</span>
	<div class="bq-seg" role="group" aria-labelledby="{id}-lab">
		{#each items as item (item.value)}
			<Hinweis text={item.help} below={tipBelow}>
				{#snippet children(describedBy)}
					<button
						type="button"
						class="bq-btn"
						aria-pressed={item.value === value}
						aria-describedby={describedBy}
						onclick={() => pick(item.value)}>{item.text}</button
					>
				{/snippet}
			</Hinweis>
		{/each}
	</div>
</div>
