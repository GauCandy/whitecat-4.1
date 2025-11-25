/**
 * Neko.best API Utility
 * Fetches anime GIFs from neko.best API
 */

const NEKOBEST_BASE_URL = 'https://nekos.best/api/v2';

export interface NekoBestResponse {
  results: Array<{
    url: string;
    anime_name?: string;
  }>;
}

/**
 * Fetch a random GIF from neko.best API
 * @param action Action type (hug, pat, kiss, etc.)
 * @returns Image URL
 */
export async function fetchNekoGif(action: string): Promise<string> {
  try {
    const response = await fetch(`${NEKOBEST_BASE_URL}/${action}`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json() as NekoBestResponse;

    if (!data.results || data.results.length === 0) {
      throw new Error('No results from API');
    }

    return data.results[0].url;
  } catch (error) {
    console.error(`[NekoBest] Failed to fetch ${action}:`, error);
    throw new Error('Failed to fetch anime GIF');
  }
}

/**
 * Available expression actions (1 person)
 */
export const EXPRESSION_ACTIONS = [
  'lurk', 'sleep', 'shrug', 'stare', 'wave', 'smile', 'wink',
  'blush', 'smug', 'think', 'bored', 'yawn', 'facepalm',
  'happy', 'angry', 'run', 'nod', 'nope', 'dance', 'cry',
  'pout', 'thumbsup', 'laugh'
] as const;

/**
 * Available interaction actions (2 people)
 */
export const INTERACTION_ACTIONS = [
  'shoot', 'poke', 'peck', 'tickle', 'yeet', 'highfive', 'feed',
  'bite', 'nom', 'cuddle', 'kick', 'hug', 'pat', 'kiss',
  'punch', 'handshake', 'slap', 'handhold'
] as const;

export type ExpressionAction = typeof EXPRESSION_ACTIONS[number];
export type InteractionAction = typeof INTERACTION_ACTIONS[number];
