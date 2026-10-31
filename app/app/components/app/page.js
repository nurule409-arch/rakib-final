import { supabase, mediaUrl } from '../lib/supabase';
import { Gallery, Socials, ContactForm } from '../components/Parts';
export const dynamic = 'force-dynamic';

const SERVICES = [
  ['AI-Generated Product Images', 'Studio-quality product visuals created with AI, tailored to your brand.'],
  ['Food Product Advertisements', 'Mouth-watering ad creatives that make your food products stand out.'],
  ['Cinematic AI Video Ads', 'Short, scroll-stopping AI video ads with a cinematic look.'],
  ['Commercial Video Editing', 'Clean, fast-paced edits for ads, social media and product promos.'],
];

export default async function Home() {
  const [{ data: items }, { data: links }] = await Promise.all([
    supabase.from('portfolio_items').select('*').eq('published', true).order('created_at', { ascending: false }),
    supabase.from('social_links').select('*').eq('enabled', true).neq('url', '').order('sort'),
  ]);
  const gallery = (items || []).map((i) => ({ ...i, url: mediaUrl(i.media_path) }));
  const socials = links || [];
  return (<>
    <header><div className="wrap">
      <a className="logo" href="#home">Rakib <b>Creative</b> Studio</a>
      <nav><a className="hide-m" href="#about">About</a><a href="#services">Services</a><a href="#portfolio">Portfolio</a><a href="#contact">Contact</a></nav>
    </div></header>
    <main>
      <section id="home" className="hero"><div className="wrap">
        <h1>AI visuals & video<br />that sell your product.</h1>
        <p className="sub">Rakib Creative Studio creates AI product images, food advertisements and cinematic video ads for brands.</p>
        <p style={{ marginTop: 28 }} className="row"><a className="btn" href="#contact">Start a project</a><a className="btn ghost" href="#portfolio">View work</a></p>
      </div></section>
      <section id="about"><div className="wrap">
        <h2>About</h2>
        <p className="sub">Rakib Creative Studio is a creative studio focused on AI-generated imagery and video advertising for products and food brands.</p>
      </div></section>
      <section id="services"><div className="wrap">
        <h2>Services</h2>
        <div className="grid">{SERVICES.map(([t, d]) => (<div className="card" key={t}><div className="pad"><h3>{t}</h3><p>{d}</p></div></div>))}</div>
      </div></section>
      <section id="portfolio"><div className="wrap">
        <h2>Portfolio</h2><p className="sub">Selected projects.</p>
        <Gallery items={gallery} />
      </div></section>
      <section id="contact"><div className="wrap">
        <h2>Contact</h2><p className="sub">Tell me about your project, or reach out directly:</p>
        <Socials links={socials} />
        <div style={{ marginTop: 28 }}><ContactForm /></div>
      </div></section>
    </main>
    <footer>© {new Date().getFullYear()} Rakib Creative Studio</footer>
  </>);
    }
