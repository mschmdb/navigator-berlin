<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { RichSegment } from '$lib/i18n/rich-text.js';

	type Props = {
		segments: readonly RichSegment[];
		/** Rendert ein ausgezeichnetes Segment (`{name_start}Text{name_end}`). */
		tag: Snippet<[text: string, name: string]>;
	};

	let { segments, tag }: Props = $props();
</script>

{#each segments as seg, i (i)}{#if seg.tag}{@render tag(
			seg.text,
			seg.tag
		)}{:else}{seg.text}{/if}{/each}
