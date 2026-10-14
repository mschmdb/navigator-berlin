/**
 * Klassengrenzen der Bestandsmiete (EUR/m2), abgeleitet aus den Quintilen der 538
 * Planungsraum-Werte im generierten GeoJSON (auf 0,1 gerundet). `miete-stops.test.ts`
 * rechnet sie aus der Manifest-Datei nach und schlägt bei neuen Daten an.
 * Reihenfolge: Minimum, 20 %, 40 %, 60 %, 80 % Quantil. Darüber bleibt die oberste Farbe.
 */
export const MIETE_STOPS = [5.1, 6.9, 7.5, 7.9, 8.6] as const;
