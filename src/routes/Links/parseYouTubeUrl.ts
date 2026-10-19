export type YouTubeKind = 'video' | 'playlist' | 'channel';

export type ParsedYouTubeLink = {
    kind: YouTubeKind,
    /** Official youtube.com/embed/... URL only */
    embedUrl: string,
    /** Suggested display title when the admin leaves title blank */
    suggestedTitle: string,
};

const YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'youtu.be',
    'www.youtu.be',
]);

const videoEmbed = (videoId: string): string =>
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

const playlistEmbed = (playlistId: string): string =>
    `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`;

/** Channel uploads playlist id is UC… → UU… */
const channelUploadsEmbed = (channelId: string): string => {
    const uploadsId = channelId.startsWith('UC')
        ? `UU${channelId.slice(2)}`
        : channelId;
    return playlistEmbed(uploadsId);
};

export const parseYouTubeUrl = (raw: string): ParsedYouTubeLink | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
        return null;
    }

    let url: URL;
    try {
        url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    } catch {
        return null;
    }

    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(host)) {
        return null;
    }

    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (host === 'youtu.be' || host === 'www.youtu.be') {
        const videoId = path.slice(1).split('/')[0];
        if (videoId) {
            return {
                kind: 'video',
                embedUrl: videoEmbed(videoId),
                suggestedTitle: `YouTube video ${videoId}`,
            };
        }
        return null;
    }

    const watchId = url.searchParams.get('v');
    if (watchId) {
        return {
            kind: 'video',
            embedUrl: videoEmbed(watchId),
            suggestedTitle: `YouTube video ${watchId}`,
        };
    }

    const shortsMatch = path.match(/^\/shorts\/([^/]+)/);
    if (shortsMatch) {
        return {
            kind: 'video',
            embedUrl: videoEmbed(shortsMatch[1]),
            suggestedTitle: `YouTube short ${shortsMatch[1]}`,
        };
    }

    const embedMatch = path.match(/^\/embed\/([^/]+)/);
    if (embedMatch && embedMatch[1] !== 'videoseries') {
        return {
            kind: 'video',
            embedUrl: videoEmbed(embedMatch[1]),
            suggestedTitle: `YouTube video ${embedMatch[1]}`,
        };
    }

    const listId = url.searchParams.get('list');
    if (listId && (path === '/playlist' || path === '/embed/videoseries' || path === '/watch')) {
        return {
            kind: 'playlist',
            embedUrl: playlistEmbed(listId),
            suggestedTitle: `YouTube playlist ${listId}`,
        };
    }

    const channelMatch = path.match(/^\/channel\/(UC[\w-]+)/);
    if (channelMatch) {
        return {
            kind: 'channel',
            embedUrl: channelUploadsEmbed(channelMatch[1]),
            suggestedTitle: `YouTube channel ${channelMatch[1]}`,
        };
    }

    const handleMatch = path.match(/^\/@([\w.-]+)/);
    if (handleMatch) {
        // Official embed needs a playlist/channel id; @handles cannot be resolved without an API.
        // Fall back: open the channel's "live" embed endpoint is not reliable — reject with null
        // so the admin is prompted to paste a video, playlist, or /channel/UC… URL instead.
        // Still allow storing via a synthetic approach using youtube.com/embed with listType=user_uploads
        // only for legacy /user/USERNAME paths (below). For @handles, return null.
        return null;
    }

    const userMatch = path.match(/^\/user\/([^/]+)/);
    if (userMatch) {
        return {
            kind: 'channel',
            embedUrl: `https://www.youtube.com/embed?listType=user_uploads&list=${encodeURIComponent(userMatch[1])}`,
            suggestedTitle: `YouTube user ${userMatch[1]}`,
        };
    }

    if (path === '/embed/videoseries' && listId) {
        return {
            kind: 'playlist',
            embedUrl: playlistEmbed(listId),
            suggestedTitle: `YouTube playlist ${listId}`,
        };
    }

    return null;
};
