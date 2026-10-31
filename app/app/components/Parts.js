'use client';
import { useState } from 'react';
import { FaWhatsapp, FaFacebookF, FaBehance, FaInstagram, FaYoutube } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { supabase, CATEGORIES } from '../lib/supabase';

export function Gallery({ items }) {
  const [cat, setCat] = useState('all');
  const list = cat === 'all' ? items : items.filter((i) => i.category === cat);
  return (<>
    <div className="tags">
      {['all', ...Object.keys(CATEGORIES)].map((c) => (
        <button key={c} className={'tag' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c === 'all' ? 'All' : CATEGORIES[c]}</button>))}
    </div>
    {list.length === 0 && <p className="note">No projects yet. Check back soon.</p>}
    <div className="grid">{list.map((i) => (
      <article className="card" key={i.id}>
        {i.media_type === 'video'
          ? <video src={i.url} controls playsInline preload="metadata" />
          : <img src={i.url} alt={i.title} loading="lazy" />}
        <div className="pad"><h3>{i.title}</h3><p>{CATEGORIES[i.category]}</p>{i.description && <p style={{marginTop:6}}>{i.description}</p>}</div>
      </article>))}
    </div>
  </>);
}

const ICONS = { email: MdEmail, whatsapp: FaWhatsapp, facebook: FaFacebookF, behance: FaBehance, instagram: FaInstagram, youtube: FaYoutube };
export function Socials({ links }) {
  if (!links.length) return null;
  return (<div className="socials">{links.map((l) => {
    const Icon = ICONS[l.platform];
    const ext = !l.url.startsWith('mailto:');
    return (<a key={l.id} className="soc" href={l.url} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Icon /> {l.label}</a>);
  })}</div>);
}

export function ContactForm() {
  const [s, setS] = useState('idle');
  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    const f = new FormData(form);
    if (f.get('website')) return;
    setS('sending');
    const { error } = await supabase.from('messages').insert({
      name: f.get('name'), email: f.get('email'), service: f.get('service'), message: f.get('message') });
    if (error) setS('err'); else { form.reset(); setS('ok'); }
  }
  return (
    <form className="f" onSubmit={submit}>
      <input name="name" placeholder="Your name" required maxLength={100} />
      <input name="email" type="email" placeholder="Your email" required maxLength={200} />
      <select name="service" defaultValue="">
        <option value="">Service needed (optional)</option>
        <option>AI Product Images</option><option>Food Product Ads</option>
        <option>Cinematic AI Video Ad</option><option>Commercial Video Editing</option>
      </select>
      <textarea name="message" rows={5} placeholder="Tell me about your project" required minLength={5} maxLength={3000} />
      <input name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
      <button className="btn" disabled={s === 'sending'}>{s === 'sending' ? 'Sending…' : 'Send message'}</button>
      {s === 'ok' && <span className="ok">Thanks! Your message was sent.</span>}
      {s === 'err' && <span className="err">Could not send. Please use one of the contact buttons instead.</span>}
    </form>);
}
