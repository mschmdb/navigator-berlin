<script lang="ts" module>
	import type { DisclaimerVariant } from './internal/editorial-types.js';

	// i18n Block C1: `DISCLAIMER_TEXTS_DE` wird von dieser Komponente selbst
	// NICHT mehr gerendert (siehe `DISCLAIMER_MESSAGE`-Weiche unten, alle 19
	// Varianten laufen jetzt ueber Paraglide-Messages). Der Record bleibt als
	// DE-Referenz-Export fuer `llm-export-builder.ts` (Boundary: "Nicht-UI-
	// Konsumenten bleiben unveraendert", Ausgabe identisch).
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
			'Mietspiegel-Wohnlage ist keine Wohnqualität. Niedrigere Stufe heißt nicht „schlechter“.',
		'compare-bodenrichtwerte':
			'Höherer Bodenrichtwert kann teurere Miete bedeuten, oft aber auch bessere Versorgung. Wir zeigen die Differenz, ohne Bewertung.',
		'compare-stigma-footer':
			'Aggregierte Daten pro Lage spiegeln statistische Mittel wider, nicht individuelle Wohnsituationen.',
		'mss-aggregat':
			'Strukturelle Aggregat-Daten pro Planungsraum (rund 7.500 Einwohner:innen). Einzelne Adressen oder Personen sind dadurch nicht abgebildet. Stand: SenStadt MSS 2025.',
		'compare-mss-aggregat':
			'Wir zeigen die Stufe, ohne Bewertung. Niedriger Status heißt nicht „schlechter Kiez“. Daten je Planungsraum, nicht je Adresse.',
		'kiez-score-explainer':
			'Umwelt- & Infrastruktur-Score aus fünf Dimensionen pro Planungsraum (Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz). Misst nur Größen mit eindeutiger Besser-Richtung. Sozialstruktur und Bezahlbarkeit bewusst nicht enthalten.',
		'kriminalitaet-aggregat':
			'Häufigkeitszahl je Bezirksregion, nicht adressgenau. Sie misst erfasste Fälle pro gemeldete Einwohner, kein persönliches Risiko. Touristen- und Pendler-Orte erscheinen überzeichnet, das Dunkelfeld bleibt unerfasst. Kein Sicherheits-Ranking, fließt nicht in den Gesamt-Score.',
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
		'wahl-portal-stimmenanteile':
			'Daten beschreiben Stimmenanteile, keine Bewertung. Auf Kiez-Ebene ist die Briefwahl anteilig nach Wahlberechtigten geschätzt, nicht amtlich. Amtliche Werte gibt es auf Stimmbezirks-, Bezirks- und Berlin-Ebene.'
	};
</script>

<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';

	type Props = {
		variant: DisclaimerVariant;
		sourceUrl?: string;
		customText?: string;
		id?: string;
		/** Explicit content locale, overrides `getLocale()` (URL locale). Needed
		 * by callers whose content locale differs from the URL locale, e.g. a
		 * page that still shows German content under an `/en` URL. */
		locale?: Locale;
	};

	let { variant, sourceUrl, customText, id, locale }: Props = $props();

	type MessageFn = (params?: undefined, options?: { locale: Locale }) => string;

	// i18n Block C1: alle 19 Varianten laufen jetzt ueber Paraglide-Messages.
	// Ohne `locale`-Prop folgt der Text reaktiv der Seiten-Locale
	// (`getLocale()`, analog zu `m.wahl_portal_disclaimer_*()` seit
	// spec-i18n-teiluebersetzung-banner.md); mit `locale`-Prop uebersteuert der
	// Aufrufer das explizit. Damit entfaellt die vorherige
	// `contentLang`/`LOCALIZED_VARIANTS`-Unterscheidung (B4b) komplett: nichts
	// in dieser Komponente ist mehr hart deutsch, also braucht auch nichts
	// mehr ein `lang="de"`-Override (WCAG 3.1.2 -- kein falsches `lang` auf
	// tatsaechlich uebersetztem Inhalt).
	const DISCLAIMER_MESSAGE: Partial<Record<DisclaimerVariant, MessageFn>> = {
		legal: m.disclaimer_legal,
		historic: m.disclaimer_historic,
		seasonal: m.disclaimer_seasonal,
		source: m.disclaimer_source,
		'kuehle-orte': m.disclaimer_kuehle_orte,
		'compare-stolperstein': m.disclaimer_compare_stolperstein,
		'compare-mietspiegel': m.disclaimer_compare_mietspiegel,
		'compare-bodenrichtwerte': m.disclaimer_compare_bodenrichtwerte,
		'compare-stigma-footer': m.disclaimer_compare_stigma_footer,
		'mss-aggregat': m.disclaimer_mss_aggregat,
		'compare-mss-aggregat': m.disclaimer_compare_mss_aggregat,
		'kiez-score-explainer': m.disclaimer_kiez_score_explainer,
		'kriminalitaet-aggregat': m.disclaimer_kriminalitaet_aggregat,
		'wahl-stimmenanteile': m.disclaimer_wahl_stimmenanteile,
		'cross-layer-template': m.disclaimer_cross_layer_template,
		'brw-not-aggregatable': m.disclaimer_brw_not_aggregatable,
		'level-below-threshold': m.disclaimer_level_below_threshold,
		'wahl-portal-footnote': m.wahl_portal_disclaimer_footnote,
		'wahl-portal-stimmenanteile': m.wahl_portal_disclaimer_stimmenanteile
	};

	// Guard: ein Variant-Wert ausserhalb der bekannten 19 (z.B. via Laufzeit-
	// Daten statt des TS-Unions) rendert leeren Text statt zu werfen.
	const text = $derived(
		customText ??
			DISCLAIMER_MESSAGE[variant]?.(undefined, { locale: locale ?? getLocale() }) ??
			''
	);
</script>

<p
	{id}
	data-testid="editorial-disclaimer"
	data-variant={variant}
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
			<span>{m.disclaimer_quelle_ansehen(undefined, { locale: locale ?? getLocale() })}</span>
		</a>
	{/if}
</p>
