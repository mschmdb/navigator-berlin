<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
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
	const neighborGroup = $derived(
		level === 'kiez' ? m.place_ref_neighbor_kiez_group() : m.place_ref_neighbor_bezirk_group()
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

	/** Mobil: eine native Auswahl für alles, der Wert ist `kind:slug`. */
	const compactValue = $derived(`${choice.kind}:${choice.slug ?? ''}`);
	function pickCompact(value: string) {
		const [kind, slug] = value.split(':') as [ReferenceKind, string];
		onchoice({ kind, slug: slug || null });
	}
</script>

<div
	class="sticky top-[var(--site-header-h)] z-20 border-b border-rule bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85"
>
	<div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 lg:gap-6">
		<!-- Desktop: Voreinstellungen sichtbar, Detail-Auswahl erscheint nur, wo sie gebraucht wird -->
		<fieldset class="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
			<legend class="sr-only">{m.place_ref_compare_with()}</legend>
			<span class="shrink-0 text-dense-label text-ink-subtle" aria-hidden="true"
				>{m.place_ref_compare_with()}</span
			>
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
				<label class="flex min-w-0 items-center gap-2 text-sm">
					<span class="sr-only">{m.place_ref_choose({ label: active.label })}</span>
					<select
						class="min-h-8 max-w-64 rounded border border-rule-strong bg-bg-elevated px-2 text-sm"
						value={choice.slug ?? ''}
						onchange={(e) => onchoice({ kind: active.kind, slug: e.currentTarget.value })}
					>
						{#if active.kind === 'frei'}
							{#each groups as [g, opts] (g)}
								<optgroup label={g}>
									{#each opts as o (o.slug)}<option value={o.slug}>{o.name}</option>{/each}
								</optgroup>
							{/each}
						{:else}
							{#each active.list as o (o.slug)}<option value={o.slug}>{o.name}</option>{/each}
						{/if}
					</select>
				</label>
				{#if active.kind === 'aehnlich'}
					<span class="hidden truncate text-dense-label text-ink-subtle xl:inline"
						>{m.place_ref_similar_hint()}</span
					>
				{/if}
			{:else if active.kind === 'berlin'}
				<span class="truncate text-dense-label text-ink-subtle">{berlinNote}</span>
			{/if}
		</fieldset>

		<!-- Mobil: eine native Auswahl, der Picker des Telefons trägt die lange Liste -->
		<label class="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
			<span class="shrink-0 text-dense-label text-ink-subtle">{m.place_ref_compare_short()}</span>
			<select
				class="min-h-9 w-full min-w-0 rounded border border-rule-strong bg-bg-elevated px-2 text-sm"
				value={compactValue}
				onchange={(e) => pickCompact(e.currentTarget.value)}
			>
				<option value="berlin:">Berlin</option>
				{#if bezirkLabel}<option value="bezirk:">{bezirkLabel}</option>{/if}
				{#if neighbors.length > 0}
					<optgroup label={neighborGroup}>
						{#each neighbors as o (o.slug)}<option value="nachbar:{o.slug}">{o.name}</option>{/each}
					</optgroup>
				{/if}
				{#if similar.length > 0}
					<optgroup label={m.place_ref_similar_group()}>
						{#each similar as o (o.slug)}<option value="aehnlich:{o.slug}">{o.name}</option>{/each}
					</optgroup>
				{/if}
				{#each groups as [g, opts] (g)}
					<optgroup label={g || freeLabel}>
						{#each opts as o (o.slug)}<option value="frei:{o.slug}">{o.name}</option>{/each}
					</optgroup>
				{/each}
			</select>
		</label>

		<div
			class="flex shrink-0 rounded-full border border-rule-strong p-0.5"
			role="group"
			aria-label={m.place_ref_view()}
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
				onclick={() => onmode('zahlen')}
				><span class="lg:hidden">{m.place_ref_tables_short()}</span><span class="hidden lg:inline"
					>{m.place_ref_tables_long()}</span
				></button
			>
		</div>
	</div>
	{#if chapters.length > 0}
		<nav aria-label={m.place_ref_nav()} class="border-t border-rule">
			<ul class="mx-auto flex max-w-6xl [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 py-1.5">
				{#each chapters as c (c.id)}
					<li class="shrink-0">
						<a
							href="#{c.id}"
							class="inline-flex min-h-7 items-center rounded-full bg-bg-elevated px-3 text-sm text-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
							>{c.short}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
	<p class="sr-only" aria-live="polite">
		{m.place_ref_live({
			label:
				active.label +
				(choice.slug ? `, ${all.find((o) => o.slug === choice.slug)?.name ?? ''}` : '')
		})}
	</p>
</div>
