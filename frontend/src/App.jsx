import { useEffect, useState } from 'react';
import {
  ArrowDownWideNarrow,
  Check,
  FileText,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const colors = [
  { id: 'paper', label: 'Paper', hex: '#f2f0e9' },
  { id: 'sage', label: 'Sage', hex: '#dce8d9' },
  { id: 'peach', label: 'Peach', hex: '#f3dfd1' },
  { id: 'sky', label: 'Sky', hex: '#dce8ed' },
  { id: 'lilac', label: 'Lilac', hex: '#e9e1ee' },
];

async function request(path, options) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || 'The request could not be completed.');
  return data;
}

function formatDate(date) {
  if (!date) return 'Just now';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));
}

function App() {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
        const result = await request(`/api/notes${query}`);
        if (!active) return;
        setNotes(result);
        setActiveId((current) => (result.some((note) => note._id === current) ? current : result[0]?._id || null));
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  const activeNote = draft || notes.find((note) => note._id === activeId) || null;

  function startNote() {
    setDraft({ title: '', content: '', color: 'paper' });
    setActiveId(null);
    setSaveMessage('');
  }

  function updateActiveNote(field, value) {
    if (draft) {
      setDraft((current) => ({ ...current, [field]: value }));
    } else {
      setNotes((current) => current.map((note) => note._id === activeId ? { ...note, [field]: value } : note));
    }
    setSaveMessage('');
  }

  async function saveNote(event) {
    event.preventDefault();
    if (!activeNote || saving) return;
    setSaving(true);
    setError('');
    try {
      const saved = await request(draft ? '/api/notes' : `/api/notes/${activeNote._id}`, {
        method: draft ? 'POST' : 'PUT',
        body: JSON.stringify({
          title: activeNote.title.trim(),
          content: activeNote.content,
          color: activeNote.color,
        }),
      });
      setNotes((current) => draft
        ? [saved, ...current]
        : current.map((note) => (note._id === saved._id ? saved : note)));
      setActiveId(saved._id);
      setDraft(null);
      setSaveMessage('Saved');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    if (!activeNote || draft) {
      setDraft(null);
      setActiveId(notes[0]?._id || null);
      return;
    }
    if (!window.confirm(`Delete “${activeNote.title}”? This cannot be undone.`)) return;
    try {
      await request(`/api/notes/${activeNote._id}`, { method: 'DELETE' });
      const remaining = notes.filter((note) => note._id !== activeNote._id);
      setNotes(remaining);
      setActiveId(remaining[0]?._id || null);
      setError('');
      setSaveMessage('');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function selectNote(note) {
    setDraft(null);
    setActiveId(note._id);
    setSaveMessage('');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Margin home">
          <span className="brand-mark"><span /></span>
          <span>margin<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-label">YOUR SPACE</div>
        <button className="nav-item nav-item-active" type="button">
          <FileText size={17} strokeWidth={1.8} />
          <span>All notes</span>
          <span className="nav-count">{notes.length}</span>
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-rule" />
          <div className="sidebar-note"><Sparkles size={15} /> A little space for every thought.</div>
          <div className="sidebar-foot">YOUR PERSONAL NOTEBOOK</div>
        </div>
      </aside>

      <section className="workspace" id="home">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>Notes</strong></div>
          <div className="topbar-status"><span className="status-dot" /> PRIVATE SPACE</div>
        </header>

        <div className="content-area">
          <section className="notes-column" aria-label="Notes list">
            <div className="list-heading">
              <div className="eyebrow">YOUR COLLECTION</div>
              <div className="title-row">
                <h1>Notes<span className="heading-period">.</span></h1>
                <span className="total-count">{notes.length.toString().padStart(2, '0')}</span>
              </div>
              <p className="intro-copy">Gather the little things.</p>
            </div>

            <div className="list-tools">
              <label className="search-box">
                <Search size={16} strokeWidth={1.8} />
                <input
                  aria-label="Search notes"
                  placeholder="Find a note..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
              </label>
              <div className="list-meta"><span>{search ? 'SEARCH RESULTS' : 'RECENTLY UPDATED'}</span><ArrowDownWideNarrow size={15} /></div>
            </div>

            <div className="note-list" aria-live="polite">
              {loading && notes.length === 0 && !draft && (
                <div className="list-message"><LoaderCircle className="spin" size={19} /> Loading your notes</div>
              )}
              {!loading && notes.length === 0 && !draft && (
                <div className="list-message empty-list">
                  <span className="empty-glyph">—</span>
                  <strong>{search ? 'Nothing found' : 'A blank page'}</strong>
                  <span>{search ? 'Try another search.' : 'Start with a thought.'}</span>
                  {!search && <button type="button" onClick={startNote}>Write a note <Plus size={14} /></button>}
                </div>
              )}
              {notes.map((note) => (
                <button
                  className={`note-row ${activeId === note._id && !draft ? 'note-row-active' : ''}`}
                  key={note._id}
                  type="button"
                  onClick={() => selectNote(note)}
                >
                  <span className={`note-swatch swatch-${note.color}`} />
                  <span className="note-row-copy">
                    <span className="note-row-title">{note.title}</span>
                    <span className="note-row-preview">{note.content || 'No additional details'}</span>
                  </span>
                  <span className="note-row-date">{formatDate(note.updatedAt)}</span>
                </button>
              ))}
            </div>

            <button className="new-note-button" type="button" onClick={startNote}>
              <span className="plus-box"><Plus size={17} /></span>
              <span>New note</span>
              <span className="new-note-shortcut">+</span>
            </button>
          </section>

          <section className="editor-column" aria-label="Note editor">
            {error && (
              <div className="error-banner" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button>
              </div>
            )}

            {activeNote ? (
              <form className={`editor-paper paper-${activeNote.color}`} onSubmit={saveNote}>
                <div className="editor-toolbar">
                  <div className="editor-context"><span className="editor-context-dot" /> NOTE EDITOR <span className="toolbar-slash">/</span> {draft ? 'NEW NOTE' : 'PERSONAL'}</div>
                  <button className="delete-button" type="button" onClick={deleteNote} aria-label={draft ? 'Discard new note' : 'Delete note'} title={draft ? 'Discard note' : 'Delete note'}>
                    {draft ? <X size={17} /> : <Trash2 size={16} />}
                  </button>
                </div>

                <div className="editor-body">
                  <div className="editor-date">{draft ? 'A NEW PAGE' : `LAST TOUCHED ${formatDate(activeNote.updatedAt).toUpperCase()}`}</div>
                  <input
                    className="title-input"
                    maxLength={100}
                    placeholder="Untitled note"
                    value={activeNote.title}
                    onChange={(event) => updateActiveNote('title', event.target.value)}
                    required
                    aria-label="Note title"
                  />
                  <div className="title-underline" />
                  <textarea
                    className="content-input"
                    maxLength={10000}
                    placeholder="Let your thoughts wander..."
                    value={activeNote.content}
                    onChange={(event) => updateActiveNote('content', event.target.value)}
                    aria-label="Note content"
                  />
                  <div className="editor-footer">
                    <div className="color-picker" role="group" aria-label="Note color">
                      <span className="color-label">PAGE COLOR</span>
                      {colors.map((color) => (
                        <button
                          className={`color-choice ${activeNote.color === color.id ? 'color-choice-active' : ''}`}
                          key={color.id}
                          type="button"
                          style={{ '--swatch': color.hex }}
                          onClick={() => updateActiveNote('color', color.id)}
                          aria-label={`${color.label} note color`}
                          aria-pressed={activeNote.color === color.id}
                        >
                          {activeNote.color === color.id && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                    <span className="character-count">{activeNote.content.length.toLocaleString()} / 10,000</span>
                  </div>
                </div>

                <div className="editor-bottom-bar">
                  <span className="save-status">{saveMessage ? <><Check size={14} /> {saveMessage}</> : 'Changes save when you choose Save'}</span>
                  <button className="save-button" type="submit" disabled={saving || !activeNote.title.trim()}>
                    {saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
                    {saving ? 'Saving' : draft ? 'Create note' : 'Save note'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="editor-empty">
                <div className="empty-page-icon"><FileText size={24} strokeWidth={1.4} /></div>
                <div className="eyebrow">YOUR NEXT THOUGHT</div>
                <h2>There is room<br />for something new.</h2>
                <p>Every good idea starts somewhere.</p>
                <button type="button" className="empty-create-button" onClick={startNote}><Plus size={16} /> Write your first note</button>
                <span className="empty-decoration">MARGIN · EST. TODAY</span>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;