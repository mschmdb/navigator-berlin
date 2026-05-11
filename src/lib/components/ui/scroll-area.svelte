<script lang="ts">
	import { ScrollArea as BitsScrollArea } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<BitsScrollArea.Root class="relative overflow-hidden {className ?? ''}">
	<BitsScrollArea.Viewport class="h-full w-full">
		{@render children()}
	</BitsScrollArea.Viewport>
	<BitsScrollArea.Scrollbar
		orientation="vertical"
		class="flex w-2 touch-none select-none bg-bg-elevated"
	>
		<BitsScrollArea.Thumb class="flex-1 rounded-full bg-rule-strong" />
	</BitsScrollArea.Scrollbar>
</BitsScrollArea.Root>
