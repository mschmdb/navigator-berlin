const GRID_ID = /^CRS3035RES100mN(\d+)E(\d+)$/;
const HALF_CELL_M = 50;

/** Zellmittelpunkt (EPSG:3035) aus der Destatis-Gitter-ID; N/E nennen die SW-Ecke. */
export function gridIdToCenter(id: string): { x: number; y: number } {
	const match = GRID_ID.exec(id.trim());
	if (!match) throw new Error(`Ungueltige Gitter-ID: "${id}"`);
	return { x: Number(match[2]) + HALF_CELL_M, y: Number(match[1]) + HALF_CELL_M };
}
