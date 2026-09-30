<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from '@lucide/svelte';
	import AddressSearch from './address-search.svelte';
	import type { GeocodeSuggestion } from '$lib/data';
	import { m } from '$lib/paraglide/messages.js';

	type Props = {
		open: boolean;
		geocode: (q: string) => Promise<GeocodeSuggestion[]>;
		onSelect?: (s: GeocodeSuggestion) => void;
		onClose: () => void;
	};

	let { open, geocode, onSelect, onClose }: Props = $props();
	let overlayEl: HTMLDivElement | null = $state(null);
	let prevActive: Element | null = null;

	$effect(() => {
		if (!open) return;
		prevActive = typeof document !== 'undefined' ? document.activeElement : null;
		queueMicrotask(() => {
			const input = overlayEl?.querySelector('input') as HTMLInputElement | null;
			input?.focus();
		});
	});

	function handleSelect(s: GeocodeSuggestion): void {
		onSelect?.(s);
		onClose();
	}

	onMount(() => {
		function onKey(e: KeyboardEvent): void {
			if (e.key === 'Escape' && open) {
				e.preventDefault();
				onClose();
				if (prevActive instanceof HTMLElement) prevActive.focus();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<div
		role="presentation"
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-3 pt-[8vh]"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={() => {}}
	>
		<div
			bind:this={overlayEl}
			role="dialog"
			aria-modal="true"
			aria-label={m.shell_address_search_overlay_aria_label()}
			data-testid="address-search-overlay"
			class="w-full max-w-2xl rounded-md border border-rule-strong bg-bg-elevated p-4"
		>
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="font-serif text-lg text-ink">{m.shell_address_search_overlay_heading()}</h2>
				<button
					type="button"
					data-testid="address-search-overlay-close"
					onclick={onClose}
					aria-label={m.shell_address_search_overlay_close_aria_label()}
					class="rounded-sm p-1 text-ink-muted hover:text-ink"
				>
					<X size={18} aria-hidden="true" />
				</button>
			</div>
			<AddressSearch
				variant="hero"
				{geocode}
				onSelect={handleSelect}
				placeholder={m.shell_address_search_placeholder()}
				notFoundLabel={m.shell_address_search_not_found()}
				noSuggestionsLabel={m.shell_address_search_no_suggestions()}
				suggestionsCountLabel={(count) =>
					(count === 1
						? m.shell_address_search_suggestions_count_singular
						: m.shell_address_search_suggestions_count_plural)({ count })}
			/>
		</div>
	</div>
{/if}
