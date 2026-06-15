<script lang="ts">
	import type { UpdateEntry } from '$lib/content/updates/types.js';
	import { CATEGORY_BADGE_CLASSES, CATEGORY_LABEL_DE, formatDateDe } from './category-label.js';

	type Props = { entry: UpdateEntry };
	let { entry }: Props = $props();

	const dateLabel = $derived(formatDateDe(entry.frontmatter.date));
	const categoryLabel = $derived(CATEGORY_LABEL_DE[entry.frontmatter.category]);
	const categoryClass = $derived(CATEGORY_BADGE_CLASSES[entry.frontmatter.category]);
	const detailHref = $derived(`/updates/${entry.slug}`);
</script>

<article
	class="flex flex-col gap-3 border-l-2 border-rule bg-bg px-4 py-4"
	data-testid="updates-entry-card"
	data-slug={entry.slug}
	data-category={entry.frontmatter.category}
>
	<div class="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
		<time class="font-sans" datetime={entry.frontmatter.date}>{dateLabel}</time>
		<span
			class={`inline-flex items-center border px-2 py-0.5 font-mono text-xs ${categoryClass}`}
			data-testid="category-badge"
		>
			{categoryLabel}
		</span>
	</div>
	<h2 class="font-serif text-2xl text-ink">
		<a
			href={detailHref}
			class="hover:text-accent focus-visible:text-accent"
			data-testid="entry-link"
		>
			{entry.frontmatter.title_de}
		</a>
	</h2>
	<p class="font-serif text-base leading-relaxed text-ink-muted">
		{entry.frontmatter.summary_de}
	</p>
	<p class="font-mono text-xs text-ink-subtle">
		<a href={detailHref} class="hover:text-accent-strong text-accent underline underline-offset-2">
			Mehr lesen
		</a>
	</p>
</article>
