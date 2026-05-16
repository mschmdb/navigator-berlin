<!--
	Translation-Disclaimer Phase-1-Stub (Story 2.5a).

	Phase 1 DE-only: Komponente ist nirgends eingebunden, da kein EN-Pfad
	existiert (Memory `project_i18n_phase_1_de_only`). Schema ist trotzdem
	vollständig spezifiziert, damit Phase 3 nur noch konsumieren muss.

	Drei Varianten via `data-variant`:
	- en-translated · EN-Seite mit echtem EN-Content
	- en-fallback-to-de · EN-Seite zeigt DE wegen fehlendem EN-Bundle
	- (DE-on-DE rendert NICHTS, Master-Source-Prinzip)

	Platzierungs-Empfehlung Phase 3: dezenter Banner direkt unter dem
	Page-Header, vor dem h1-Lead (Open-Question 4, Variante c). Plex-Mono-Subtle
	Typografie, blockiert nicht. KEIN Toast (Memory `feedback_no_toast`).
-->
<script lang="ts" module>
	import type { Locale } from '$lib/data/authorities.js';

	export type TranslationDisclaimerVariant = 'en-translated' | 'en-fallback-to-de';

	export const DISCLAIMER_TEXTS: Record<TranslationDisclaimerVariant, string> = {
		'en-translated':
			'Translated from German source. Original DE version remains authoritative.',
		'en-fallback-to-de':
			'This page is shown in German because the English translation is not yet available.'
	};

	export const ALT_LINK_LABELS: Record<TranslationDisclaimerVariant, string> = {
		'en-translated': 'Read in German',
		'en-fallback-to-de': 'Read in German'
	};
</script>

<script lang="ts">
	type Props = {
		effectiveLocale: Locale;
		pageLocale: Locale;
		alternateLocaleHref?: string;
	};

	let { effectiveLocale, pageLocale, alternateLocaleHref }: Props = $props();

	const variant = $derived<TranslationDisclaimerVariant | null>(
		pageLocale === 'en' && effectiveLocale === 'en'
			? 'en-translated'
			: pageLocale === 'en' && effectiveLocale === 'de'
				? 'en-fallback-to-de'
				: null
	);
</script>

{#if variant}
	{@const text = DISCLAIMER_TEXTS[variant]}
	{@const altLabel = ALT_LINK_LABELS[variant]}
	<p
		data-testid="translation-disclaimer"
		data-variant={variant}
		class="font-mono text-xs uppercase tracking-wide text-ink-subtle"
	>
		<span>{text}</span>
		{#if alternateLocaleHref}
			<a
				href={alternateLocaleHref}
				data-testid="translation-disclaimer-alt-link"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				{altLabel}
			</a>
		{/if}
	</p>
{/if}
