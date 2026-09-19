import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PortalDatenstand from './portal-datenstand.svelte';

describe('PortalDatenstand', () => {
	it('zeigt Lade-Hinweis bei status idle/loading', async () => {
		render(PortalDatenstand, { minJahr: null, maxJahr: null, status: 'loading' });
		await expect.element(page.getByTestId('portal-datenstand-loading')).toBeInTheDocument();
	});

	it('zeigt Fehler-Hinweis bei status error', async () => {
		render(PortalDatenstand, { minJahr: null, maxJahr: null, status: 'error' });
		await expect.element(page.getByTestId('portal-datenstand-error')).toBeInTheDocument();
	});

	it('zeigt Jahres-Spanne bei geladenen Daten', async () => {
		render(PortalDatenstand, { minJahr: 2011, maxJahr: 2025, status: 'loaded' });
		await expect.element(page.getByTestId('portal-datenstand-text')).toHaveTextContent('2011');
		await expect.element(page.getByTestId('portal-datenstand-text')).toHaveTextContent('2025');
	});

	it('zeigt Leer-Hinweis wenn geladen aber ohne Wahlen (DB-los)', async () => {
		render(PortalDatenstand, { minJahr: null, maxJahr: null, status: 'loaded' });
		await expect.element(page.getByTestId('portal-datenstand-empty')).toBeInTheDocument();
	});
});
