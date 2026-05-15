<script lang="ts">
	import { untrack } from 'svelte';
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';
	import type { Bookmark } from '$lib/state/bookmark-schema.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import type { Breakpoint } from '$lib/utils/use-viewport.svelte.js';
	import BookmarkDialog from './bookmark-dialog.svelte';

	type Props = {
		open?: boolean;
		initialBookmarks?: Bookmark[];
		selectedAddress?: GeocodeSuggestion | null;
		breakpoint?: Breakpoint;
		showCompareAction?: boolean;
	};

	let {
		open = true,
		initialBookmarks = [],
		selectedAddress = null,
		breakpoint = 'desktop',
		showCompareAction = false
	}: Props = $props();

	const ui = createUiState();
	const selection = provideAddressSelection();
	let comparePicks = $state<Bookmark[]>([]);

	untrack(() => {
		ui.bookmarksDialogOpen = open;
		ui.bookmarks = [...initialBookmarks];
		ui.selectedAddress = selectedAddress;
		if (selectedAddress) selection.set(selectedAddress);
	});
</script>

<BookmarkDialog
	{showCompareAction}
	initialBreakpoint={breakpoint}
	forceBreakpoint
	onCompareSelect={(bm) => comparePicks.push(bm)}
/>
<pre data-testid="ui-dump">{JSON.stringify({
		open: ui.bookmarksDialogOpen,
		count: ui.bookmarks.length,
		ids: ui.bookmarks.map((b) => b.id),
		selectedId: selection.current?.id ?? null,
		inspectorOpen: ui.inspectorOpen,
		comparePicks: comparePicks.map((b) => b.id)
	})}</pre>
