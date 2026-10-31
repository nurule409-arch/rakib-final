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
