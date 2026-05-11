<script lang="ts">
	import { Tooltip as BitsTooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		trigger: Snippet;
		children: Snippet;
	};

	let { open = $bindable(false), trigger, children }: Props = $props();
</script>

<BitsTooltip.Provider>
	<BitsTooltip.Root bind:open>
		<BitsTooltip.Trigger>{@render trigger()}</BitsTooltip.Trigger>
		<BitsTooltip.Portal>
			<BitsTooltip.Content
				class="z-50 max-w-[240px] border border-rule-strong bg-ink px-2 py-1 text-xs text-bg"
			>
				{@render children()}
			</BitsTooltip.Content>
		</BitsTooltip.Portal>
	</BitsTooltip.Root>
</BitsTooltip.Provider>
