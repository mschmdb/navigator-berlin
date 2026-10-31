/**
 * Anzeige-Texte für das Header-Menü (#138), locale-abhängig über Paraglide.
 * Wo der Footer schon denselben Namen führt, nutzt das Menü dessen Message.
 */
import { m } from '$lib/paraglide/messages.js';
import { assertUnreachable } from '$lib/i18n/message-options.js';
import type { SiteMenuGroupId, SiteMenuItemId } from './site-menu.js';

export function siteMenuGroupTitle(id: SiteMenuGroupId): string {
	switch (id) {
		case 'karte':
			return m.site_menu_group_karte();
		case 'vergleichen':
			return m.site_menu_group_vergleichen();
		case 'saison':
			return m.site_menu_group_saison();
		case 'projekt':
			return m.site_menu_group_projekt();
		default:
			return assertUnreachable(id);
	}
}

export function siteMenuItemTitle(id: SiteMenuItemId): string {
	switch (id) {
		case 'karte':
			return m.site_menu_item_karte();
		case 'finder':
			return m.shell_finder_link_title();
		case 'score':
			return m.shell_meta_link_score();
		case 'wahlen':
			return m.shell_meta_link_wahlen();
		case 'kieze':
			return m.site_menu_item_kieze();
		case 'kaelte':
			return m.shell_meta_link_kaelte();
		case 'hitze':
			return m.site_menu_item_hitze();
		case 'daten':
			return m.shell_meta_link_daten();
		case 'methodik':
			return m.shell_meta_link_methodik();
		case 'stories':
			return m.shell_meta_link_stories();
		case 'updates':
			return m.shell_meta_link_updates();
		case 'ueber':
			return m.shell_meta_link_ueber();
		default:
			return assertUnreachable(id);
	}
}

/** Kurztext unter dem Titel; `undefined` für reine Links. */
export function siteMenuItemDescription(id: SiteMenuItemId): string | undefined {
	switch (id) {
		case 'karte':
			return m.site_menu_desc_karte();
		case 'finder':
			return m.site_menu_desc_finder();
		case 'score':
			return m.site_menu_desc_score();
		case 'wahlen':
			return m.site_menu_desc_wahlen();
		case 'kieze':
			return m.site_menu_desc_kieze();
		case 'kaelte':
			return m.site_menu_desc_kaelte();
		case 'hitze':
			return m.site_menu_desc_hitze();
		case 'daten':
		case 'methodik':
		case 'stories':
		case 'updates':
		case 'ueber':
			return undefined;
		default:
			return assertUnreachable(id);
	}
}
