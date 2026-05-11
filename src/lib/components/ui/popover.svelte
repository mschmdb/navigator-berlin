<script lang="ts">
	import { Popover as BitsPopover } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		trigger: Snippet;
		children: Snippet;
		class?: string;
	};

	let { open = $bindable(false), trigger, children, class: className }: Props = $props();
</script>

<BitsPopover.Root bind:open>
	<BitsPopover.Trigger>{@render trigger()}</BitsPopover.Trigger>
	<BitsPopover.Portal>
		<BitsPopover.Content
			class="z-50 max-w-[320px] border border-rule-strong bg-bg-elevated p-4 text-ink shadow-none {className ??
				''}"
		>
			{@render children()}
		</BitsPopover.Content>
	</BitsPopover.Portal>
</BitsPopover.Root>
