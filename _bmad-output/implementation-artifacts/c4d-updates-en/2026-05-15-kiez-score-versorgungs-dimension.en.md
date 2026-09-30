## Five dimensions instead of four

The Kiez score gets a fifth dimension: **local amenities**.

| Dimension       | Share |
| --------------- | ----- |
| Quiet & air     | 20 %  |
| Green space     | 20 %  |
| Mobility        | 20 %  |
| Social situation | 20 % |
| Local amenities | 20 %  |

## What the amenities dimension measures

For each planning area, it calculates the nearest distance to five types of point of interest (POI):

- Daycare centre within 500 m (weight 0.25)
- Primary school within 800 m (weight 0.25)
- Hospital within 2,000 m (weight 0.20)
- Playground within 400 m (weight 0.15)
- Green space within 600 m (weight 0.15)

Distance is calculated with the Haversine formula to the POI centroid and normalised with a threshold function. The implementation lives in `scripts/build-kiez-scores.ts` and `src/lib/data/build-helpers.ts`.

## Why POI distance and not count

The plain number of daycare centres per km² does not tell densely populated Kieze apart. A family needs one daycare centre within reach, not 12 within a 100 m radius. Distance thresholds capture walking accessibility.

## Full methodology

See [Methodology for the Kiez score](/en/methodik/kiez-score).
