<script lang="ts" module>
	export type InspectorSkeletonShape = 'score' | 'wahl' | 'klima' | 'rows';
</script>

<script lang="ts">
	// Platzhalter in der ungefähren Endhöhe eines Inspector-Blocks: Zeilen mit
	// Linien wie im Inspector-Muster, damit beim ersten Laden nichts nachspringt.
	// Das Pulsieren läuft nur ohne reduced-motion (motion-safe in Skeleton).
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';

	type Props = { shape: InspectorSkeletonShape; lang?: Locale };
	let { shape, lang }: Props = $props();

	const localeOpts = $derived({ locale: lang ?? getLocale() });

	const ROWS: Record<InspectorSkeletonShape, number> = { score: 5, wahl: 5, klima: 0, rows: 6 };
	// Gemessene Endhöhen der geladenen Blöcke (Desktop, 18.10.): Score ~975 px,
	// Wahl ~830 px, Klima ~525 px, Demografie ~295 px. Kürzere Platzhalter
	// schieben beim Laden alles darunter weg.
	const MIN_HEIGHT: Record<InspectorSkeletonShape, string> = {
		score: 'min-h-[60rem]',
		wahl: 'min-h-[52rem]',
		klima: 'min-h-[33rem]',
		rows: 'min-h-[18rem]'
	};
	const rows = $derived(ROWS[shape]);
</script>

<div
	data-testid="inspector-skeleton"
	data-shape={shape}
	class={['space-y-3 py-1', MIN_HEIGHT[shape]]}
>
	<span class="sr-only">{m.inspector_block_loading(undefined, localeOpts)}</span>
	<Skeleton class="h-4 w-28" />
	{#if shape === 'score'}
		<div class="flex items-center gap-6 py-2">
			<Skeleton class="size-40 shrink-0 rounded-full" />
			<div class="flex-1 space-y-2">
				<Skeleton class="h-3 w-full" />
				<Skeleton class="h-3 w-5/6" />
				<Skeleton class="h-3 w-4/6" />
			</div>
		</div>
	{:else if shape === 'wahl'}
		<Skeleton class="h-8 w-full" />
		<Skeleton class="h-4 w-full" />
	{:else if shape === 'klima'}
		<Skeleton class="h-16 w-full" />
		<Skeleton class="h-16 w-full" />
		<Skeleton class="h-16 w-full" />
	{/if}
	{#if rows > 0}
		<div>
			{#each { length: rows }, i (i)}
				<div class="flex items-center justify-between gap-4 border-t border-rule py-2.5">
					<Skeleton class="h-3 w-2/5" />
					<Skeleton class="h-3 w-12" />
				</div>
			{/each}
		</div>
	{/if}
</div>
