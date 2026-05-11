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
			class="fixed bottom-0 inset-x-0 z-50 max-h-[40vh] overflow-auto border-t border-rule-strong bg-bg-elevated p-6 text-ink"
		>
			{@render children()}
		</BitsDialog.Content>
	</BitsDialog.Portal>
</BitsDialog.Root>
