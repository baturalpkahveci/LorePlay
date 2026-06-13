import type { Game } from '../interfaces/models';
import { authenticatedFetch } from './apiClient';

const LOCAL_STORAGE_KEY = 'game-journal-data';

export const loadLocalGames = (): Game[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) as Game[] : [];
  } catch {
    return [];
  }
};

export const saveLocalGames = (games: Game[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(games));
};

const parseError = async (response: Response) => {
  try {
    const body = await response.json() as { error?: string };
    return body.error || 'Cloud request failed.';
  } catch {
    return 'Cloud request failed.';
  }
};

export const loadCloudGames = async (): Promise<Game[]> => {
  const response = await authenticatedFetch('/api/journal');
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json() as { games: Game[] };
  return body.games;
};

export const saveCloudGames = async (games: Game[]): Promise<void> => {
  const response = await authenticatedFetch('/api/journal', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ games }),
  });
  if (!response.ok) throw new Error(await parseError(response));
};
