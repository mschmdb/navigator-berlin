/**
 * GH-93: Kategorie-Name eines Layer-Bundles ohne Buchstaben-Präfix für
 * DE-only-Ausgaben ohne Paraglide-Runtime (OG-Bilder per tsx-Skript,
 * llms-Ausgaben). Die Werte spiegeln `atlas_bundle_label_*` aus
 * `messages/de.json`; ein Test hält beide synchron.
 */
const BUNDLE_DISPLAY_NAME_DE: Readonly<Record<string, string>> = {
	'A: Boundaries': 'Grenzen',
	'B: Wohn-Daten': 'Wohnen',
	'C: Umwelt': 'Umwelt',
	'D: Memorial': 'Erinnerung',
	'E: Soziale Infrastruktur': 'Soziale Infrastruktur',
	'F: Mobilität': 'Mobilität',
	'G: Kiez-Score': 'Kiez-Score',
	'H: Wahldaten': 'Wahlen',
	'I: Demografie': 'Demografie',
	'J: Kultur': 'Kultur'
};

export function bundleDisplayName(bundleGroup: string): string {
	if (Object.hasOwn(BUNDLE_DISPLAY_NAME_DE, bundleGroup)) {
		return BUNDLE_DISPLAY_NAME_DE[bundleGroup]!;
	}
	return bundleGroup.replace(/^[A-Z]: /, '');
}
