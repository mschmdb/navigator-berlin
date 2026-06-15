<script lang="ts">
	import { Dialog as BitsDialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		trigger: Snippet;
		children: Snippet;
	};

	let { open = $bindable(false), trigger, children }: Props = $props();
</script>

<BitsDialog.Root bind:open>
	<BitsDialog.Trigger>{@render trigger()}</BitsDialog.Trigger>
	<BitsDialog.Portal>
		<BitsDialog.Content
			class="fixed top-1/2 left-1/2 z-50 max-h-[80vh] max-w-[600px] -translate-x-1/2 -translate-y-1/2 overflow-auto border border-rule-strong bg-bg-elevated p-6 text-ink"
		>
			{@render children()}
		</BitsDialog.Content>
	</BitsDialog.Portal>
</BitsDialog.Root>
