<script lang="ts">
	import { Combobox as BitsCombobox } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import { debounce } from '$lib/utils/debounce.js';
	import { trackEvent } from '$lib/utils/plausible.js';
	import type { GeocodeSuggestion } from '$lib/data';

	type Variant = 'hero' | 'header';
	type GeocodeFn = (q: string) => Promise<GeocodeSuggestion[]>;

	type Props = {
		variant?: Variant;
		placeholder?: string;
		value?: string;
		onSelect?: (suggestion: GeocodeSuggestion) => void;
		geocode: GeocodeFn;
		initialQuery?: string;
	};

	let {
		variant = 'hero',
		placeholder = 'Berliner Adresse eingeben',
		value = $bindable(''),
		onSelect,
		geocode,
		initialQuery = ''
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let query = $state(initialQuery);
	let suggestions = $state<GeocodeSuggestion[]>([]);
	let loading = $state(false);

	const trigger = debounce(async (q: string) => {
		if (q.length < 2) {
			suggestions = [];
			return;
		}
		loading = true;
		try {
			suggestions = await geocode(q);
		} finally {
			loading = false;
		}
	}, 250);

	$effect(() => {
		trigger(query);
	});

	const inputBase =
		'w-full bg-bg-elevated border border-rule-strong text-ink font-sans rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus';
	const inputHero = `${inputBase} px-4 py-3 text-xl`;
	const inputHeader = `${inputBase} pl-9 pr-3 py-2 text-base`;
	const inputClass = $derived(variant === 'hero' ? inputHero : inputHeader);
</script>

<BitsCombobox.Root
	type="single"
	inputValue={query}
	bind:value
	items={suggestions.map((s) => ({ value: s.id, label: s.displayName }))}
	onValueChange={(id) => {
		const picked = suggestions.find((s) => s.id === id);
		if (picked) {
			trackEvent('Search', { source: variant });
			onSelect?.(picked);
		}
	}}
>
	<div class="relative inline-block w-full">
		{#if variant === 'header'}
			<span
				data-testid="search-icon"
				class="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ink-subtle"
			>
				<Search size={16} aria-hidden="true" />
			</span>
		{/if}
		<BitsCombobox.Input
			{placeholder}
			class={inputClass}
			aria-label={placeholder}
			oninput={(e) => (query = (e.currentTarget as HTMLInputElement).value)}
		/>
	</div>

	<BitsCombobox.Portal>
		<BitsCombobox.Content
			class="z-50 mt-1 max-h-[60vh] w-[min(100vw-1rem,42rem)] overflow-auto rounded-md border border-rule-strong bg-bg-elevated"
		>
			{#each suggestions as s (s.id)}
				<BitsCombobox.Item
					value={s.id}
					label={s.displayName}
					class="block cursor-pointer truncate px-3 py-2 text-base text-ink data-[highlighted]:bg-rule"
				>
					{s.displayName}
				</BitsCombobox.Item>
			{/each}
			{#if !loading && query.length >= 2 && suggestions.length === 0}
				<p data-testid="address-search-empty" class="px-3 py-2 text-sm text-ink-muted">
					Adresse nicht gefunden. Bitte korrigieren oder Bezirks-Mittelpunkt wählen.
				</p>
			{/if}
		</BitsCombobox.Content>
	</BitsCombobox.Portal>

	<p aria-live="polite" class="sr-only">
		{suggestions.length === 0 ? 'Keine Vorschläge' : `${suggestions.length} Vorschläge`}
	</p>
</BitsCombobox.Root>
