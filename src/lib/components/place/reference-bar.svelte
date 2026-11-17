<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { ChevronDown } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { ReferenceChoice, ReferenceKind } from '$lib/place/types';

	export interface RefOption {
		readonly slug: string;
		readonly name: string;
		/** Gruppe in der Auswahl „frei“, etwa der Bezirk. */
		readonly group?: string;
	}

	interface Props {
		/** „Berlin“-Option, mit Erklärung („Median aller 143 Kieze“). */
		berlinNote: string;
		bezirkLabel: string | null;
		neighbors: readonly RefOption[];
		similar: readonly RefOption[];
		all: readonly RefOption[];
		freeLabel: string;
		/** Bestimmt die Wörter „Nachbarkiez“ oder „Nachbarbezirk“. */
		level?: 'kiez' | 'bezirk';
		choice: ReferenceChoice;
		mode: 'erzaehlen' | 'zahlen';
		onchoice: (c: ReferenceChoice) => void;
		onmode: (m: 'erzaehlen' | 'zahlen') => void;
		/** Sprungleiste zu den Kapiteln. */
		chapters?: readonly { id: string; short: string }[];
	}
	let {
		berlinNote,
		bezirkLabel,
		neighbors,
		similar,
		all,
		freeLabel,
		level = 'kiez',
		choice,
		mode,
		onchoice,
		onmode,
		chapters = []
	}: Props = $props();

	interface KindOption {
		kind: ReferenceKind;
		label: string;
		list: readonly RefOption[];
	}
	const neighborLabel = $derived(
		level === 'kiez' ? m.place_ref_neighbor_kiez() : m.place_ref_neighbor_bezirk()
	);
	const kinds = $derived(
		[
			{ kind: 'berlin', label: m.place_side_berlin(), list: [] },
			bezirkLabel ? { kind: 'bezirk', label: bezirkLabel, list: [] } : null,
			neighbors.length > 0 ? { kind: 'nachbar', label: neighborLabel, list: neighbors } : null,
			similar.length > 0
				? { kind: 'aehnlich', label: m.place_ref_similar_kiez(), list: similar }
				: null,
			{ kind: 'frei', label: freeLabel, list: all }
		].filter((k): k is KindOption => k !== null)
	);
	const active = $derived(kinds.find((k) => k.kind === choice.kind) ?? kinds[0]);

	const groups = $derived.by(() => {
		const map = new SvelteMap<string, RefOption[]>();
		for (const o of all) {
			const g = o.group ?? '';
			map.set(g, [...(map.get(g) ?? []), o]);
		}
		return [...map.entries()];
	});

	function pickKind(kind: ReferenceKind) {
		const k = kinds.find((x) => x.kind === kind);
		if (!k) return;
		const keep = k.list.some((o) => o.slug === choice.slug) ? choice.slug : null;
		onchoice({ kind, slug: k.list.length > 0 ? (keep ?? k.list[0].slug) : null });
	}

	/** Der Vergleich sitzt als kompaktes Menü in der Kapitelleiste: nur eine Leiste bleibt stehen. */
	let open = $state(false);
	let toggle = $state<HTMLButtonElement>();
	let panel = $state<HTMLDivElement>();
	const current = $derived(
		choice.slug ? (all.find((o) => o.slug === choice.slug)?.name ?? active.label) : active.label
	);
	function close(focusButton = false) {
		open = false;
		if (focusButton) toggle?.focus();
	}
	function onWindowPointer(e: PointerEvent) {
		const t = e.target as Node | null;
		if (open && t && !panel?.contains(t) && !toggle?.contains(t)) close();
	}
	function onKey(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close(true);
	}
</script>

<svelte:window onpointerdown={onWindowPointer} onkeydown={onKey} />

<div
	class="place-sticky-bar sticky top-0 z-20 border-b border-rule bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85"
>
	<div class="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4">
		{#if chapters.length > 0}
			<nav aria-label={m.place_ref_nav()} class="min-w-0 flex-1">
				<ul class="flex [scrollbar-width:none] gap-1.5 overflow-x-auto py-1">
					{#each chapters as c (c.id)}
						<li class="shrink-0">
							<a
								href="#{c.id}"
								class="inline-flex min-h-8 items-center rounded-full bg-bg-elevated px-3 text-sm text-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
								>{c.short}</a
							>
						</li>
					{/each}
				</ul>
			</nav>
		{:else}
			<div class="flex-1"></div>
		{/if}
		<div class="relative shrink-0">
			<button
				bind:this={toggle}
				type="button"
				class="inline-flex min-h-8 max-w-48 items-center gap-1 rounded-full border border-rule-strong bg-bg-elevated px-3 text-sm text-ink hover:border-accent sm:max-w-72"
				aria-expanded={open}
				aria-controls="place-compare-panel"
				onclick={() => (open = !open)}
			>
				<span class="shrink-0 text-ink-subtle">{m.place_ref_compare_short()}:</span>
				<span class="truncate">{current}</span>
				<ChevronDown size={14} aria-hidden="true" class="shrink-0" />
			</button>
			<div
				bind:this={panel}
				id="place-compare-panel"
				hidden={!open}
				class="absolute top-full right-0 mt-2 w-[min(26rem,calc(100vw-2rem))] rounded border border-rule-strong bg-bg-elevated p-4 shadow-lg"
			>
				<fieldset class="flex min-w-0 flex-col gap-3">
					<legend class="mb-2 text-sm font-semibold text-ink">{m.place_ref_compare_with()}</legend>
					<div class="flex flex-wrap gap-1">
						{#each kinds as k (k.kind)}
							<label
								class="relative inline-flex min-h-8 cursor-pointer items-center rounded-full border border-rule-strong px-3
								text-sm text-ink hover:border-accent
								has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-bg
								has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
							>
								<input
									type="radio"
									name="vs-kind"
									class="sr-only"
									value={k.kind}
									checked={choice.kind === k.kind}
									onchange={() => pickKind(k.kind)}
								/>
								{k.label}
							</label>
						{/each}
					</div>
					{#if active.list.length > 0}
						<label class="flex min-w-0 flex-col gap-1 text-sm">
							<span class="text-dense-label text-ink-subtle"
								>{m.place_ref_choose({ label: active.label })}</span
							>
							<select
								class="min-h-9 w-full rounded border border-rule-strong bg-bg px-2 text-sm"
								value={choice.slug ?? ''}
								onchange={(e) => onchoice({ kind: active.kind, slug: e.currentTarget.value })}
							>
								{#if active.kind === 'frei'}
									{#each groups as [g, opts] (g)}
										<optgroup label={g || freeLabel}>
											{#each opts as o (o.slug)}<option value={o.slug}>{o.name}</option>{/each}
										</optgroup>
									{/each}
								{:else}
									{#each active.list as o (o.slug)}<option value={o.slug}>{o.name}</option>{/each}
								{/if}
							</select>
						</label>
						{#if active.kind === 'aehnlich'}
							<p class="text-dense-label text-ink-subtle">{m.place_ref_similar_hint()}</p>
						{/if}
					{:else if active.kind === 'berlin'}
						<p class="text-dense-label text-ink-subtle">{berlinNote}</p>
					{/if}
				</fieldset>
				<div class="mt-4 flex items-center gap-3 border-t border-rule pt-3">
					<span class="text-dense-label text-ink-subtle" id="place-view-label"
						>{m.place_ref_view()}</span
					>
					<div
						class="flex shrink-0 rounded-full border border-rule-strong p-0.5"
						role="group"
						aria-labelledby="place-view-label"
					>
						<button
							type="button"
							class="min-h-7 rounded-full px-3 text-sm aria-pressed:bg-ink aria-pressed:text-bg"
							aria-pressed={mode === 'erzaehlen'}
							onclick={() => onmode('erzaehlen')}>{m.place_ref_charts()}</button
						>
						<button
							type="button"
							class="min-h-7 rounded-full px-3 text-sm aria-pressed:bg-ink aria-pressed:text-bg"
							aria-pressed={mode === 'zahlen'}
							onclick={() => onmode('zahlen')}>{m.place_ref_tables_long()}</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>
	<p class="sr-only" aria-live="polite">
		{m.place_ref_live({
			label:
				active.label +
				(choice.slug ? `, ${all.find((o) => o.slug === choice.slug)?.name ?? ''}` : '')
		})}
	</p>
</div>
