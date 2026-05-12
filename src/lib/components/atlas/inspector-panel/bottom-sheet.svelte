<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronUp, ChevronDown } from '@lucide/svelte';
	import type { SheetSnapVh } from '$lib/state/ui-context.svelte.js';

	type Props = {
		open: boolean;
		snapVh: SheetSnapVh;
		onSnap: (vh: SheetSnapVh) => void;
		onClose: () => void;
		ariaLabel?: string;
		children: Snippet;
	};

	let {
		open,
		snapVh,
		onSnap,
		onClose,
		ariaLabel = 'Inspektor-Panel',
		children
	}: Props = $props();

	const SNAP_CYCLE: SheetSnapVh[] = [40, 70, 100];

	function nextSnap(): void {
		const idx = SNAP_CYCLE.indexOf(snapVh);
		const next = SNAP_CYCLE[(idx + 1) % SNAP_CYCLE.length];
		onSnap(next);
	}

	function prevSnap(): void {
		const idx = SNAP_CYCLE.indexOf(snapVh);
		const next = SNAP_CYCLE[(idx - 1 + SNAP_CYCLE.length) % SNAP_CYCLE.length];
		onSnap(next);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	}
</script>

{#if open}
	<div
		role="dialog"
		aria-modal="false"
		aria-label={ariaLabel}
		data-testid="bottom-sheet"
		data-snap-vh={snapVh}
		onkeydown={handleKeydown}
		tabindex="-1"
		style={`height:${snapVh}vh`}
		class="fixed inset-x-0 bottom-0 z-40 flex flex-col border-t border-rule-strong bg-bg-elevated shadow-lg"
	>
		<div class="flex items-center justify-between border-b border-rule px-4 py-2">
			<button
				type="button"
				data-testid="sheet-drag-handle"
				class="mx-auto h-1.5 w-12 rounded-full bg-rule-strong"
				aria-hidden="true"
				tabindex="-1"
				onclick={nextSnap}
			></button>
			<div class="flex items-center gap-1">
				<button
					type="button"
					data-testid="sheet-expand"
					onclick={nextSnap}
					aria-label="Sheet vergrößern"
					class="rounded-sm p-1 text-ink-muted hover:text-ink"
				>
					<ChevronUp size={18} aria-hidden="true" />
				</button>
				<button
					type="button"
					data-testid="sheet-shrink"
					onclick={prevSnap}
					aria-label="Sheet verkleinern"
					class="rounded-sm p-1 text-ink-muted hover:text-ink"
				>
					<ChevronDown size={18} aria-hidden="true" />
				</button>
			</div>
		</div>
		<div class="flex-1 overflow-auto">
			{@render children()}
		</div>
	</div>
{/if}
