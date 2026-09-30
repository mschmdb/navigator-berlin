<script lang="ts">
	import { Mail, ExternalLink } from '@lucide/svelte';
	import { buildOptOutMailto } from '$lib/utils/contact.js';
	import RichText from '$lib/components/rich-text.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getKuehleOrteQuellen, getKuehleOrteHaltung } from './transparenz-content.js';

	const optOutUrl = buildOptOutMailto();
	const quellen = $derived(getKuehleOrteQuellen());
	const lizenzenSegments = $derived(
		richSegments((t) =>
			m.transparenz_lizenzen_hinweis({ link_start: t('link').start, link_end: t('link').end })
		)
	);
</script>

<section aria-labelledby="transparenz-h" class="flex flex-col gap-4">
	<h2 id="transparenz-h" class="font-sans text-2xl font-semibold text-ink">
		{m.transparenz_heading()}
	</h2>

	<p class="font-serif text-base leading-relaxed text-ink-muted">
		{getKuehleOrteHaltung()}
	</p>

	<ul class="flex flex-col gap-3">
		{#each quellen as quelle (quelle.name)}
			<li class="flex flex-col gap-0.5 rounded border border-rule bg-bg-elevated px-3 py-2.5">
				<span class="flex flex-wrap items-baseline gap-2">
					<span class="font-sans text-sm font-medium text-ink">{quelle.name}</span>
					{#if quelle.lizenz}
						<span class="font-mono text-[11px] text-ink-subtle">{quelle.lizenz}</span>
					{/if}
				</span>
				<span class="font-serif text-sm text-ink-muted">{quelle.detail}</span>
			</li>
		{/each}
	</ul>

	<p class="font-serif text-sm text-ink-muted">
		<RichText segments={lizenzenSegments}>
			{#snippet tag(text)}
				<a
					data-testid="transparenz-lizenzen-link"
					href={localizedHref('/lizenzen')}
					class="hover:text-accent-strong text-accent underline underline-offset-2">{text}</a
				>
			{/snippet}
		</RichText>
	</p>

	<div class="flex flex-col gap-1.5 border-t border-rule pt-4">
		<h3 class="font-sans text-base font-semibold text-ink">{m.transparenz_optout_heading()}</h3>
		<p class="font-serif text-sm text-ink-muted">
			{m.transparenz_optout_text()}
		</p>
		<a
			href={optOutUrl}
			data-testid="kuehle-orte-opt-out"
			aria-label={m.transparenz_optout_aria_label()}
			class="hover:text-accent-strong inline-flex min-h-11 w-fit items-center gap-1.5 rounded font-sans text-sm text-accent underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			<Mail size={15} aria-hidden="true" />
			{m.transparenz_optout_link()}
			<ExternalLink size={12} aria-hidden="true" />
		</a>
	</div>
</section>
