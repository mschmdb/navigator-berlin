<script lang="ts">
	import { BedDouble, ExternalLink } from '@lucide/svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { KAELTEHILFE_APP_URL } from '$lib/kaelte/hilfe-dienste.js';
	import { m } from '$lib/paraglide/messages.js';

	// Nachtcafés und Notübernachtungen zeigen wir bewusst nicht: freie Plätze kennt nur die App.
	const textSegments = $derived(
		richSegments((t) =>
			m.kaelte_orte_schlafplatz_text({ de_start: t('de').start, de_end: t('de').end })
		)
	);
	const linkSegments = $derived(
		richSegments((t) =>
			m.kaelte_orte_schlafplatz_link({ de_start: t('de').start, de_end: t('de').end })
		)
	);
</script>

<div
	data-testid="schlafplatz-hinweis"
	class="flex items-start gap-2 rounded border border-rule bg-bg-elevated px-3 py-2.5"
>
	<BedDouble size={18} aria-hidden="true" class="mt-0.5 shrink-0 text-ink-muted" />
	<div class="flex flex-col gap-0.5">
		<p class="font-sans text-sm text-ink">
			<span class="font-semibold">{m.kaelte_orte_schlafplatz_frage()}</span>
			<RichText segments={textSegments}>
				{#snippet tag(text)}<span lang="de">{text}</span>{/snippet}
			</RichText>
		</p>
		<a
			href={KAELTEHILFE_APP_URL}
			target="_blank"
			rel="noopener noreferrer"
			data-testid="schlafplatz-app-link"
			class="inline-flex min-h-11 w-fit items-center gap-1.5 font-sans text-sm font-medium text-accent underline underline-offset-2 hover:text-accent-strong"
		>
			<span>
				<RichText segments={linkSegments}>
					{#snippet tag(text)}<span lang="de">{text}</span>{/snippet}
				</RichText>
			</span>
			<ExternalLink size={12} aria-hidden="true" />
			<span class="sr-only">{m.kaelte_new_tab_hint()}</span>
		</a>
	</div>
</div>
