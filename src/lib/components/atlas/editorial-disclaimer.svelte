<script lang="ts" module>
	import type { DisclaimerVariant } from './internal/editorial-types.js';

	export const DISCLAIMER_TEXTS_DE: Record<DisclaimerVariant, string> = {
		legal: 'Ersetzt keine rechtliche Aussage.',
		historic: 'Historischer Stand. Geometrie aus OpenStreetMap-Community-Daten.',
		seasonal: 'Layer aktiv Mai–Oktober. November–April außerhalb der Saison.',
		source: 'Personen-Hintergrund aus zitierter Quelle. Nicht algorithmisch generiert.',
		'kuehle-orte':
			'Geometrie aus OpenStreetMap (ODbL), ergänzt um eine redaktionelle Anreicherung. Ein Angebot, kein Behörden-Ersatz, kein Rechtsanspruch auf Zugang.',
		'compare-stolperstein':
			'Stolpersteine sind Erinnerung an NS-Opfer, kein Wohn-Bewertungs-Kriterium. Wir zählen nur, ohne zu vergleichen oder zu werten.',
		'compare-mietspiegel':
			'Mietspiegel-Wohnlage ist keine Wohnqualität. Niedrigere Stufe heißt nicht „schlechter".',
		'compare-bodenrichtwerte':
			'Höherer Bodenrichtwert kann teurere Miete bedeuten, oft aber auch bessere Versorgung. Wir zeigen die Differenz, ohne Bewertung.',
		'compare-stigma-footer':
			'Aggregierte Daten pro Lage spiegeln statistische Mittel wider, nicht individuelle Wohnsituationen.',
		'mss-aggregat':
			'Strukturelle Aggregat-Daten pro Planungsraum (rund 7.500 Einwohner:innen). Einzelne Adressen oder Personen sind dadurch nicht abgebildet. Stand: SenStadt MSS 2025.',
		'compare-mss-aggregat':
			'Wir zeigen die Stufe, ohne Bewertung. Niedriger Status heißt nicht „schlechter Kiez". Daten je Planungsraum, nicht je Adresse.',
		'kiez-score-explainer':
			'Umwelt- & Infrastruktur-Score aus fünf Dimensionen pro Planungsraum (Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz). Misst nur Größen mit eindeutiger Besser-Richtung. Sozialstruktur und Bezahlbarkeit bewusst nicht enthalten.',
		'kriminalitaet-aggregat':
			'Häufigkeitszahl je Bezirksregion, nicht adressgenau. Sie misst erfasste Fälle pro gemeldete Einwohner, kein persönliches Risiko. Touristen- und Pendler-Orte erscheinen überzeichnet, das Dunkelfeld bleibt unerfasst. Kein Sicherheits-Ranking, fließt nicht in den Gesamt-Score.',
		// Wird nie gerendert (siehe `text`-Ableitung unten, immer über
		// `m.disclaimer_wahl_stimmenanteile()`, spec-i18n-teiluebersetzung-
		// banner.md) -- Eintrag existiert nur, damit
		// `Record<DisclaimerVariant, string>` vollstaendig bleibt.
		'wahl-stimmenanteile':
			'Daten beschreiben Stimmenanteile, keine Bewertung. Briefstimmen sind auf allen Ebenen enthalten, im Stimmbezirk über die Briefwahl-Gruppe, im Kiez anteilig nach Wahlberechtigten verteilt (Schätzung, keine amtliche Aufteilung).',
		'cross-layer-template':
			'Werte aus verschiedenen Layern nebeneinander gestellt, ohne kausale Verknüpfung. Aggregat-Daten pro Planungsraum, nicht pro Adresse.',
		'brw-not-aggregatable':
			'Auf dieser Ebene nicht sinnvoll aggregierbar. Ein Median über das ganze Gebiet würde lokale Unterschiede verwischen, deshalb zeigen wir hier keinen Wert.',
		'level-below-threshold':
			'Auf dieser Ebene zu wenig Daten für eine belastbare Aussage. Wir zeigen lieber keinen Wert als einen irreführenden.',
		'wahl-portal-footnote':
			'Karten und Vergleiche auf dieser Seite sind deskriptiv, kein Ranking von Kiezen oder Bezirken. Stimmenanteile sind kein Hinweis auf künftige Wahlen.',
		// Wird nie gerendert (siehe `text`-Ableitung unten, immer über
		// `m.wahl_portal_disclaimer_stimmenanteile()`) -- Eintrag existiert nur,
		// damit `Record<DisclaimerVariant, string>` vollstaendig bleibt.
		'wahl-portal-stimmenanteile':
			'Daten beschreiben Stimmenanteile, keine Bewertung. Auf Kiez-Ebene ist die Briefwahl anteilig nach Wahlberechtigten geschätzt, nicht amtlich. Amtliche Werte gibt es auf Stimmbezirks-, Bezirks- und Berlin-Ebene.'
	};
</script>

<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	type Props = {
		variant: DisclaimerVariant;
		sourceUrl?: string;
		customText?: string;
		id?: string;
	};

	let { variant, sourceUrl, customText, id }: Props = $props();

	// i18n Block B: die Wahlportal-EIGENEN Varianten laufen ueber Paraglide-
	// Messages (locale-abhaengig, Auswertung beim Aufruf). `wahl-stimmenanteile`
	// (Kiez-Inspector, Compare-Modus) ist NICHT dasselbe wie
	// `wahl-portal-stimmenanteile` (Wahl-Detailseite) -- Review-Fund: beide
	// teilten sich vorher denselben Variant-Key, wodurch der Inspector/Compare-
	// Disclaimer auf nicht uebersetzten `/en/...`-Seiten faelschlich englisch
	// wurde. `wahl-stimmenanteile` selbst lief bis
	// spec-i18n-teiluebersetzung-banner.md ueber `DISCLAIMER_TEXTS_DE` (hart
	// deutsch) -- jetzt ebenfalls eine eigene Message, DE-Wortlaut unveraendert
	// (Story 17 / `main` a253e14). Die restlichen 12 Varianten bleiben
	// unangetastet ueber `DISCLAIMER_TEXTS_DE` (Boundary: "Keine anderen Seiten
	// übersetzen").
	const LOCALIZED_VARIANTS = new Set<DisclaimerVariant>([
		'wahl-portal-footnote',
		'wahl-portal-stimmenanteile',
		'wahl-stimmenanteile'
	]);

	const text = $derived(
		customText ??
			(variant === 'wahl-portal-footnote'
				? m.wahl_portal_disclaimer_footnote()
				: variant === 'wahl-portal-stimmenanteile'
					? m.wahl_portal_disclaimer_stimmenanteile()
					: variant === 'wahl-stimmenanteile'
						? m.disclaimer_wahl_stimmenanteile()
						: DISCLAIMER_TEXTS_DE[variant])
	);

	// spec-i18n-teiluebersetzung-banner.md: Varianten, die weiterhin aus
	// `DISCLAIMER_TEXTS_DE` kommen (hart deutscher Text, kein `customText`),
	// bekommen `lang="de"` auf jeder Nicht-DE-Seite (WCAG 3.1.2) -- das gilt
	// auch fuer den "Quelle ansehen"-Link, weil er Teil desselben Absatzes
	// ist. Lokalisierte Varianten (Set oben) und `customText` sind schon
	// selbst locale-korrekt und bleiben deshalb ohne `lang`-Override.
	const contentLang = $derived(
		!customText && !LOCALIZED_VARIANTS.has(variant) && getLocale() !== 'de' ? 'de' : undefined
	);

	// Review-Fund: "Quelle ansehen" ist hartcodiertes Deutsch, unabhaengig von
	// `variant` -- wenn der umschliessende Absatz KEIN `lang="de"` traegt
	// (lokalisierte Variante oder `customText` auf Nicht-DE), braucht das
	// Label selbst ein `lang="de"` (WCAG 3.1.2). Traegt der Absatz schon
	// `contentLang="de"`, ist das Label bereits mit erfasst.
	const sourceLinkLang = $derived(!contentLang && getLocale() !== 'de' ? 'de' : undefined);
</script>

<p
	{id}
	data-testid="editorial-disclaimer"
	data-variant={variant}
	lang={contentLang}
	class="font-serif text-sm leading-snug text-ink-muted italic"
>
	<span>{text}</span>
	{#if sourceUrl}
		<a
			href={sourceUrl}
			target="_blank"
			rel="noopener noreferrer"
			data-testid="disclaimer-source-link"
			class="hover:text-accent-strong inline-flex items-center gap-1 text-accent not-italic underline underline-offset-2"
		>
			<ExternalLink size={12} aria-hidden="true" />
			<span lang={sourceLinkLang}>Quelle ansehen</span>
		</a>
	{/if}
</p>
