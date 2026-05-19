import { describe, it, expect } from 'vitest';
import { createGetVotingDistrictGeometryTool } from './get-voting-district-geometry.js';

const FEATURE = {
	type: 'Feature',
	geometry: { type: 'Polygon', coordinates: [[[13.4, 52.5], [13.5, 52.5], [13.5, 52.6], [13.4, 52.5]]] },
	properties: { district_id: '075-01-100-0', year: 2025, bezirk_code: '01' }
};

describe('get_voting_district_geometry tool', () => {
	it('hat snake_case-Name', () => {
		const tool = createGetVotingDistrictGeometryTool({ fetchGeometry: async () => null });
		expect(tool.name).toBe('get_voting_district_geometry');
	});

	it('liefert GeoJSON-Feature', async () => {
		const tool = createGetVotingDistrictGeometryTool({
			fetchGeometry: async () => FEATURE
		});
		const out = (await tool.handler({
			district_id: '075-01-100-0',
			year: 2025
		})) as Record<string, unknown>;
		expect(out.type).toBe('Feature');
		expect(out.properties).toMatchObject({ district_id: '075-01-100-0', year: 2025 });
	});

	it('Error district_not_found wenn null', async () => {
		const tool = createGetVotingDistrictGeometryTool({ fetchGeometry: async () => null });
		const out = (await tool.handler({
			district_id: 'invalid-id',
			year: 2025
		})) as Record<string, unknown>;
		expect(out.error).toBe('district_not_found');
	});

	it('Schema-Validation: year out-of-range wirft', async () => {
		const tool = createGetVotingDistrictGeometryTool({ fetchGeometry: async () => null });
		await expect(
			tool.handler({ district_id: '075-01-100-0', year: 1990 })
		).rejects.toThrow();
	});

	it('Schema-Validation: leerer district_id wirft', async () => {
		const tool = createGetVotingDistrictGeometryTool({ fetchGeometry: async () => null });
		await expect(tool.handler({ district_id: '', year: 2025 })).rejects.toThrow();
	});
});
