// Fork-local Links admin gate (not production-grade auth).
// Change ADMIN_PIN below, then rebuild / refresh. Session unlock uses sessionStorage only.

export const ADMIN_PIN = '1234';

const SESSION_KEY = 'stremio-web-links-admin-v1';

export const isAdminUnlocked = (): boolean => {
    try {
        return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
        return false;
    }
};

export const unlockAdmin = (pin: string): boolean => {
    if (pin !== ADMIN_PIN) {
        return false;
    }
    try {
        sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
        // ignore quota / private mode
    }
    return true;
};

export const lockAdmin = (): void => {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // ignore
    }
};
