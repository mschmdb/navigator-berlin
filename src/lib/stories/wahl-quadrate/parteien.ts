/**
 * Feste Parteireihenfolge der Quadrate, alphabetisch, Grau zuletzt.
 * Lokal definiert, bis `types.ts` aus der Datenbasis (#187) steht. Danach dorthin umziehen.
 */
export const ORDER = ['afd', 'bsw', 'cdu', 'fdp', 'gruene', 'linke', 'piraten', 'spd', 'rest'] as const;

export type PartyKey = (typeof ORDER)[number];
export type NamedParty = Exclude<PartyKey, 'rest'>;

export const REST_INDEX = ORDER.length - 1;
