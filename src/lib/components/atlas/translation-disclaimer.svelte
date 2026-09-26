<!--
	Translation-Disclaimer (i18n Block A, verallgemeinert auf N Locales).

	Eingebunden in `(with-header)/+layout.svelte` INNERHALB `<main>`, vor dem
	Seiteninhalt. Rendert genau EINE Variante via `data-variant`:
	- fallback-to-base · Seite zeigt Basis-Locale-Content (DE) weil `pageLocale`
	  (noch) nicht im Übersetzungs-Register steht (`translation-register.ts`)
	- (sonst rendert die Komponente NICHTS: Basis-Locale-on-Basis-Locale UND
	  eine echt übersetzte Seite -- Entscheidung Matze 26.09. 21:06, i18n
	  Block B: übersetzte Seiten bekommen KEINEN Übersetzungs-Hinweis mehr.
	  Die vormalige `translated`-Variante ["Translated from German source.
	  Original DE version remains authoritative."] entfiel ersatzlos, siehe
	  ADR-005.)

	Block A: `translation-register.ts` ist leer, jede Nicht-Basis-Locale-Seite
	rendert also `fallback-to-base`. Ab Block B zeigen registrierte Seiten
	(z. B. `/en/berlin-wahlen`) gar keinen Disclaimer mehr.

	Text kommt aus einer Paraglide-Message (de + en, `messages/*.json`),
	explizit mit `{ locale: pageLocale }` aufgerufen statt sich auf
	`getLocale()` zu verlassen -- der Disclaimer zeigt IMMER Text in der
	URL-Locale der Seite, unabhängig vom Ambient-Locale-Context.
	`lang={pageLocale}` markiert das auch fürs Accessibility-Tree (code
	review, 2026-09-26).
-->
<script lang="ts" module>
	import type { Locale } from '$lib/paraglide/runtime';

	export type TranslationDisclaimerVariant = 'fallback-to-base';
</script>

<script lang="ts">
	import { baseLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	type Props = {
		/** Locale, die tatsächlich Content liefert (siehe `resolveEffectiveLocale`). */
		effectiveLocale: Locale;
		/** Locale der aktuellen URL/Seite (`getLocale()`). */
		pageLocale: Locale;
		alternateLocaleHref?: string;
	};

	let { effectiveLocale, pageLocale, alternateLocaleHref }: Props = $props();

	const variant = $derived<TranslationDisclaimerVariant | null>(
		pageLocale === baseLocale || effectiveLocale === pageLocale ? null : 'fallback-to-base'
	);

	const text = $derived(variant ? m.disclaimer_fallback_to_base(undefined, { locale: pageLocale }) : '');
	const altLabel = $derived(m.disclaimer_alt_link_label(undefined, { locale: pageLocale }));
</script>

{#if variant}
	<p
		data-testid="translation-disclaimer"
		data-variant={variant}
		lang={pageLocale}
		class="font-mono text-xs tracking-wide text-ink-subtle uppercase"
	>
		<span>{text}</span>
		{#if alternateLocaleHref}
			<a
				href={alternateLocaleHref}
				data-testid="translation-disclaimer-alt-link"
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				{altLabel}
			</a>
		{/if}
	</p>
{/if}
