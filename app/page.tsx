import Link from "next/link"
import type { Metadata } from "next"
import MainSiteEffects from "@/components/MainSiteEffects"
import "./main-site.css"

export const metadata: Metadata = {
  title: "Heuristica Labs — Venture Studio",
  description: "Heuristica Labs is an independent venture studio building bold, original technology companies from the ground up.",
  robots: "index, follow",
}

// Project jump chips, in page order. Tones rotate through the three brand
// pinks; TireSledz (under NDA) takes the yellow accent.
const CHIPS = [
  { id: "halo", name: "HALO", tone: "c1" },
  { id: "splintr", name: "SPLINTR", tone: "c2" },
  { id: "oneuforia", name: "OneUforia Arthaus", tone: "c3" },
  { id: "hivibe", name: "HiVibe Temple", tone: "c1" },
  { id: "tiresledz", name: "TireSledz", tone: "cy" },
  { id: "nlc", name: "No Limit Chess", tone: "c2" },
  { id: "akasha", name: "Akasha Ai", tone: "c3" },
  { id: "oneto1", name: "1 TO 1", tone: "c1" },
]

export default function HomePage() {
  return (
    <>
      {/* NAV */}
      <nav id="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <img src="/logo.png" alt="" aria-hidden="true" className="nav-brand-mark" />
            <span>HEURISTICA</span>
          </Link>
          <ul className="nav-links">
            <li><a href="#projects">Projects</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link href="/portal" className="nav-portal">Client Portal</Link></li>
          </ul>
        </div>
      </nav>

      <main className="site">
        {/* HERO */}
        <section id="hero" className="hero">
          <div className="hero-copy" data-reveal>
            <p className="kicker">Independent Venture Studio</p>
            <h1>Bold ideas.<br /><span>Real products.</span></h1>
            <p className="hero-sub">We build Ai driven solutions that are unapologetically original, obsessively crafted, and engineered to create&nbsp;value.</p>
          </div>
          <div className="hero-stats" data-reveal data-reveal-delay="1">
            <div className="stat t1"><span className="stat-number" data-count="8">8</span><span className="stat-label">Active Projects</span></div>
            <div className="stat t2"><span className="stat-number" data-count="100%">100%</span><span className="stat-label">Independent</span></div>
            <div className="stat t3"><span className="stat-number">1000%</span><span className="stat-label">All In</span></div>
          </div>
        </section>

        {/* PROJECT CHIPS */}
        <div id="projects" className="chips" aria-label="Jump to a project">
          {CHIPS.map((c) => (
            <a key={c.id} href={`#${c.id}`} className={`chip ${c.tone}`}>{c.name}</a>
          ))}
        </div>

        {/* PROJECTS */}
        <section className="bento">

          {/* HALO — lead platform (ePOV · Loop · 3D) */}
          <article id="halo" className="tile t1 span8 tall tile-big" data-reveal>
            <img src="/halo-rocker.png" alt="" aria-hidden="true" className="halo-rocker" />
            <div className="eyebrow">
              <span className="tag">Aviation SaaS</span>
              <span className="tag tag-beta">Beta · Sky Combat Ace</span>
            </div>
            <h2 className="tile-title">HALO</h2>
            <p className="tile-desc"><strong>One flight-telemetry engine. Three products.</strong> HALO decodes a flight once and feeds the finished film, the safety record and the replay from the same source of truth — wire up once, no extra hardware, no extra work for the crew.</p>
            <div className="lanes">
              <div className="lane">
                <span className="lane-kicker">AI Multicam Editor</span>
                <span className="lane-name">ePOV</span>
                <span className="lane-desc">Multicam capture and telemetry in; one frame-synced flight film out.</span>
              </div>
              <div className="lane">
                <span className="lane-kicker">Flight Safety</span>
                <span className="lane-name">Loop</span>
                <span className="lane-desc">Every flight scored green, yellow or red against the Chief Pilot&apos;s envelope.</span>
              </div>
              <div className="lane">
                <span className="lane-kicker">3D Replay</span>
                <span className="lane-name">3D</span>
                <span className="lane-desc">The aircraft flown back through real terrain from its own telemetry.</span>
              </div>
            </div>
            <div className="actions">
              <a href="/contact.html?project=HALO&mode=nda" className="btn btn-primary">Request NDA</a>
              <a href="https://www.extremepov.ai" target="_blank" rel="noopener noreferrer" className="btn">extremepov.ai</a>
              <a href="/contact.html?project=HALO&mode=contact" className="btn">Contact</a>
            </div>
          </article>

          {/* SPLINTR — live product */}
          <article id="splintr" className="tile t2 span4 tall" data-reveal data-reveal-delay="1">
            <div className="eyebrow">
              <span className="tag">AI + YouTube</span>
              <span className="tag tag-live">Live</span>
            </div>
            <img src="/splintr-logo.png" alt="SPLINTR" className="splintr-mark" />
            <h2 className="tile-title">SPLINTR</h2>
            <p className="tile-desc">Intelligent AI video curation for YouTube. Give Archer any topic and it builds the perfect playlist — any angle, any depth, any mission.</p>
            <div className="actions">
              <a href="https://asksplintr.com" target="_blank" rel="noopener noreferrer" className="btn btn-primary">asksplintr.com</a>
              <a href="/contact.html?project=SPLINTR&mode=nda" className="btn">Request NDA</a>
            </div>
          </article>

          {/* OneUforia Arthaus */}
          <article id="oneuforia" className="tile t3 span6" data-reveal>
            <div className="eyebrow"><span className="tag">Digital Art Gallery</span></div>
            <h2 className="tile-title">OneUforia Arthaus</h2>
            <p className="tile-desc">Metaphysical surrealism by Lin &ldquo;Wildcard&rdquo; Fisher, shown whole and uncropped. No AI made any of this.</p>
            <div className="tile-art" data-lightbox="/oneuforia.jpg" data-lightbox-alt="Remember The Future by Wildcard" role="button" tabIndex={0} aria-label="View Remember The Future fullscreen">
              <img src="/oneuforia.jpg" alt="Remember The Future by Wildcard" />
            </div>
            <div className="actions">
              <a href="https://portal.oneuforia.com" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Enter the gallery</a>
              <a href="/contact.html?project=OneUforia+Arthaus&mode=contact" className="btn">Contact</a>
            </div>
          </article>

          {/* HiVibe Temple */}
          <article id="hivibe" className="tile t1 span3" data-reveal data-reveal-delay="1">
            <div className="eyebrow"><span className="tag">Wellness Tech</span></div>
            <h2 className="tile-title">HiVibe Temple</h2>
            <p className="tile-desc">Immersive light, sound and full-body vibration on a modular Infinity MagTile floor — fixed studio or mobile road case, same vibe anywhere.</p>
            <div className="actions">
              <a href="/contact.html?project=HiVibe+Temple&mode=nda" className="btn">Request NDA</a>
              <a href="/contact.html?project=HiVibe+Temple&mode=contact" className="btn">Contact</a>
            </div>
          </article>

          {/* TireSledz — teaser, under NDA */}
          <article id="tiresledz" className="tile ty span3" data-reveal data-reveal-delay="2">
            <div className="eyebrow"><span className="tag tag-nda">Under NDA</span></div>
            <h2 className="tile-title">TireSledz</h2>
            <p className="tile-desc">Off-road vehicle recovery skids for professional tow operators.</p>
            <div className="actions">
              <a href="/contact.html?project=TireSledz&mode=nda" className="btn btn-yellow">Request NDA</a>
            </div>
          </article>

          {/* Smaller projects */}
          <article id="nlc" className="tile t2 span4" data-reveal>
            <div className="tile-img" data-lightbox="/nlc.png" data-lightbox-alt="No Limit Chess" role="button" tabIndex={0} aria-label="View No Limit Chess image fullscreen">
              <img src="/nlc.png" alt="No Limit Chess" />
            </div>
            <div className="eyebrow"><span className="tag">Strategy Gaming</span></div>
            <h2 className="tile-title">No Limit Chess</h2>
            <p className="tile-desc">Where strategy meets chaos. A bold reimagining of the world&apos;s oldest game — built for the next generation of players.</p>
            <div className="actions">
              <a href="/contact.html?project=No+Limit+Chess&mode=nda" className="btn">Request NDA</a>
              <a href="/contact.html?project=No+Limit+Chess&mode=contact" className="btn">Contact</a>
            </div>
          </article>

          <article id="akasha" className="tile t3 span4" data-reveal data-reveal-delay="1">
            <div className="tile-img" data-lightbox="/akasha.jpg" data-lightbox-alt="Akasha Ai" role="button" tabIndex={0} aria-label="View Akasha Ai image fullscreen">
              <img src="/akasha.jpg" alt="Akasha Ai" />
            </div>
            <div className="eyebrow"><span className="tag">AI + Gaming</span></div>
            <h2 className="tile-title">Akasha Ai</h2>
            <p className="tile-desc">An AI game master that builds living legends. Infinite worlds, infinite stories — every session unique, every player the hero.</p>
            <div className="actions">
              <a href="/contact.html?project=Akasha+Ai&mode=nda" className="btn">Request NDA</a>
              <a href="/contact.html?project=Akasha+Ai&mode=contact" className="btn">Contact</a>
            </div>
          </article>

          <article id="oneto1" className="tile t1 span4" data-reveal data-reveal-delay="2">
            <div className="tile-img" data-lightbox="/oto.png" data-lightbox-alt="1 TO 1" role="button" tabIndex={0} aria-label="View 1 TO 1 image fullscreen">
              <img src="/oto.png" alt="1 TO 1" />
            </div>
            <div className="eyebrow"><span className="tag">FinTech</span></div>
            <h2 className="tile-title">1 TO 1</h2>
            <p className="tile-desc">Peer-to-peer bet matching without the house. Transparent, fair, and direct — the way it should have always been.</p>
            <div className="actions">
              <a href="/contact.html?project=1+TO+1&mode=nda" className="btn">Request NDA</a>
              <a href="/contact.html?project=1+TO+1&mode=contact" className="btn">Contact</a>
            </div>
          </article>
        </section>

        {/* ABOUT + CONTACT */}
        <section className="band">
          <div id="about" className="tile t3" data-reveal>
            <p className="band-label">About</p>
            <h2 className="band-title">Built Different</h2>
            <p className="tile-desc">Heuristica Labs is an independent venture studio. We partner with creatives and financial players to bring ideas into functional reality — every project built in-house, with obsessive attention to craft.</p>
            <p className="tile-desc">We process ideas into practical shortcuts to discovery and entertainment: finding answers by doing, not theorizing. The best products come from teams who are ALL IN.</p>
          </div>
          <div id="contact" className="tile t1" data-reveal data-reveal-delay="1">
            <p className="band-label">Get in Touch</p>
            <h2 className="band-title">Let&apos;s Build Something</h2>
            <p className="tile-desc">Have a bold idea, or interested in one of our projects? Let&apos;s connect.</p>
            <div className="actions">
              <a href="/contact.html" className="btn btn-primary">Send Us a Message</a>
              <a href="mailto:hello@heuristicalabs.com" className="btn">hello@heuristicalabs.com</a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <Link href="/" className="footer-logo">HEURISTICA</Link>
          <span className="footer-copy">&copy; 2026 Heuristica Labs. All rights reserved.</span>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#projects">Projects</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </footer>

      {/* LIGHTBOX */}
      <div id="lightbox" className="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Image viewer">
        <button className="lightbox-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <img id="lightbox-img" src="" alt="" className="lightbox-img" />
      </div>

      {/* Effects */}
      <MainSiteEffects />
    </>
  )
}
