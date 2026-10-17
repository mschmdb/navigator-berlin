<!--
	Story 2.11 T3: Updates-Teaser — Top-3 latest /updates auf der Landing.

	Daten kommen via Server-Load aus dem Story-2.13 Markdown-Index. Wenn
	leer (kein Update-Eintrag): Komponente versteckt sich.
-->
<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { formatShortDate } from '$lib/i18n/format.js';

	interface UpdateTeaser {
		readonly slug: string;
		readonly title: string;
		readonly titleIsDeFallback: boolean;
		readonly date: string;
		readonly categoryLabel: string;
		readonly summary: string;
		readonly summaryIsDeFallback: boolean;
	}

	interface Props {
		readonly items: readonly UpdateTeaser[];
	}

	const { items }: Props = $props();
</script>

{#if items.length > 0}
	<section data-testid="home-updates-teaser" class="space-y-6">
		<header class="flex items-baseline justify-between gap-4">
			<h2 class="text-2xl font-bold text-ink md:text-3xl">{m.home_updates_heading()}</h2>
			<a
				href={localizedHref('/updates')}
				class="inline-flex min-h-(--target-min) items-center gap-1 text-xs text-accent hover:text-ink"
			>
				{m.home_updates_all_link()}
				<ArrowUpRight size={14} aria-hidden="true" />
			</a>
		</header>
		<ul class="divide-y divide-rule border-y border-rule">
			{#each items as u (u.slug)}
				<li class="py-3">
					<a
						class="flex flex-col gap-1 text-ink hover:text-accent"
						href={localizedHref(`/updates/${u.slug}`)}
					>
						<span class="flex items-baseline gap-3">
							<span class="text-xs text-ink-subtle">
								{u.categoryLabel}
							</span>
							<span class="font-mono text-xs text-ink-subtle tabular-nums"
								>{formatShortDate(u.date)}</span
							>
						</span>
						<span class="text-base font-semibold" lang={u.titleIsDeFallback ? 'de' : undefined}
							>{u.title}</span
						>
						<span class="text-sm text-ink-muted" lang={u.summaryIsDeFallback ? 'de' : undefined}
							>{u.summary}</span
						>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
