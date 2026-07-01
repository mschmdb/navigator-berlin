import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import InDeinerNaehe from './in-deiner-naehe.svelte';
import type { KuehleOrt } from '$lib/data/get-kuehle-orte-index.js';
import type { PositionResult } from '$lib/utils/geolocation.js';

const NOW = new Date(2026, 6, 1, 12, 0, 0);

function ort(over: Partial<KuehleOrt> & Pick<KuehleOrt, 'id' | 'name'>): KuehleOrt {
	return {
		cat: 'Kino',
		lat: 52.52,
		lng: 13.405,
		coolScore: 4,
		acStatus: 'yes',
		isFree: 'free',
		summerAvailable: 'yes',
		address: 'Teststr 1, 10117 Berlin',
		website: '',
		googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=52.52,13.405',
		appleMapsUrl: 'https://maps.apple.com/?daddr=52.52,13.405',
		openingHoursNote: '',
		openingHours: '24/7',
		...over
	};
}

const okPosition = async (): Promise<PositionResult> => ({ ok: true, lat: 52.52, lng: 13.405 });

describe('InDeinerNaehe (Story 16.3)', () => {
	it('Klick auf „in meiner Nähe" zeigt die nächsten offenen Orte', async () => {
		render(InDeinerNaehe, {
			explorerHref: '/explore?layers=kuehle-orte&mode=hitze',
			requestPositionFn: okPosition,
			loadIndex: async () => [ort({ id: 'node/1', name: 'Kino Nah' })],
			now: NOW
		});
		await page.getByTestId('naehe-locate').click();
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		await expect.element(page.getByText('Kino Nah')).toBeInTheDocument();
	});

	it('verweigerter Standort zeigt Fallback + Karten-Link', async () => {
		render(InDeinerNaehe, {
			explorerHref: '/explore?layers=kuehle-orte&mode=hitze',
			requestPositionFn: async () => ({ ok: false, reason: 'denied' }),
			loadIndex: async () => [],
			now: NOW
		});
		await page.getByTestId('naehe-locate').click();
		await expect.element(page.getByTestId('naehe-fallback')).toBeInTheDocument();
	});

	it('kein offener Ort in der Nähe zeigt Leer-Hinweis', async () => {
		render(InDeinerNaehe, {
			explorerHref: '/explore?layers=kuehle-orte&mode=hitze',
			requestPositionFn: okPosition,
			// Ort mit Zeiten, die um 12:00 geschlossen sind → jetzt-offen-Filter leert die Liste
			loadIndex: async () => [
				ort({ id: 'node/2', name: 'Zu', openingHours: 'Mo-Su 20:00-23:00' })
			],
			now: NOW
		});
		await page.getByTestId('naehe-locate').click();
		await expect.element(page.getByTestId('naehe-empty')).toBeInTheDocument();
	});
});
