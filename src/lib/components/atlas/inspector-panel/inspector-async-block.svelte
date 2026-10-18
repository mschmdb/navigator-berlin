<script lang="ts">
	// Hülle für einen nachladenden Inspector-Block. Beim Adresswechsel bleibt der
	// alte Inhalt stehen und wird nur leicht zurückgenommen (lc-stale), bis die
	// neue Antwort da ist. Ohne alten Wert steht ein Platzhalter in Endhöhe.
	import type { Snippet } from 'svelte';
	import type { Locale } from '$lib/paraglide/runtime';
	import InspectorSkeleton, { type InspectorSkeletonShape } from './inspector-skeleton.svelte';

	type Props = {
		busy: boolean;
		hasValue: boolean;
		shape: InspectorSkeletonShape;
		testid?: string;
		lang?: Locale;
		children: Snippet;
	};

	let { busy, hasValue, shape, testid, lang, children }: Props = $props();
</script>

<div
	data-testid={testid}
	aria-busy={busy ? 'true' : undefined}
	class={busy && hasValue ? 'lc-stale' : undefined}
>
	{#if busy && !hasValue}
		<InspectorSkeleton {shape} {lang} />
	{:else}
		{@render children()}
	{/if}
</div>
