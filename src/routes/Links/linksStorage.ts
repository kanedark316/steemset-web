import { parseYouTubeUrl, type YouTubeKind } from './parseYouTubeUrl';

export type SavedLink = {
    id: string,
    title: string,
    url: string,
    embedUrl: string,
    kind: YouTubeKind,
    createdAt: number,
    updatedAt: number,
};

const STORAGE_KEY = 'stremio-web-links-v1';

const readAll = (): SavedLink[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeAll = (links: SavedLink[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
};

export const loadLinks = (): SavedLink[] =>
    readAll().slice().sort((a, b) => b.updatedAt - a.updatedAt);

export const saveLink = (input: { id?: string, title: string, url: string }): SavedLink => {
    const parsed = parseYouTubeUrl(input.url);
    if (!parsed) {
        throw new Error(
            'Use a youtube.com / youtu.be video, playlist, /channel/UC…, or /user/… URL. @handles need a channel ID URL for embed.'
        );
    }

    const now = Date.now();
    const links = readAll();
    const title = input.title.trim() || parsed.suggestedTitle;

    if (input.id) {
        const index = links.findIndex((link) => link.id === input.id);
        if (index === -1) {
            throw new Error('Link not found');
        }
        const updated: SavedLink = {
            ...links[index],
            title,
            url: input.url.trim(),
            embedUrl: parsed.embedUrl,
            kind: parsed.kind,
            updatedAt: now,
        };
        links[index] = updated;
        writeAll(links);
        return updated;
    }

    const created: SavedLink = {
        id: `link_${now}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        url: input.url.trim(),
        embedUrl: parsed.embedUrl,
        kind: parsed.kind,
        createdAt: now,
        updatedAt: now,
    };
    links.push(created);
    writeAll(links);
    return created;
};

export const removeLink = (id: string): void => {
    writeAll(readAll().filter((link) => link.id !== id));
};

export const clearAllLinks = (): void => {
    writeAll([]);
};
