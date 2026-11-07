import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Auswahl from './auswahl.svelte';
import Knopf from './knopf.svelte';
import Regler from './regler.svelte';
import Schalter from './schalter.svelte';
import Segmente from './segmente.svelte';

const box = (el: Element): CSSStyleDeclaration => getComputedStyle(el);

/** Steuerelement-System nach `runde-20-ux/src/ui.js`: 44 px, 2-px-Rand, eckig. */
const expectSystemLook = (el: Element): void => {
	const s = box(el);
	expect(s.height).toBe('44px');
	expect(s.borderTopWidth).toBe('2px');
	expect(s.borderTopLeftRadius).toBe('0px');
};

describe('knopf.svelte', () => {
	it('ist ein Button im Steuerelement-System und meldet Klicks', async () => {
		const onclick = vi.fn();
		render(Knopf, { text: 'Zurücksetzen', onclick });
		const b = page.getByRole('button', { name: 'Zurücksetzen' });
		expect(b.element().getAttribute('type')).toBe('button');
		expectSystemLook(b.element());
		await b.click();
		expect(onclick).toHaveBeenCalledOnce();
	});
});

describe('Tooltip (WCAG 1.4.13)', () => {
	const tipOf = (button: Element): HTMLElement => {
		const id = button.getAttribute('aria-describedby');
		expect(id).toBeTruthy();
		return document.getElementById(id!)!;
	};

	it('beschreibt das Element und bleibt verborgen, bis es Hover oder Fokus bekommt', async () => {
		render(Knopf, { text: 'Alles einblenden', help: 'Zeigt alle Bezirke und Wahlen.' });
		const b = page.getByRole('button', { name: 'Alles einblenden' }).element();
		const tip = tipOf(b);
		expect(tip.getAttribute('role')).toBe('tooltip');
		expect(tip.textContent).toBe('Zeigt alle Bezirke und Wahlen.');
		expect(tip.checkVisibility()).toBe(false);
		await userEvent.hover(b);
		expect(tip.checkVisibility()).toBe(true);
	});

	it('erscheint bei Tastaturfokus und schließt mit Escape', async () => {
		render(Knopf, { text: 'Zurücksetzen', help: 'Stellt alles auf den Anfang.' });
		const b = page.getByRole('button', { name: 'Zurücksetzen' }).element() as HTMLElement;
		const tip = tipOf(b);
		await userEvent.tab();
		expect(document.activeElement).toBe(b);
		expect(tip.checkVisibility()).toBe(true);
		await userEvent.keyboard('{Escape}');
		expect(tip.checkVisibility()).toBe(false);
		expect(document.activeElement).toBe(b);
	});

	it('bleibt sichtbar, wenn der Zeiger auf den Tooltip wechselt', async () => {
		const { container } = render(Knopf, { text: 'Grau', help: 'Alle Parteien unter 5 %.' });
		// Platz über dem Knopf, sonst läge der Tooltip außerhalb des Fensters.
		container.style.paddingTop = '120px';
		const b = page.getByRole('button', { name: 'Grau' }).element();
		const tip = tipOf(b);
		await userEvent.hover(b);
		await userEvent.hover(tip);
		expect(tip.checkVisibility()).toBe(true);
	});

	it('öffnet auf Wunsch nach unten', async () => {
		render(Knopf, { text: '2026', help: 'Wahl ausblenden', tipBelow: true });
		const b = page.getByRole('button', { name: '2026' }).element();
		const tip = tipOf(b);
		await userEvent.hover(b);
		expect(tip.getBoundingClientRect().top).toBeGreaterThan(b.getBoundingClientRect().bottom);
	});
});

describe('segmente.svelte', () => {
	const items = [
		{ value: 'fixed', text: 'Feste Plätze' },
		{ value: 'size', text: 'Nach Größe', help: 'Größte Partei zuerst, Grau bleibt zuletzt.' }
	];

	it('ist eine benannte Gruppe mit genau einem gedrückten Knopf', () => {
		render(Segmente, { label: 'Parteien', items, value: 'fixed' });
		const group = page.getByRole('group', { name: 'Parteien' }).element();
		const pressed = [...group.querySelectorAll('button')].map((b) =>
			b.getAttribute('aria-pressed')
		);
		expect(pressed).toEqual(['true', 'false']);
		expect(page.getByText('Parteien').element().tagName).not.toBe('LEGEND');
		expectSystemLook(group.querySelector('button')!);
	});

	it('wechselt die Auswahl und meldet nur echte Wechsel', async () => {
		const onchange = vi.fn();
		render(Segmente, { label: 'Parteien', items, value: 'fixed', onchange });
		await page.getByRole('button', { name: 'Feste Plätze' }).click();
		expect(onchange).not.toHaveBeenCalled();
		await page.getByRole('button', { name: 'Nach Größe' }).click();
		expect(onchange).toHaveBeenCalledWith('size');
		expect(
			page.getByRole('button', { name: 'Nach Größe' }).element().getAttribute('aria-pressed')
		).toBe('true');
	});

	it('stößt die Knöpfe aneinander (gemeinsamer Rand)', () => {
		render(Segmente, { label: 'Parteien', items, value: 'fixed' });
		const [a, b] = page.getByRole('group').element().querySelectorAll('button');
		expect(b.getBoundingClientRect().left - a.getBoundingClientRect().right).toBeCloseTo(-2, 0);
	});
});

describe('schalter.svelte', () => {
	it('zeigt den Zustand mit Häkchen und aria-pressed, Name aus Label und Text', async () => {
		const onchange = vi.fn();
		render(Schalter, { label: 'Nichtwähler', text: 'Mitzählen', pressed: false, onchange });
		const b = page.getByRole('button', { name: 'Nichtwähler Mitzählen' });
		expect(b.element().getAttribute('aria-pressed')).toBe('false');
		expect(b.element().querySelector('[aria-hidden="true"]')).not.toBeNull();
		expectSystemLook(b.element());
		await b.click();
		expect(b.element().getAttribute('aria-pressed')).toBe('true');
		expect(onchange).toHaveBeenCalledWith(true);
		const check = getComputedStyle(b.element().querySelector('[aria-hidden="true"]')!, '::after');
		expect(check.content).not.toBe('none');
	});
});

describe('auswahl.svelte', () => {
	it('ist ein beschriftetes Select ohne Browser-Optik und meldet Wechsel', async () => {
		const onchange = vi.fn();
		render(Auswahl, {
			label: 'Sortierung',
			items: [
				{ value: 'alpha', text: 'Alphabet' },
				{ value: 'nr', text: 'Bezirksnummer' }
			],
			value: 'alpha',
			onchange
		});
		const sel = page.getByLabelText('Sortierung');
		const el = sel.element() as HTMLSelectElement;
		expect(el.tagName).toBe('SELECT');
		expect(el.value).toBe('alpha');
		expect(box(el).appearance).toBe('none');
		expect(box(el).backgroundImage).toContain('svg');
		expectSystemLook(el);
		await sel.selectOptions('nr');
		expect(onchange).toHaveBeenCalledWith('nr');
	});
});

describe('regler.svelte', () => {
	it('zeigt den Wert als Ausgabe und als aria-valuetext', async () => {
		const oninput = vi.fn();
		const fmt = (v: number): string => `${v}\u00a0%`;
		render(Regler, { label: 'Schwelle', min: 0, max: 10, value: 5, format: fmt, oninput });
		const input = page.getByLabelText('Schwelle').element() as HTMLInputElement;
		expect(input.type).toBe('range');
		expect(input.getAttribute('aria-valuetext')).toBe('5\u00a0%');
		expect(document.querySelector('output')?.textContent).toBe('5\u00a0%');
		input.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(input.getAttribute('aria-valuetext')).toBe('6\u00a0%');
		expect(document.querySelector('output')?.textContent).toBe('6\u00a0%');
		await vi.waitFor(() => expect(oninput).toHaveBeenLastCalledWith(6));
	});
});
