<script lang="ts">
	import { Combobox as BitsCombobox } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		value?: string;
		children: Snippet;
	};

	let { value = $bindable(''), children }: Props = $props();
</script>

<BitsCombobox.Root bind:value type="single">
	{@render children()}
</BitsCombobox.Root>
