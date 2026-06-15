<script lang="ts">
	import { AlertDialog as BitsAlertDialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		trigger: Snippet;
		children: Snippet;
	};

	let { open = $bindable(false), trigger, children }: Props = $props();
</script>

<BitsAlertDialog.Root bind:open>
	<BitsAlertDialog.Trigger>{@render trigger()}</BitsAlertDialog.Trigger>
	<BitsAlertDialog.Portal>
		<BitsAlertDialog.Content
			class="fixed top-1/2 left-1/2 z-50 max-h-[80vh] max-w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-auto border border-state-error bg-bg-elevated p-6 text-ink"
		>
			{@render children()}
		</BitsAlertDialog.Content>
	</BitsAlertDialog.Portal>
</BitsAlertDialog.Root>
