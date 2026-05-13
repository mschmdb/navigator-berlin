<script lang="ts" module>
	import type { DisclaimerVariant } from './internal/editorial-types.js';

	export const DISCLAIMER_TEXTS_DE: Record<DisclaimerVariant, string> = {
		legal: 'Ersetzt keine rechtliche Aussage.',
		historic: 'Historischer Stand. Geometrie aus OpenStreetMap-Community-Daten.',
		seasonal: 'Layer aktiv Mai–Oktober. November–April außerhalb der Saison.',
		source: 'Personen-Hintergrund aus zitierter Quelle. Nicht algorithmisch generiert.'
	};
</script>

<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';

	type Props = {
		variant: DisclaimerVariant;
		sourceUrl?: string;
		customText?: string;
		id?: string;
	};

	let { variant, sourceUrl, customText, id }: Props = $props();

	const text = $derived(customText ?? DISCLAIMER_TEXTS_DE[variant]);
</script>

<p
	{id}
	data-testid="editorial-disclaimer"
	data-variant={variant}
	class="font-serif italic text-sm text-ink-muted leading-snug"
>
	<span>{text}</span>
	{#if sourceUrl}
		<a
			href={sourceUrl}
			target="_blank"
			rel="noopener noreferrer"
			data-testid="disclaimer-source-link"
			class="inline-flex items-center gap-1 not-italic text-accent underline underline-offset-2 hover:text-accent-strong"
		>
			<ExternalLink size={12} aria-hidden="true" />
			<span>Quelle ansehen</span>
		</a>
	{/if}
</p>
