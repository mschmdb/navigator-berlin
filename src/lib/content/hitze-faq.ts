import type { FaqEntry } from '$lib/data/types.js';
import { m } from '$lib/paraglide/messages.js';

// Story 16 SEO: FAQ für die Hitze-Landing. Fragen an realer Suchintention orientiert
// („kühle Orte Berlin", „klimatisierte Orte", „was hilft bei Hitze"). Sichtbar gerendert
// (FaqSection) und als FAQPage-JSON-LD, damit Google Rich-Results ziehen kann.
// i18n C4c: Texte kommen aus Paraglide-Messages in der Seiten-Locale.
export function getHitzeFaq(): readonly FaqEntry[] {
	return [
		{ question: m.hitze_faq_cool_places_where_q(), answer: m.hitze_faq_cool_places_where_a() },
		{ question: m.hitze_faq_air_conditioned_q(), answer: m.hitze_faq_air_conditioned_a() },
		{ question: m.hitze_faq_free_access_q(), answer: m.hitze_faq_free_access_a() },
		{ question: m.hitze_faq_what_helps_q(), answer: m.hitze_faq_what_helps_a() },
		{ question: m.hitze_faq_data_source_q(), answer: m.hitze_faq_data_source_a() }
	];
}
