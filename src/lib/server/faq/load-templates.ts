import { readFile, readdir } from 'node:fs/promises';
import { resolve as pathResolve } from 'node:path';
import yaml from 'js-yaml';
import {
	parseFaqTemplateFile,
	type ClusterKey,
	type FaqTemplateFile,
	type TemplateLocale,
	CLUSTER_KEYS
} from './template-schema.js';

/**
 * Story 2.5b T1.3: Build-Time-Loader für FAQ-Templates.
 *
 * Scannt `src/lib/data/faq-templates/{cluster}/*.yaml` (Phase-1 nur `*.de.yaml`,
 * Memory `project_i18n_phase_1_de_only`), parsed via `js-yaml` und validiert
 * gegen das Valibot-Schema. Wirft bei Schema-Verstoß.
 *
 * Pure-Function ist hier nicht möglich (File-IO), aber der Inhalt-Parser ist
 * separat in `parseTemplateYaml` testbar.
 */

const DEFAULT_ROOT = pathResolve(process.cwd(), 'src/lib/data/faq-templates');

export interface LoadedTemplate {
	readonly cluster: ClusterKey;
	readonly locale: TemplateLocale;
	readonly file: FaqTemplateFile;
}

export function parseTemplateYaml(raw: string): FaqTemplateFile {
	const data = yaml.load(raw);
	return parseFaqTemplateFile(data);
}

export async function loadAllFaqTemplates(rootDir = DEFAULT_ROOT): Promise<LoadedTemplate[]> {
	const out: LoadedTemplate[] = [];
	for (const cluster of CLUSTER_KEYS) {
		const clusterDir = pathResolve(rootDir, cluster);
		let entries: string[];
		try {
			entries = await readdir(clusterDir);
		} catch {
			continue; // Cluster-Verzeichnis fehlt → Phase-2-Backlog, kein Fehler.
		}
		for (const filename of entries) {
			const match = /^([a-z]+)\.(de|en)\.yaml$/.exec(filename);
			if (!match) continue;
			const fileCluster = match[1] as ClusterKey;
			const locale = match[2] as TemplateLocale;
			if (fileCluster !== cluster) {
				throw new Error(
					`FAQ-Template-Filename-Mismatch: ${filename} liegt in Cluster-Verzeichnis ${cluster}/`
				);
			}
			const filePath = pathResolve(clusterDir, filename);
			const raw = await readFile(filePath, 'utf-8');
			const parsed = parseTemplateYaml(raw);
			if (parsed.cluster !== cluster) {
				throw new Error(
					`FAQ-Template-Cluster-Mismatch: Datei ${filename} deklariert cluster: ${parsed.cluster}, liegt aber in Verzeichnis ${cluster}/`
				);
			}
			if (parsed.locale !== locale) {
				throw new Error(
					`FAQ-Template-Locale-Mismatch: Datei ${filename} deklariert locale: ${parsed.locale}`
				);
			}
			out.push({ cluster, locale, file: parsed });
		}
	}
	return out;
}
