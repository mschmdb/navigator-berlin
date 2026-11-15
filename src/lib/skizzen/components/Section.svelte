<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from './reveal';

	interface Props {
		id: string;
		eyebrow?: string;
		title: string;
		mode: 'erzaehlen' | 'zahlen';
		/** Erklärtext links (Desktop) bzw. oben (Mobil). */
		text: Snippet;
		/** Einstellungen, die nur in diesem Abschnitt gelten. */
		controls?: Snippet;
		chart: Snippet;
		/** Tabelle: in „Erzählen“ für Screenreader, in „Zahlen“ sichtbar statt der Grafik. */
		table: Snippet<[boolean]>;
		sources?: Snippet;
		/** Grafik enthält Links/Bedienelemente und bleibt darum für Screenreader sichtbar. */
		interactive?: boolean;
	}
	let {
		id,
		eyebrow,
		title,
		mode,
		text,
		controls,
		chart,
		table,
		sources,
		interactive = false
	}: Props = $props();
	const headingId = $derived(`${id}-h`);
</script>

<section
	{id}
	aria-labelledby={headingId}
	class="scroll-mt-28 border-t border-rule pt-12 pb-10 lg:pt-16 lg:pb-12"
>
	<div class="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
		<div class="lg:sticky lg:top-24 lg:self-start">
			{#if eyebrow}<p class="text-dense-label tracking-wide text-ink-subtle uppercase">
					{eyebrow}
				</p>{/if}
			<h2 id={headingId} class="mt-1 text-xl leading-tight font-semibold text-ink">{title}</h2>
			<div class="mt-3 flex flex-col gap-3 text-base leading-body text-ink-muted">
				{@render text()}
			</div>
			{#if mode === 'zahlen' && sources}
				<div class="mt-4 border-l-2 border-rule-strong pl-3 text-dense-label text-ink-subtle">
					{@render sources()}
				</div>
			{/if}
		</div>
		<div class="min-w-0">
			{#if controls}
				<div class="mb-4">{@render controls()}</div>
			{/if}
			{#if mode === 'erzaehlen'}
				<div class="skizze-reveal" {@attach reveal} aria-hidden={interactive ? undefined : 'true'}>
					{@render chart()}
				</div>
			{/if}
			{@render table(mode === 'zahlen')}
		</div>
	</div>
</section>
