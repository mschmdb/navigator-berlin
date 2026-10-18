import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import AsyncBlock from './inspector-async-block.svelte';

const content = createRawSnippet(() => ({
	render: () => '<p data-testid="block-content">Inhalt</p>'
}));

describe('inspector-async-block.svelte', () => {
	it('zeigt ohne Ladezustand nur den Inhalt, ohne aria-busy', async () => {
		render(AsyncBlock, {
			busy: false,
			hasValue: true,
			shape: 'score',
			testid: 'block',
			children: content
		});
		await expect.element(page.getByTestId('block-content')).toBeInTheDocument();
		const block = page.getByTestId('block').element();
		expect(block.getAttribute('aria-busy')).toBeNull();
		expect(block.classList.contains('lc-stale')).toBe(false);
	});

	it('lässt beim Nachladen den alten Inhalt stehen, gedimmt und mit aria-busy', async () => {
		render(AsyncBlock, {
			busy: true,
			hasValue: true,
			shape: 'score',
			testid: 'block',
			children: content
		});
		await expect.element(page.getByTestId('block-content')).toBeInTheDocument();
		const block = page.getByTestId('block').element();
		expect(block.getAttribute('aria-busy')).toBe('true');
		expect(block.classList.contains('lc-stale')).toBe(true);
		expect(document.querySelector('[data-testid="inspector-skeleton"]')).toBeNull();
	});

	it('zeigt ohne alten Wert einen Platzhalter statt des Inhalts', async () => {
		render(AsyncBlock, {
			busy: true,
			hasValue: false,
			shape: 'wahl',
			testid: 'block',
			children: content
		});
		await expect.element(page.getByTestId('inspector-skeleton')).toBeInTheDocument();
		expect(document.querySelector('[data-testid="block-content"]')).toBeNull();
		const block = page.getByTestId('block').element();
		expect(block.getAttribute('aria-busy')).toBe('true');
		expect(block.classList.contains('lc-stale')).toBe(false);
		const skeleton = page.getByTestId('inspector-skeleton').element();
		expect(skeleton.getAttribute('data-shape')).toBe('wahl');
	});

	it('Platzhalter nennt den Ladezustand für Screenreader', async () => {
		render(AsyncBlock, {
			busy: true,
			hasValue: false,
			shape: 'klima',
			testid: 'block',
			children: content
		});
		await expect.element(page.getByText('Lädt …')).toBeInTheDocument();
	});
});
