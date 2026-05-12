<script lang="ts">
	import { Link2 } from '@lucide/svelte';

	type Props = { onCopy?: () => Promise<void> | void };
	let { onCopy }: Props = $props();

	let copied = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | null = null;

	async function defaultCopy(): Promise<void> {
		if (typeof navigator === 'undefined' || !navigator.clipboard) return;
		await navigator.clipboard.writeText(window.location.href);
	}

	async function handleClick(): Promise<void> {
		try {
			await (onCopy ?? defaultCopy)();
			copied = true;
			if (resetTimer) clearTimeout(resetTimer);
			resetTimer = setTimeout(() => {
				copied = false;
				resetTimer = null;
			}, 2000);
		} catch {
			copied = false;
		}
	}
</script>

<div class="flex items-center gap-2 text-sm">
	<button
		type="button"
		onclick={handleClick}
		data-testid="permalink-button"
		class="inline-flex items-center gap-1.5 border-b border-rule-strong text-ink hover:text-ink"
	>
		<Link2 size={14} aria-hidden="true" />
		<span>Permalink kopieren</span>
	</button>
	<span aria-live="polite" data-testid="permalink-status" class="text-ink-muted">
		{#if copied}URL kopiert{/if}
	</span>
</div>
