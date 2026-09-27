<script lang="ts">
	import { DropdownMenu as BitsDropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		trigger: Snippet;
		/**
		 * Extra attributes (`aria-label`, `class`, `data-testid`, …) spread
		 * onto the real trigger `<button>` -- bits-ui renders that button
		 * itself (no `child` render-prop), so a custom accessible name can't
		 * come from `trigger`'s content alone (that becomes the button's
		 * children, not its attributes). Typed off bits-ui's own
		 * `DropdownMenuTriggerProps` (minus the snippet props this wrapper
		 * already owns) instead of a hand-rolled `Record<string, unknown>`.
		 */
		triggerProps?: Omit<BitsDropdownMenu.TriggerProps, 'child' | 'children' | 'ref'>;
		children: Snippet;
		class?: string;
	};

	let {
		open = $bindable(false),
		trigger,
		triggerProps,
		children,
		class: className
	}: Props = $props();
</script>

<BitsDropdownMenu.Root bind:open>
	<BitsDropdownMenu.Trigger {...triggerProps}>{@render trigger()}</BitsDropdownMenu.Trigger>
	<BitsDropdownMenu.Portal>
		<BitsDropdownMenu.Content
			align="end"
			sideOffset={4}
			class="z-50 min-w-[10rem] border border-rule-strong bg-bg-elevated p-1 text-ink shadow-none {className ??
				''}"
		>
			{@render children()}
		</BitsDropdownMenu.Content>
	</BitsDropdownMenu.Portal>
</BitsDropdownMenu.Root>
