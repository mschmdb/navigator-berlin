<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		value?: string;
		children: Snippet;
		class?: string;
	};

	let { value = $bindable(''), children, class: className }: Props = $props();
</script>

<BitsTabs.Root bind:value class="flex flex-col gap-3 {className ?? ''}">
	{@render children()}
</BitsTabs.Root>
