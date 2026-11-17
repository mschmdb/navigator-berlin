/**
 * FAQ der Kiez- und Bezirksseiten (NAV-105): Die Antworten kommen aus `renderPlaceFaq`
 * (eine FAQ-Quelle für Seite und `faq_qna`). Nur Antworten ohne Befund der Faktenprüfung
 * gehen auf die Seite; jede verweist auf das Kapitel mit denselben Werten.
 */
import type { ClusterKey } from '$lib/server/faq/template-schema.js';
import type { ChapterId } from './topics';

export const CLUSTER_CHAPTER: Readonly<Record<ClusterKey, ChapterId>> = {
	laerm: 'laerm',
	gruen: 'gruen',
	klima: 'gruen',
	wohnen: 'wohnen',
	oepnv: 'unterwegs'
};

export interface PageFaqItem {
	readonly question: string;
	readonly answer: string;
	readonly chapter: ChapterId;
}

interface RenderedItem {
	readonly templateId: string;
	readonly cluster: ClusterKey;
	readonly question: string;
	readonly answer: string;
}

export function toPageFaq<T extends RenderedItem>(
	rendered: readonly T[],
	check: (item: T) => readonly { readonly kind: string; readonly message: string }[]
): { items: PageFaqItem[]; dropped: { templateId: string; findings: string[] }[] } {
	const items: PageFaqItem[] = [];
	const dropped: { templateId: string; findings: string[] }[] = [];
	for (const r of rendered) {
		const findings = check(r);
		if (findings.length > 0) {
			dropped.push({
				templateId: r.templateId,
				findings: findings.map((f) => `${f.kind}: ${f.message}`)
			});
			continue;
		}
		items.push({ question: r.question, answer: r.answer, chapter: CLUSTER_CHAPTER[r.cluster] });
	}
	return { items, dropped };
}
