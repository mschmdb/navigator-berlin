/**
 * Klassengrenzen des Altbau-Anteils (Prozent der Wohnungen in Gebäuden vor 1949), abgeleitet aus
 * den Quintilen der 540 Planungsraum-Werte im generierten GeoJSON (auf ganze Prozent gerundet).
 * `altbau-stops.test.ts` rechnet sie aus der Manifest-Datei nach und schlägt bei neuen Daten an.
 * Reihenfolge: Minimum, 20 %, 40 %, 60 %, 80 % Quantil. Darüber bleibt die oberste Farbe.
 */
export const ALTBAU_STOPS = [0, 10, 26, 44, 62] as const;
