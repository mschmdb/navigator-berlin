<!-- Select ohne Browser-Optik mit eigenem Pfeil (#200), Label sichtbar darüber. -->
<script lang="ts" generics="T extends string">
	import Hinweis from './hinweis.svelte';
	import './steuerung.css';

	interface Item {
		readonly value: T;
		readonly text: string;
	}

	interface Props {
		readonly label: string;
		readonly items: readonly Item[];
		value: T;
		readonly help?: string;
		readonly onchange?: (value: T) => void;
	}

	let { label, items, value = $bindable(), help, onchange }: Props = $props();

	const id = $props.id();

	function change(e: Event & { currentTarget: HTMLSelectElement }): void {
		const next = items.find((i) => i.value === e.currentTarget.value);
		if (!next) return;
		value = next.value;
		onchange?.(next.value);
	}
</script>

<div class="bq-ctl">
	<label class="bq-lab" for="{id}-sel">{label}</label>
	<Hinweis text={help}>
		{#snippet children(describedBy)}
			<select id="{id}-sel" class="bq-sel" aria-describedby={describedBy} {value} onchange={change}>
				{#each items as item (item.value)}
					<option value={item.value}>{item.text}</option>
				{/each}
			</select>
		{/snippet}
	</Hinweis>
</div>
