<script lang="ts">
	import { ToggleGroup as BitsToggleGroup } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		value?: string;
		children: Snippet;
		class?: string;
	};

	let { value = $bindable(''), children, class: className }: Props = $props();
</script>

<BitsToggleGroup.Root
	bind:value
	type="single"
	class="inline-flex gap-1 border border-rule-strong bg-bg-elevated p-1 {className ?? ''}"
>
	{@render children()}
</BitsToggleGroup.Root>
