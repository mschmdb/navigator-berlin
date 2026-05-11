import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => new Response('ok', { status: 200 });
