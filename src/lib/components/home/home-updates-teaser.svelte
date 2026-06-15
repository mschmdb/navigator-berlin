<!--
	Story 2.11 T3: Updates-Teaser — Top-3 latest /updates auf der Landing.

	Daten kommen via Server-Load aus dem Story-2.13 Markdown-Index. Wenn
	leer (kein Update-Eintrag): Komponente versteckt sich.
-->
<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';

	interface UpdateTeaser {
		readonly slug: string;
		readonly title: string;
		readonly date: string;
		readonly category: string;
		readonly summary: string;
	}

	interface Props {
		readonly items: readonly UpdateTeaser[];
	}

	const { items }: Props = $props();

	function formatDate(iso: string): string {
		const date = new Date(iso);
		if (isNaN(date.getTime())) return iso;
		return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

{#if items.length > 0}
	<section data-testid="home-updates-teaser" class="space-y-6">
		<header class="flex items-baseline justify-between gap-4">
			<h2 class="font-serif text-2xl text-ink md:text-3xl">Letzte Updates</h2>
			<a
				href="/updates"
				class="inline-flex items-center gap-1 font-mono text-xs tracking-wider text-accent uppercase hover:text-ink"
			>
				Alle Updates
				<ArrowUpRight size={14} aria-hidden="true" />
			</a>
		</header>
		<ul class="divide-y divide-rule border-y border-rule">
			{#each items as u (u.slug)}
				<li class="py-3">
					<a class="flex flex-col gap-1 text-ink hover:text-accent" href={`/updates/${u.slug}`}>
						<span class="flex items-baseline gap-3">
							<span class="font-mono text-xs tracking-wider text-ink-subtle uppercase">
								{u.category}
							</span>
							<span class="font-mono text-xs text-ink-subtle">{formatDate(u.date)}</span>
						</span>
						<span class="font-serif text-base font-semibold">{u.title}</span>
						<span class="font-serif text-sm text-ink-muted">{u.summary}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
