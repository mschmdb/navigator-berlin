<script lang="ts">
	import { Accordion as BitsAccordion } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		value?: string;
		children: Snippet;
		class?: string;
	};

	let { value = $bindable(''), children, class: className }: Props = $props();
</script>

<BitsAccordion.Root bind:value type="single" class="divide-y divide-rule {className ?? ''}">
	{@render children()}
</BitsAccordion.Root>
