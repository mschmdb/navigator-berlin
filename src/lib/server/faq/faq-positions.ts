import { CLUSTER_KEYS, type ClusterKey, type TemplateLocale } from './template-schema.js';
import type { LoadedTemplate } from './load-templates.js';

const LOCALE_PRIORITY: readonly TemplateLocale[] = ['de', 'en'];

export function faqPositionKey(cluster: ClusterKey, templateId: string): string {
	return `${cluster}|${templateId}`;
}

/**
 * Redaktionelle Position je (cluster, templateId): erst Cluster-Folge
 * (`CLUSTER_KEYS`), dann YAML-Position. DE-Reihenfolge gilt zuerst, damit DE und
 * EN dieselbe Position teilen. Templates ohne DE-Pendant folgen dahinter.
 */
export function computeFaqPositions(loaded: readonly LoadedTemplate[]): Map<string, number> {
	const positions = new Map<string, number>();
	let next = 0;
	for (const cluster of CLUSTER_KEYS) {
		for (const locale of LOCALE_PRIORITY) {
			const files = loaded.filter((t) => t.cluster === cluster && t.locale === locale);
			for (const { file } of files) {
				for (const template of file.templates) {
					const key = faqPositionKey(cluster, template.id);
					if (!positions.has(key)) positions.set(key, next++);
				}
			}
		}
	}
	return positions;
}
