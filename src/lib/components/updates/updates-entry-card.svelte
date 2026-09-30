<script lang="ts">
	import type { UpdateEntry } from '$lib/content/updates/types.js';
	import { localizeUpdateEntry } from '$lib/content/updates/localize-update-entry.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { CATEGORY_BADGE_CLASSES, categoryLabel, formatUpdateDate } from './category-label.js';

	type Props = { entry: UpdateEntry };
	let { entry }: Props = $props();

	const locale = $derived(getLocale());
	const localized = $derived(localizeUpdateEntry(entry, locale));
	const dateLabel = $derived(formatUpdateDate(entry.frontmatter.date, locale));
	const badgeLabel = $derived(categoryLabel(entry.frontmatter.category, locale));
	const categoryClass = $derived(CATEGORY_BADGE_CLASSES[entry.frontmatter.category]);
	const detailHref = $derived(localizedHref(`/updates/${entry.slug}`));
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
			{badgeLabel}
		</span>
	</div>
	<h2 class="font-serif text-2xl text-ink" lang={localized.titleIsDeFallback ? 'de' : undefined}>
		<a
			href={detailHref}
			class="hover:text-accent focus-visible:text-accent"
			data-testid="entry-link"
		>
			{localized.title}
		</a>
	</h2>
	<p
		class="font-serif text-base leading-relaxed text-ink-muted"
		lang={localized.summaryIsDeFallback ? 'de' : undefined}
	>
		{localized.summary}
	</p>
	<p class="font-mono text-xs text-ink-subtle">
		<a href={detailHref} class="hover:text-accent-strong text-accent underline underline-offset-2">
			{m.updates_card_read_more()}
		</a>
	</p>
</article>
