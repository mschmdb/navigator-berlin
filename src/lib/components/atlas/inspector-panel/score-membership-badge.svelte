<!--
	Story 14.11: Pro Inspector-Layer-Card ein Badge, das zeigt, ob der Layer in den Kiez-Score
	einfließt (V1) und in welche Dimension. Score-Inputs sind klickbar und springen zur Dimension.
	Kontext-Layer bekommen ein neutrales „Kontext"-Tag (+ ggf. einen klärenden Hinweis, V5).
-->
<script lang="ts">
	import { ArrowUp } from '@lucide/svelte';
	import {
		scoreDimensionFor,
		scoreDimensionLabelFor,
		contextNoteFor
	} from './internal/score-membership.js';

	type Props = {
		slug: string;
		/** Sprung zur Score-Dimension (Konsument scrollt die Zeile in den Blick). */
		onJump?: (dimension: string) => void;
	};
	let { slug, onJump }: Props = $props();

	const dimension = $derived(scoreDimensionFor(slug));
	const label = $derived(scoreDimensionLabelFor(slug));
	const note = $derived(contextNoteFor(slug));
</script>

<div class="mb-1 flex items-baseline gap-2" data-testid="score-membership-{slug}">
	{#if dimension && label}
		<button
			type="button"
			data-testid="score-membership-link-{slug}"
			class="inline-flex items-center gap-1 rounded-sm bg-severity-success-soft-bg px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-severity-success-soft uppercase hover:underline"
			onclick={() => onJump?.(dimension)}
			title="Im Kiez-Score · {label} (zur Dimension springen)"
		>
			<ArrowUp size={11} aria-hidden="true" />
			Im Score · {label}
		</button>
	{:else}
		<span
			data-testid="score-membership-context-{slug}"
			class="rounded-sm bg-bg px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
		>
			Kontext · nicht im Score
		</span>
	{/if}
</div>
{#if note}
	<p
		class="mb-1 font-serif text-[11px] leading-snug text-ink-muted italic"
		data-testid="context-note-{slug}"
	>
		{note}
	</p>
{/if}
