<script lang="ts">
	import { Trash2, GitCompare } from '@lucide/svelte';
	import type { Bookmark } from '$lib/state/bookmark-schema.js';
	import { extractPrimaryName } from './internal/address-subline.js';

	type Props = {
		bookmark: Bookmark;
		showCompareAction?: boolean;
		onSelect: (bookmark: Bookmark) => void;
		onConfirmDelete: (id: string) => void;
		onAddToCompare?: (bookmark: Bookmark) => void;
	};

	let {
		bookmark,
		showCompareAction = false,
		onSelect,
		onConfirmDelete,
		onAddToCompare
	}: Props = $props();

	let confirming = $state(false);
	let revertTimer: ReturnType<typeof setTimeout> | null = null;

	function clearRevertTimer(): void {
		if (revertTimer !== null) {
			clearTimeout(revertTimer);
			revertTimer = null;
		}
	}

	function startConfirm(): void {
		confirming = true;
		clearRevertTimer();
		revertTimer = setTimeout(() => {
			confirming = false;
			revertTimer = null;
		}, 8000);
	}

	function cancelConfirm(): void {
		confirming = false;
		clearRevertTimer();
	}

	function confirmDelete(): void {
		clearRevertTimer();
		confirming = false;
		onConfirmDelete(bookmark.id);
	}

	const primaryName = $derived(extractPrimaryName(bookmark.displayName));
	const subtext = $derived([bookmark.bezirk, bookmark.postcode].filter(Boolean).join(' · '));
</script>

<li data-testid="bookmark-row" data-bookmark-id={bookmark.id}>
	{#if confirming}
		<div
			data-testid="bookmark-confirm"
			role="group"
			aria-label="Bookmark löschen bestätigen"
			class="flex items-center justify-between gap-2 px-6 py-3"
		>
			<span class="font-mono text-xs text-ink">Wirklich löschen?</span>
			<div class="flex items-center gap-1.5">
				<button
					type="button"
					data-testid="bookmark-confirm-cancel"
					onclick={cancelConfirm}
					class="min-h-[44px] border border-rule px-3 py-1 font-mono text-xs text-ink hover:bg-bg"
				>
					Abbrechen
				</button>
				<button
					type="button"
					data-testid="bookmark-confirm-delete"
					onclick={confirmDelete}
					class="min-h-[44px] border border-accent bg-accent-soft px-3 py-1 font-mono text-xs text-ink hover:bg-accent hover:text-bg"
				>
					Löschen
				</button>
			</div>
		</div>
	{:else}
		<div class="flex items-stretch">
			<button
				type="button"
				data-testid="bookmark-select"
				onclick={() => onSelect(bookmark)}
				title={bookmark.displayName}
				class="flex min-h-[44px] flex-1 flex-col items-start justify-center gap-0.5 px-6 py-2.5 text-left hover:bg-bg"
			>
				<span class="font-sans text-sm text-ink">{primaryName}</span>
				{#if subtext}
					<span class="font-sans text-xs text-ink-muted">{subtext}</span>
				{/if}
			</button>
			<div class="flex items-center gap-0.5 pr-3">
				{#if showCompareAction && onAddToCompare}
					<button
						type="button"
						data-testid="bookmark-compare"
						onclick={() => onAddToCompare(bookmark)}
						aria-label={`„${primaryName}" zum Vergleich hinzufügen`}
						class="inline-flex h-10 w-10 items-center justify-center text-ink-muted hover:text-ink"
					>
						<GitCompare size={16} aria-hidden="true" />
					</button>
				{/if}
				<button
					type="button"
					data-testid="bookmark-delete"
					onclick={startConfirm}
					aria-label={`„${primaryName}" löschen`}
					class="inline-flex h-10 w-10 items-center justify-center text-ink-muted hover:text-ink"
				>
					<Trash2 size={16} aria-hidden="true" />
				</button>
			</div>
		</div>
	{/if}
</li>
