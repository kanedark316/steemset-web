import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import { MainNavBars, Button, TextInput } from 'stremio/components';
import { isAdminUnlocked, unlockAdmin, lockAdmin } from './adminAuth';
import { loadLinks, saveLink, removeLink, type SavedLink } from './linksStorage';
import styles from './Links.less';

const Links = () => {
    const [links, setLinks] = useState<SavedLink[]>(() => loadLinks());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [admin, setAdmin] = useState(() => isAdminUnlocked());
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [pin, setPin] = useState('');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const selected = useMemo(
        () => links.find((link) => link.id === selectedId) ?? null,
        [links, selectedId]
    );

    const refresh = useCallback(() => {
        const next = loadLinks();
        setLinks(next);
        setSelectedId((current) => {
            if (current && next.some((link) => link.id === current)) {
                return current;
            }
            return next[0]?.id ?? null;
        });
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const onUnlock = useCallback(() => {
        setError(null);
        if (!unlockAdmin(pin)) {
            setError('Wrong admin PIN');
            return;
        }
        setAdmin(true);
        setPin('');
        setShowAdminForm(true);
    }, [pin]);

    const onLock = useCallback(() => {
        lockAdmin();
        setAdmin(false);
        setShowAdminForm(false);
        setEditingId(null);
        setTitle('');
        setUrl('');
        setError(null);
    }, []);

    const onStartEdit = useCallback((link: SavedLink) => {
        setEditingId(link.id);
        setTitle(link.title);
        setUrl(link.url);
        setShowAdminForm(true);
        setError(null);
    }, []);

    const onCancelEdit = useCallback(() => {
        setEditingId(null);
        setTitle('');
        setUrl('');
        setError(null);
    }, []);

    const onSave = useCallback(() => {
        setError(null);
        try {
            const saved = saveLink({
                id: editingId ?? undefined,
                title,
                url,
            });
            refresh();
            setSelectedId(saved.id);
            onCancelEdit();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save link');
        }
    }, [editingId, title, url, refresh, onCancelEdit]);

    const onDelete = useCallback((id: string) => {
        removeLink(id);
        if (editingId === id) {
            onCancelEdit();
        }
        refresh();
    }, [editingId, onCancelEdit, refresh]);

    return (
        <MainNavBars className={styles['links-container']} route={'links'}>
            <div className={classnames(styles['links-content'], 'animation-fade-in')}>
                <div className={styles['header-row']}>
                    <div>
                        <div className={styles['title']}>Links</div>
                        <div className={styles['subtitle']}>
                            Saved YouTube videos and channels — plays via official youtube.com/embed only
                        </div>
                    </div>
                    <div className={styles['admin-actions']}>
                        {
                            admin ?
                                <>
                                    <Button
                                        className={classnames(styles['action-button'], styles['accent'])}
                                        title={'Add link'}
                                        onClick={() => {
                                            onCancelEdit();
                                            setShowAdminForm(true);
                                        }}
                                    >
                                        <Icon className={styles['action-icon']} name={'add'} />
                                        Add
                                    </Button>
                                    <Button className={styles['action-button']} title={'Lock admin'} onClick={onLock}>
                                        Lock admin
                                    </Button>
                                </>
                                :
                                <Button
                                    className={styles['action-button']}
                                    title={'Admin'}
                                    onClick={() => {
                                        setShowAdminForm((open) => !open);
                                        setError(null);
                                    }}
                                >
                                    Admin
                                </Button>
                        }
                    </div>
                </div>

                {
                    showAdminForm && !admin ?
                        <div className={styles['admin-panel']}>
                            <div className={styles['admin-panel-title']}>Admin unlock</div>
                            <div className={styles['admin-hint']}>
                                Enter the local PIN (default in code: see adminAuth.ts). Not production auth.
                            </div>
                            <div className={styles['form-row']}>
                                <TextInput
                                    className={styles['text-input']}
                                    type={'password'}
                                    placeholder={'PIN'}
                                    value={pin}
                                    onChange={(event) => setPin(event.currentTarget.value)}
                                    onSubmit={onUnlock}
                                />
                                <Button className={classnames(styles['action-button'], styles['accent'])} onClick={onUnlock}>
                                    Unlock
                                </Button>
                            </div>
                            {error ? <div className={styles['error']}>{error}</div> : null}
                        </div>
                        :
                        null
                }

                {
                    admin && showAdminForm ?
                        <div className={styles['admin-panel']}>
                            <div className={styles['admin-panel-title']}>
                                {editingId ? 'Edit link' : 'Add YouTube link'}
                            </div>
                            <div className={styles['admin-hint']}>
                                Paste a youtube.com / youtu.be video, playlist, /channel/UC…, or /user/… URL.
                                @handle URLs need a /channel/UC… link for embed playback.
                            </div>
                            <div className={styles['form-row']}>
                                <TextInput
                                    className={styles['text-input']}
                                    placeholder={'Title (optional)'}
                                    value={title}
                                    onChange={(event) => setTitle(event.currentTarget.value)}
                                />
                                <TextInput
                                    className={styles['text-input']}
                                    placeholder={'https://www.youtube.com/watch?v=…'}
                                    value={url}
                                    onChange={(event) => setUrl(event.currentTarget.value)}
                                    onSubmit={onSave}
                                />
                                <Button className={classnames(styles['action-button'], styles['accent'])} onClick={onSave}>
                                    Save
                                </Button>
                                <Button className={styles['action-button']} onClick={onCancelEdit}>
                                    Clear
                                </Button>
                            </div>
                            {error ? <div className={styles['error']}>{error}</div> : null}
                        </div>
                        :
                        null
                }

                <div className={styles['body']}>
                    <div className={styles['list-pane']}>
                        {
                            links.length === 0 ?
                                <div className={styles['empty']}>
                                    No saved links yet. Unlock Admin to paste a YouTube URL.
                                </div>
                                :
                                links.map((link) => (
                                    <div
                                        key={link.id}
                                        className={classnames(styles['link-card'], {
                                            [styles['selected']]: link.id === selectedId,
                                        })}
                                        role={'button'}
                                        tabIndex={0}
                                        title={link.title}
                                        onClick={() => setSelectedId(link.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                setSelectedId(link.id);
                                            }
                                        }}
                                    >
                                        <div className={styles['link-card-title']}>{link.title}</div>
                                        <div className={styles['link-card-meta']}>{link.kind} · {link.url}</div>
                                        {
                                            admin ?
                                                <div className={styles['link-card-actions']}>
                                                    <Button
                                                        className={styles['mini-button']}
                                                        title={'Edit'}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            onStartEdit(link);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        className={classnames(styles['mini-button'], styles['danger'])}
                                                        title={'Remove'}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            onDelete(link.id);
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                :
                                                null
                                        }
                                    </div>
                                ))
                        }
                    </div>

                    <div className={styles['player-pane']}>
                        {
                            selected ?
                                <>
                                    <div className={styles['player-title']}>{selected.title}</div>
                                    <div className={styles['player-frame-wrap']}>
                                        <iframe
                                            className={styles['player-frame']}
                                            title={selected.title}
                                            src={selected.embedUrl}
                                            allow={'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'}
                                            allowFullScreen
                                            referrerPolicy={'strict-origin-when-cross-origin'}
                                        />
                                    </div>
                                </>
                                :
                                <div className={styles['player-placeholder']}>
                                    Select a link to play it in the official YouTube embed.
                                </div>
                        }
                    </div>
                </div>
            </div>
        </MainNavBars>
    );
};

export default Links;
