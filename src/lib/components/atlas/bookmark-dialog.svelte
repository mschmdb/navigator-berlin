<script lang="ts">
	import { onMount } from 'svelte';
	import { X, BookmarkPlus, Check } from '@lucide/svelte';
	import {
		getUiState,
		addBookmark,
		removeBookmark,
		clearBookmarks
	} from '$lib/state/ui-context.svelte.js';
	import { useAddressSelection } from '$lib/state/address-selection.svelte.js';
	import {
		MAX_BOOKMARKS,
		createBookmark,
		isBookmarked,
		persistBookmarks,
		bookmarkToSuggestion
	} from '$lib/state/bookmark-store.js';
	import type { Bookmark } from '$lib/state/bookmark-schema.js';
	import BottomSheet from './inspector-panel/bottom-sheet.svelte';
	import BookmarkRow from './bookmark-row.svelte';
	import { classifyViewportWidth, type Breakpoint } from '$lib/utils/use-viewport.svelte.js';
	import { createFocusTrap } from '$lib/utils/focus-trap.js';

	type Props = {
		showCompareAction?: boolean;
		onCompareSelect?: (bookmark: Bookmark) => void;
		initialBreakpoint?: Breakpoint;
		forceBreakpoint?: boolean;
	};

	let {
		showCompareAction = false,
		onCompareSelect,
		initialBreakpoint = 'desktop',
		forceBreakpoint = false
	}: Props = $props();

	const ui = getUiState();
	const selection = useAddressSelection();

	let windowBreakpoint = $state<Breakpoint | null>(null);
	const breakpoint = $derived(windowBreakpoint ?? initialBreakpoint);
	const isMobile = $derived(breakpoint === 'mobile');

	let dialogEl: HTMLDivElement | null = $state(null);
	let saveJustHappened = $state(false);
	let liveMessage = $state('');
	let persistFailed = $state(false);
	let previouslyFocused: HTMLElement | null = null;

	const sortedBookmarks = $derived(
		[...ui.bookmarks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	);
	const currentLat = $derived(ui.selectedAddress?.lat);
	const currentLng = $derived(ui.selectedAddress?.lng);
	const alreadyBookmarked = $derived.by(() => {
		if (currentLat === undefined || currentLng === undefined) return false;
		return isBookmarked({ schemaVersion: 1, bookmarks: ui.bookmarks }, currentLat, currentLng);
	});
	const limitReached = $derived(ui.bookmarks.length >= MAX_BOOKMARKS);
	const canSave = $derived(ui.selectedAddress !== null && !alreadyBookmarked && !limitReached);

	function syncBreakpoint(): void {
		if (typeof window === 'undefined') return;
		windowBreakpoint = classifyViewportWidth(window.innerWidth);
	}

	function close(): void {
		ui.bookmarksDialogOpen = false;
		previouslyFocused?.focus();
		previouslyFocused = null;
	}

	function announce(msg: string): void {
		liveMessage = '';
		queueMicrotask(() => {
			liveMessage = msg;
		});
	}

	function handleSave(): void {
		if (!ui.selectedAddress) return;
		const bm = createBookmark({
			displayName: ui.selectedAddress.displayName,
			lat: ui.selectedAddress.lat,
			lng: ui.selectedAddress.lng,
			bezirk: ui.selectedAddress.bezirk,
			postcode: ui.selectedAddress.postcode
		});
		const ok = addBookmark(ui, bm);
		if (!ok) return;
		const persisted = persistBookmarks(typeof window === 'undefined' ? null : localStorage, {
			schemaVersion: 1,
			bookmarks: ui.bookmarks
		});
		persistFailed = !persisted;
		saveJustHappened = true;
		announce(`Adresse ${bm.displayName} gespeichert`);
		setTimeout(() => {
			saveJustHappened = false;
		}, 1800);
	}

	function handleSelect(bookmark: Bookmark): void {
		if (showCompareAction && onCompareSelect) {
			onCompareSelect(bookmark);
			close();
			return;
		}
		const suggestion = bookmarkToSuggestion(bookmark);
		selection.set(suggestion);
		close();
	}

	function handleDelete(id: string): void {
		const bm = ui.bookmarks.find((b) => b.id === id);
		removeBookmark(ui, id);
		if (bm) announce(`Bookmark ${bm.displayName} entfernt`);
	}

	let clearAllConfirming = $state(false);
	let clearAllTimer: ReturnType<typeof setTimeout> | null = null;

	function startClearAll(): void {
		clearAllConfirming = true;
		if (clearAllTimer) clearTimeout(clearAllTimer);
		clearAllTimer = setTimeout(() => {
			clearAllConfirming = false;
			clearAllTimer = null;
		}, 8000);
	}

	function cancelClearAll(): void {
		clearAllConfirming = false;
		if (clearAllTimer) {
			clearTimeout(clearAllTimer);
			clearAllTimer = null;
		}
	}

	function confirmClearAll(): void {
		clearBookmarks(ui);
		clearAllConfirming = false;
		if (clearAllTimer) {
			clearTimeout(clearAllTimer);
			clearAllTimer = null;
		}
		announce('Alle Bookmarks entfernt');
	}

	function handleAddToCompare(bookmark: Bookmark): void {
		onCompareSelect?.(bookmark);
		close();
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			return;
		}
		if (e.key === 'Tab' && dialogEl) {
			createFocusTrap(dialogEl).handleKeydown(e);
		}
	}

	function handleBackdrop(e: MouseEvent): void {
		if (e.target === e.currentTarget) close();
	}

	onMount(() => {
		if (!forceBreakpoint) syncBreakpoint();
		if (!forceBreakpoint && typeof window !== 'undefined') {
			window.addEventListener('resize', syncBreakpoint);
			return () => window.removeEventListener('resize', syncBreakpoint);
		}
	});

	let prevOpen = $state(false);
	$effect(() => {
		const open = ui.bookmarksDialogOpen;
		if (open === prevOpen) return;
		prevOpen = open;
		if (open) {
			previouslyFocused = (document.activeElement as HTMLElement | null) ?? null;
			queueMicrotask(() => {
				if (!dialogEl) return;
				const initial =
					(dialogEl.querySelector('[data-initial-focus]') as HTMLElement | null) ??
					(dialogEl.querySelector('[data-testid="bookmark-dialog-close"]') as HTMLElement | null);
				initial?.focus();
			});
		} else {
			cancelClearAll();
			persistFailed = false;
		}
	});
</script>

{#snippet dialogBody()}
	<header class="flex items-start justify-between gap-3 border-b border-rule px-6 pt-5 pb-4">
		<h2 id="bookmarks-dialog-title" class="font-serif text-xl leading-tight text-ink">
			Gespeicherte Adressen
		</h2>
		<button
			type="button"
			data-testid="bookmark-dialog-close"
			onclick={close}
			aria-label="Bookmark-Dialog schließen"
			class="rounded-sm p-1 text-ink-muted hover:text-ink"
		>
			<X size={18} aria-hidden="true" />
		</button>
	</header>

	{#if ui.selectedAddress}
		<div
			data-testid="bookmark-toolbar"
			class="sticky top-[var(--header-height,72px)] z-10 border-b border-rule bg-bg-elevated px-6 py-2"
		>
			{#if saveJustHappened}
				<div
					data-testid="bookmark-save-confirmation"
					class="flex items-center gap-2 font-sans text-sm text-ink"
				>
					<Check size={16} aria-hidden="true" class="shrink-0" />
					<span>Gespeichert.</span>
				</div>
			{:else if alreadyBookmarked}
				<p data-testid="bookmark-current-saved" class="font-sans text-sm text-ink-muted">
					Aktuelle Adresse ist bereits gespeichert.
				</p>
			{:else if limitReached}
				<p data-testid="bookmark-limit-reached" class="font-sans text-sm text-ink-muted">
					Limit erreicht ({MAX_BOOKMARKS}). Lösche alte Bookmarks zum Hinzufügen.
				</p>
			{:else}
				<button
					type="button"
					data-testid="bookmark-save"
					data-initial-focus
					onclick={handleSave}
					disabled={!canSave}
					class="inline-flex items-center gap-2 font-sans text-sm text-ink hover:text-ink disabled:opacity-40"
				>
					<BookmarkPlus size={16} aria-hidden="true" class="shrink-0" />
					<span>Aktuelle Adresse speichern</span>
				</button>
			{/if}
		</div>
	{/if}

	<div class="flex-1 overflow-y-auto">
		{#if sortedBookmarks.length === 0}
			<p
				data-testid="bookmark-empty"
				class="px-6 py-8 text-center font-serif text-sm text-ink-subtle italic"
			>
				Noch keine Bookmarks. Wähle eine Adresse und tippe auf das Bookmark-Symbol.
			</p>
		{:else}
			<ul role="list" data-testid="bookmark-list" class="divide-y divide-rule">
				{#each sortedBookmarks as bookmark (bookmark.id)}
					<BookmarkRow
						{bookmark}
						{showCompareAction}
						onSelect={handleSelect}
						onConfirmDelete={handleDelete}
						onAddToCompare={showCompareAction ? handleAddToCompare : undefined}
					/>
				{/each}
			</ul>
		{/if}
	</div>

	<footer class="flex items-center justify-between gap-3 border-t border-rule px-6 py-3">
		<div class="flex items-center gap-3">
			{#if sortedBookmarks.length > 0 && !clearAllConfirming}
				<button
					type="button"
					data-testid="bookmark-clear-all"
					onclick={startClearAll}
					class="font-mono text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
				>
					Alle löschen
				</button>
			{:else if clearAllConfirming}
				<span class="flex items-center gap-1.5">
					<span class="font-mono text-xs text-ink">Wirklich alle?</span>
					<button
						type="button"
						data-testid="bookmark-clear-all-cancel"
						onclick={cancelClearAll}
						class="min-h-[44px] border border-rule px-2 py-1 font-mono text-xs text-ink hover:bg-bg"
					>
						Abbrechen
					</button>
					<button
						type="button"
						data-testid="bookmark-clear-all-confirm"
						onclick={confirmClearAll}
						class="min-h-[44px] border border-accent bg-accent-soft px-2 py-1 font-mono text-xs text-ink hover:bg-accent hover:text-bg"
					>
						Löschen
					</button>
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			<a
				href="/datenschutz#bookmarks"
				data-testid="bookmark-privacy-link"
				class="font-mono text-xs text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
			>
				Datenschutz
			</a>
			<span data-testid="bookmark-counter" class="font-mono text-xs text-ink-subtle">
				{sortedBookmarks.length}/{MAX_BOOKMARKS}
			</span>
		</div>
	</footer>

	{#if persistFailed}
		<div
			data-testid="bookmark-persist-error"
			role="status"
			class="border-t border-rule-strong bg-severity-warning-bg px-4 py-2 font-mono text-xs text-ink"
		>
			Speicher nicht verfügbar. Bookmarks bleiben nur in dieser Session.
		</div>
	{/if}
{/snippet}

{#if ui.bookmarksDialogOpen}
	{#if isMobile}
		<BottomSheet
			open={ui.bookmarksDialogOpen}
			snapVh={40}
			onSnap={() => {}}
			onClose={close}
			ariaLabel="Gespeicherte Adressen"
		>
			<div
				bind:this={dialogEl}
				data-testid="bookmark-dialog"
				data-variant="sheet"
				role="dialog"
				aria-modal="true"
				aria-labelledby="bookmarks-dialog-title"
				onkeydown={handleKeydown}
				tabindex="-1"
				class="flex h-full flex-col"
			>
				{@render dialogBody()}
			</div>
		</BottomSheet>
	{:else}
		<div
			data-testid="bookmark-dialog-backdrop"
			onclick={handleBackdrop}
			onkeydown={handleKeydown}
			role="presentation"
			class="fixed inset-0 z-50 flex items-center justify-center p-4"
		>
			<div
				bind:this={dialogEl}
				data-testid="bookmark-dialog"
				data-variant="dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="bookmarks-dialog-title"
				tabindex="-1"
				class="flex max-h-[80vh] w-[480px] max-w-full flex-col rounded-md border border-rule-strong bg-bg-elevated text-ink shadow-lg"
			>
				{@render dialogBody()}
			</div>
		</div>
	{/if}
{/if}

<div aria-live="polite" aria-atomic="false" data-testid="bookmark-aria-live" class="sr-only">
	{liveMessage}
</div>
