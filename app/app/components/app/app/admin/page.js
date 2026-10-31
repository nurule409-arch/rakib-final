'use client';
import { useEffect, useState } from 'react';
import { supabase, mediaUrl, CATEGORIES } from '../../lib/supabase';

const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
const ACCEPT = OK_TYPES.join(',');
const MAX = 50 * 1024 * 1024;
const PLATFORMS = ['email', 'whatsapp', 'facebook', 'behance', 'instagram', 'youtube'];
const HINT = { email: 'you@gmail.com', whatsapp: 'Phone with country code, digits only, or a wa.me link', facebook: 'https://facebook.com/…', behance: 'https://behance.net/…', instagram: 'https://instagram.com/…', youtube: 'https://youtube.com/@…' };

async function upload(file) {
  if (!file || !OK_TYPES.includes(file.type)) throw new Error('Unsupported type. Use JPG, PNG, WebP, MP4, MOV or WebM.');
  if (file.size > MAX) throw new Error('File too large (max 50 MB).');
  const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return { path, type: file.type.startsWith('video') ? 'video' : 'image' };
}

function normalizeUrl(platform, v) {
  v = v.trim();
  if (!v) return '';
  if (platform === 'whatsapp' && /^\+?[\d\s-]{7,}$/.test(v)) return 'https://wa.me/' + v.replace(/\D/g, '');
  if (platform === 'email' && v.includes('@') && !v.startsWith('mailto:')) return 'mailto:' + v;
  return v;
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('portfolio');
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from('admins').select('user_id').maybeSingle().then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined) return <div className="wrap" style={{ padding: 40 }}>Loading…</div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="wrap" style={{ padding: 40 }}>Checking access…</div>;
  if (!isAdmin) return (<div className="wrap" style={{ padding: 40 }}><p className="err">This account is not an authorized administrator.</p><button className="btn" onClick={() => supabase.auth.signOut()}>Log out</button></div>);
  return (
    <div className="wrap" style={{ padding: '24px 20px 80px' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Admin</h2>
        <button className="btn ghost sm" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>
      <div className="tags">
        {[['portfolio', 'Portfolio'], ['social', 'Social Media Settings'], ['messages', 'Messages']].map(([k, l]) => (
          <button key={k} className={'tag' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>))}
      </div>
      {tab === 'portfolio' && <Portfolio />}
      {tab === 'social' && <Social />}
      {tab === 'messages' && <Messages />}
    </div>);
}

function Login() {
  const [err, setErr] = useState('');
  async function go(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
    if (error) setErr('Invalid email or password.');
  }
  return (
    <div className="wrap" style={{ padding: '80px 20px' }}>
      <form className="f" onSubmit={go}>
        <h2>Admin login</h2>
        <input name="email" type="email" placeholder="Email" required autoComplete="username" />
        <input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
        <button className="btn">Log in</button>
        {err && <span className="err">{err}</span>}
      </form>
    </div>);
}

function Portfolio() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => supabase.from('portfolio_items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []));
  useEffect(() => { load(); }, []);
  const run = async (fn) => { setBusy(true); setMsg(''); try { await fn(); await load(); setMsg('Saved.'); } catch (e) { setMsg('Error: ' + (e.message || e)); } setBusy(false); };

  const add = (e) => { e.preventDefault(); const form = e.target; const f = new FormData(form);
    run(async () => {
      const { path, type } = await upload(f.get('file'));
      const { error } = await supabase.from('portfolio_items').insert({ title: f.get('title'), description: f.get('description'), category: f.get('category'), media_path: path, media_type: type });
      if (error) { await supabase.storage.from('media').remove([path]); throw error; }
      form.reset();
    }); };
  const save = (it, e) => { e.preventDefault(); const f = new FormData(e.currentTarget);
    run(async () => { const { error } = await supabase.from('portfolio_items').update({ title: f.get('title'), description: f.get('description'), category: f.get('category'), published: f.get('published') === 'on' }).eq('id', it.id); if (error) throw error; }); };
  const replace = (it, file) => file && run(async () => {
    const { path, type } = await upload(file);
    const { error } = await supabase.from('portfolio_items').update({ media_path: path, media_type: type }).eq('id', it.id);
    if (error) { await supabase.storage.from('media').remove([path]); throw error; }
    await supabase.storage.from('media').remove([it.media_path]);
  });
  const del = (it) => confirm('Delete "' + it.title + '" permanently?') && run(async () => {
    const { error } = await supabase.from('portfolio_items').delete().eq('id', it.id); if (error) throw error;
    await supabase.storage.from('media').remove([it.media_path]);
  });

  return (<>
    <form className="stack card" style={{ padding: 18 }} onSubmit={add}>
      <h3 style={{ margin: 0 }}>Add new item</h3>
      <input name="title" placeholder="Title" required maxLength={120} />
      <textarea name="description" placeholder="Description" rows={3} maxLength={1000} />
      <select name="category">{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <input name="file" type="file" accept={ACCEPT} required />
      <button className="btn" disabled={busy}>{busy ? 'Working…' : 'Upload & publish'}</button>
      <span className="note">Images or videos, up to 50 MB.</span>
    </form>
    {msg && <p className={msg.startsWith('Error') ? 'err' : 'ok'}>{msg}</p>}
    <div className="grid">{items.map((it) => (
      <form className="card" key={it.id + it.media_path} onSubmit={(e) => save(it, e)}>
        {it.media_type === 'video' ? <video src={mediaUrl(it.media_path)} controls playsInline preload="metadata" /> : <img src={mediaUrl(it.media_path)} alt="" />}
        <div className="pad stack">
          <input name="title" defaultValue={it.title} required maxLength={120} />
          <textarea name="description" defaultValue={it.description} rows={2} maxLength={1000} />
          <select name="category" defaultValue={it.category}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <label className="note"><input type="checkbox" name="published" defaultChecked={it.published} style={{ width: 'auto' }} /> Published</label>
          <label className="note">Replace file<input type="file" accept={ACCEPT} onChange={(e) => replace(it, e.target.files[0])} /></label>
          <div className="row"><button className="btn sm" disabled={busy}>Save</button><button type="button" className="btn red sm" onClick={() => del(it)} disabled={busy}>Delete</button></div>
        </div>
      </form>))}
    </div>
  </>);
}

function Social() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const load = () => supabase.from('social_links').select('*').order('sort').then(({ data }) => setRows(data || []));
  useEffect(() => { load(); }, []);
  const upd = (id, patch) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  async function save(r) {
    const url = normalizeUrl(r.platform, r.url);
    const { error } = await supabase.from('social_links').update({ platform: r.platform, label: r.label, url, enabled: r.enabled && url !== '' }).eq('id', r.id);
    setMsg(error ? 'Error: URL must start with https:// (or be an email address / WhatsApp number).' : 'Saved.');
    load();
  }
  async function remove(r) { if (!confirm('Remove ' + r.label + '?')) return; await supabase.from('social_links').delete().eq('id', r.id); load(); }
  async function add() { await supabase.from('social_links').insert({ platform: 'facebook', label: 'New link', sort: rows.length + 1 }); load(); }
  return (<>
    <p className="note">Paste your own links. A link only appears on the website when it is enabled and has a URL.</p>
    {msg && <p className={msg.startsWith('Error') ? 'err' : 'ok'}>{msg}</p>}
    <div className="stack" style={{ maxWidth: 700 }}>{rows.map((r) => (
      <div className="card pad stack" key={r.id}>
        <div className="row">
          <select value={r.platform} onChange={(e) => upd(r.id, { platform: e.target.value })} style={{ width: 140 }}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
          <input value={r.label} onChange={(e) => upd(r.id, { label: e.target.value })} placeholder="Button label" style={{ flex: 1, minWidth: 120 }} />
        </div>
        <input value={r.url} onChange={(e) => upd(r.id, { url: e.target.value })} placeholder={'PLACEHOLDER: ' + HINT[r.platform]} />
        <div className="row">
          <label><input type="checkbox" checked={r.enabled} onChange={(e) => upd(r.id, { enabled: e.target.checked })} style={{ width: 'auto' }} /> Enabled</label>
          <button className="btn sm" onClick={() => save(r)}>Save</button>
          <button className="btn red sm" onClick={() => remove(r)}>Remove</button>
        </div>
      </div>))}
      <button className="btn ghost" onClick={add}>+ Add link</button>
    </div>
  </>);
}

function Messages() {
  const [rows, setRows] = useState([]);
  const load = () => supabase.from('messages').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  useEffect(() => { load(); }, []);
  return (<div className="stack" style={{ maxWidth: 700 }}>
    {rows.length === 0 && <p className="note">No messages yet.</p>}
    {rows.map((m) => (<div className="card pad" key={m.id}>
      <b>{m.name}</b> · <a href={'mailto:' + m.email}>{m.email}</a>
      <div className="note">{m.service || 'No service selected'} · {new Date(m.created_at).toLocaleString()}</div>
      <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', marginTop: 8 }}>{m.message}</p>
      <button className="btn red sm" onClick={async () => { await supabase.from('messages').delete().eq('id', m.id); load(); }}>Delete</button>
    </div>))}
  </div>);
}
