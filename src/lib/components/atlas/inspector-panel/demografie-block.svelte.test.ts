import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DemografieBlock from './demografie-block.svelte';
import type { KiezDemografieData } from './internal/demografie-types.js';

const DATA: KiezDemografieData = {
	einwohner: 7500,
	dichteEwKm2: 9756,
	anteilKinder0bis6: 0.045,
	anteilKinder6bis12: 0.041,
	anteilSenioren65plus: 0.2,
	jugendquotient: 25,
	altenquotient: 29.3,
	erwerbsanteil: 68.3,
	datenstand: '2024-12-31',
	quelle: 'Amt für Statistik Berlin-Brandenburg',
	lizenz: 'CC BY 4.0'
};

describe('DemografieBlock', () => {
	it('rendert Dichte + Anteile mit Daten', async () => {
		const screen = render(DemografieBlock, { data: DATA });
		await expect.element(screen.getByText('Bevölkerungsprofil')).toBeInTheDocument();
		await expect.element(screen.getByText(/EW\/km²/)).toBeInTheDocument();
		await expect.element(screen.getByText('20 %')).toBeInTheDocument();
	});

	it('null-safe: Leer-Hinweis statt Crash', async () => {
		const screen = render(DemografieBlock, { data: null });
		await expect.element(screen.getByTestId('demografie-empty')).toBeInTheDocument();
	});

	it('keine Severity-/Chip-Elemente (categorical-neutral)', async () => {
		const screen = render(DemografieBlock, { data: DATA });
		const block = screen.getByTestId('demografie-block');
		await expect.element(block).toBeInTheDocument();
		// kein ValueChip (severity-Klassen) im Block
		expect(block.element().querySelector('[data-severity]')).toBeNull();
	});

	it('Quelle/Stand/Lizenz im aufgeklappten Detail', async () => {
		const screen = render(DemografieBlock, { data: DATA });
		await screen.getByRole('button', { name: /Quelle/ }).click();
		const details = screen.getByTestId('demografie-details');
		await expect.element(details).toBeInTheDocument();
		await expect.element(details).toHaveTextContent('2024-12-31');
		await expect.element(details).toHaveTextContent('CC BY 4.0');
	});

	it('ohne onScopeChange: kein Scope-Toggle (Backwards-Compat)', async () => {
		const screen = render(DemografieBlock, { data: DATA });
		const block = screen.getByTestId('demografie-block');
		expect(block.element().querySelector('[data-testid="demografie-scope-toggle"]')).toBeNull();
	});

	it('Default-Scope standort: Bezug-Zeile nennt Umgebung + Planungsraum', async () => {
		const screen = render(DemografieBlock, { data: DATA, onScopeChange: () => {} });
		await expect
			.element(screen.getByTestId('demografie-bezug'))
			.toHaveTextContent(/Umgebung.*Planungsraum/);
	});

	it('Scope kiez: Bezug-Zeile nennt Kiez-Namen', async () => {
		const screen = render(DemografieBlock, {
			data: DATA,
			scope: 'kiez',
			scopeName: 'Beispielkiez',
			kiezAvailable: true,
			bezirkAvailable: true,
			onScopeChange: () => {}
		});
		await expect
			.element(screen.getByTestId('demografie-bezug'))
			.toHaveTextContent('Kiez Beispielkiez');
	});

	it('Klick auf Bezirk ruft onScopeChange', async () => {
		let picked: string | null = null;
		const screen = render(DemografieBlock, {
			data: DATA,
			kiezAvailable: true,
			bezirkAvailable: true,
			onScopeChange: (s: string) => (picked = s)
		});
		await screen.getByTestId('demografie-scope-bezirk').click();
		expect(picked).toBe('bezirk');
	});

	it('nicht verfügbarer Scope ist aria-disabled', async () => {
		const screen = render(DemografieBlock, {
			data: DATA,
			kiezAvailable: false,
			bezirkAvailable: false,
			onScopeChange: () => {}
		});
		await expect
			.element(screen.getByTestId('demografie-scope-kiez'))
			.toHaveAttribute('aria-disabled', 'true');
		await expect
			.element(screen.getByTestId('demografie-scope-bezirk'))
			.toHaveAttribute('aria-disabled', 'true');
	});
});
