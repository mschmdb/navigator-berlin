<!-- Kopf des Inspectors: Adresse, Schließen, Bookmark, Vergleichen, Teilen. Aus
     `inspector-panel.svelte` herausgelöst (GH-88, Datei unter 500 Zeilen). Kein Escape-Schließen
     (Entscheidung Matze, 17.10.2026). -->
<script lang="ts">
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { Share2, X, Bookmark, BookmarkCheck, Check, GitCompare } from '@lucide/svelte';
	import {
		getUiState,
		addBookmark,
		toggleCompareMode,
		openBookmarksDialog
	} from '$lib/state/ui-context.svelte.js';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { createBookmark, isBookmarked, persistBookmarks } from '$lib/state/bookmark-store.js';
	import { trackEvent } from '$lib/utils/plausible.js';
	import { buildOgImageUrl, type OgImageInput } from '$lib/utils/og-image-url.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { Locale } from '$lib/paraglide/runtime';
	import ShareSheet from './share-sheet.svelte';

	type Props = {
		addressName: string;
		addressPrimary: string;
		addressSubline: string;
		variant: 'panel' | 'sheet';
		lang: Locale;
		ogImageInput: OgImageInput | null;
		/** Baut den LLM-Export für den aktuellen Permalink (nur bei offenem Teilen-Dialog). */
		buildLlmMarkdown: (permalinkUrl: string) => string;
	};
	let {
		addressName,
		addressPrimary,
		addressSubline,
		variant,
		lang,
		ogImageInput,
		buildLlmMarkdown
	}: Props = $props();

	const localeOpts = $derived({ locale: lang });
	const ui = getUiState();

	function close(): void {
		ui.inspectorOpen = false;
	}

	const addressBookmarked = $derived.by(() => {
		if (!ui.selectedAddress) return false;
		return isBookmarked(
			{ schemaVersion: 1, bookmarks: ui.bookmarks },
			ui.selectedAddress.lat,
			ui.selectedAddress.lng
		);
	});

	let saveJustHappened = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	function handleBookmark(): void {
		const addr = ui.selectedAddress;
		if (!addr) return;
		if (addressBookmarked) {
			openBookmarksDialog(ui);
			return;
		}
		const bm = createBookmark({
			displayName: addr.displayName,
			lat: addr.lat,
			lng: addr.lng,
			bezirk: addr.bezirk,
			postcode: addr.postcode
		});
		if (!addBookmark(ui, bm)) return;
		persistBookmarks(typeof window === 'undefined' ? null : localStorage, {
			schemaVersion: 1,
			bookmarks: ui.bookmarks
		});
		trackEvent('Bookmark', addr.bezirk ? { bezirk: addr.bezirk } : undefined);
		saveJustHappened = true;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			saveJustHappened = false;
			saveTimer = null;
		}, 1800);
	}

	let shareOpen = $state(false);
	let shareTriggerEl: HTMLButtonElement | undefined = $state();

	function openShare(): void {
		shareOpen = true;
		trackEvent('Share');
	}

	function closeShare(): void {
		shareOpen = false;
		shareTriggerEl?.focus();
	}

	function currentHref(): string {
		return typeof window === 'undefined' ? '' : window.location.href;
	}

	function currentOrigin(): string {
		return typeof window === 'undefined' ? '' : window.location.origin;
	}

	const permalinkUrl = $derived(shareOpen ? currentHref() : '');
	const llmMarkdown = $derived(shareOpen ? buildLlmMarkdown(permalinkUrl) : '');
	const ogImageUrl = $derived(shareOpen ? buildOgImageUrl(ogImageInput, currentOrigin()) : null);
	const nativeShareData = $derived<ShareData>({
		title: addressName ? buildPageTitle(addressName) : 'navigator.berlin',
		text: ogImageInput?.topLayers.join(' · ') ?? '',
		url: permalinkUrl || currentHref()
	});

	const toolbarButton =
		'inline-flex min-h-(--target-min) items-center gap-1.5 border-b border-rule-strong text-sm text-ink hover:text-ink';
</script>

<div class="sticky top-0 z-10 bg-bg-elevated">
	<header class="flex items-start justify-between gap-3 border-b border-rule px-6 pt-5 pb-4">
		<div class="min-w-0">
			<h2
				class="text-xl leading-tight font-bold text-ink"
				data-testid="inspector-address"
				title={addressName}
			>
				{addressPrimary || addressName}
			</h2>
			{#if addressSubline}
				<p data-testid="inspector-address-subline" class="font-sans text-sm text-ink-muted">
					{addressSubline}
				</p>
			{/if}
		</div>
		<button
			type="button"
			onclick={close}
			data-testid="inspector-close"
			aria-label={m.inspector_panel_close_aria(undefined, localeOpts)}
			class="rounded-sm p-1 text-ink-muted hover:text-ink"
		>
			<X size={18} aria-hidden="true" />
		</button>
	</header>

	<div
		data-testid="inspector-toolbar"
		class="flex items-center justify-end gap-3 border-b border-rule px-6 py-2"
	>
		<div class="flex items-center gap-3">
			<button
				type="button"
				data-testid="inspector-bookmark-trigger"
				data-bookmarked={addressBookmarked ? 'true' : 'false'}
				onclick={handleBookmark}
				aria-label={addressBookmarked
					? m.inspector_bookmark_saved_open_list(undefined, localeOpts)
					: m.inspector_bookmark_save(undefined, localeOpts)}
				class={toolbarButton}
			>
				{#if saveJustHappened}
					<Check size={14} aria-hidden="true" />
					<span data-testid="inspector-bookmark-confirmation"
						>{m.inspector_bookmark_saved_label(undefined, localeOpts)}</span
					>
				{:else if addressBookmarked}
					<BookmarkCheck size={14} aria-hidden="true" />
					<span>{m.inspector_bookmark_saved_label(undefined, localeOpts)}</span>
				{:else}
					<Bookmark size={14} aria-hidden="true" />
					<span>{m.inspector_bookmark_label(undefined, localeOpts)}</span>
				{/if}
			</button>
			{#if featureFlags.compareMode}
				<button
					type="button"
					onclick={() => {
						if (!ui.compareMode) trackEvent('Compare');
						toggleCompareMode(ui);
					}}
					data-testid="compare-trigger"
					aria-label={m.inspector_compare_aria(undefined, localeOpts)}
					aria-pressed={ui.compareMode}
					class={toolbarButton}
				>
					<GitCompare size={14} aria-hidden="true" />
					<span>{m.inspector_compare_label(undefined, localeOpts)}</span>
				</button>
			{/if}
			<div class="relative">
				<button
					type="button"
					bind:this={shareTriggerEl}
					onclick={openShare}
					aria-haspopup="dialog"
					aria-expanded={shareOpen}
					aria-controls="inspector-share-sheet"
					data-testid="share-sheet-trigger"
					class={toolbarButton}
				>
					<Share2 size={14} aria-hidden="true" />
					<span>{m.inspector_share_trigger_label(undefined, localeOpts)}</span>
				</button>
				<div id="inspector-share-sheet">
					<ShareSheet
						open={shareOpen}
						onClose={closeShare}
						{permalinkUrl}
						llmExportText={llmMarkdown}
						{ogImageUrl}
						{addressName}
						variant={variant === 'sheet' ? 'sheet' : 'popover'}
						{nativeShareData}
						{lang}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
