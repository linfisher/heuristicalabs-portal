import Link from "next/link"
import type { Metadata } from "next"
import MainSiteEffects from "@/components/MainSiteEffects"
import "./main-site.css"

export const metadata: Metadata = {
  title: "Heuristica Labs — Venture Studio",
  description: "Heuristica Labs is an independent venture studio building bold, original technology companies from the ground up.",
  robots: "index, follow",
}

// Numbered project index under the hero, in page order.
const INDEX = [
  { id: "halo", name: "HALO" },
  { id: "splintr", name: "SPLINTR" },
  { id: "oneuforia", name: "OneUforia Arthaus" },
  { id: "hivibe", name: "HiVibe Temple" },
  { id: "tiresledz", name: "TireSledz" },
  { id: "nlc", name: "No Limit Chess" },
  { id: "akasha", name: "Akasha Ai" },
  { id: "oneto1", name: "1 TO 1" },
]

export default function HomePage() {
  return (
    <>
      {/* NAV */}
      <nav id="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">HEURISTICA</Link>
          <ul className="nav-links">
            <li><a href="#projects">Projects</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link href="/portal" className="nav-portal">Client Portal</Link></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="hero">
        <div className="hero-inner" data-reveal>
          <Link href="/"><img src="/logo.png" alt="Heuristica" className="hero-logo" /></Link>
          <h1>Venture Studio.<br /><em>Bold Ideas.</em> Real Products.</h1>
          <p className="hero-sub">We build Ai driven solutions that are unapologetically original, obsessively crafted, and engineered to create&nbsp;value.</p>
          <div className="hero-stats">
            <div><span className="stat-number" data-count="8">8</span><span className="stat-label">Active Projects</span></div>
            <div><span className="stat-number" data-count="100%">100%</span><span className="stat-label">Independent</span></div>
            <div><span className="stat-number">1000%</span><span className="stat-label">All In</span></div>
          </div>
        </div>
      </section>

      {/* PROJECT INDEX */}
      <nav className="index" aria-label="Projects">
        <div className="index-inner">
          {INDEX.map((p, i) => (
            <a key={p.id} href={`#${p.id}`}>
              <small>{String(i + 1).padStart(2, "0")}</small>
              {p.name}
            </a>
          ))}
        </div>
      </nav>

      <main className="wrap">
        <div id="projects" className="section-head" data-reveal>
          <p className="label">What We&apos;re Building</p>
          <h2>8 Active Projects</h2>
        </div>

        {/* HALO — lead platform */}
        <article id="halo" className="panel t1" data-reveal>
          <div className="panel-body">
            <div className="tags">
              <span className="tag">Aviation SaaS</span>
              <span className="tag tag-beta">Beta</span>
            </div>
            <h3>HALO</h3>
            <p className="lead"><strong>One flight-telemetry engine. Three products.</strong> HALO decodes a flight once and feeds the finished film, the safety record and the replay from the same source of truth. In Beta today with Sky Combat Ace.</p>
            <div className="why"><b>Why customers value it</b>Wire up once and get three products, with no extra hardware and no extra work for the crew.</div>
            <div className="links">
              <a href="/contact.html?project=HALO&mode=nda">Request NDA <span aria-hidden="true">→</span></a>
              <a href="/contact.html?project=HALO&mode=contact">Contact <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <div className="panel-media">
            <div className="plate">
              <span className="plate-kicker">One Flight-Telemetry Engine</span>
              <span className="plate-brand">HALO</span>
              <span className="plate-sub">Extreme Aviation SaaS Platform</span>
              <img src="/halo-rocker.png" alt="" aria-hidden="true" className="plate-rocker" />
            </div>
          </div>
        </article>
        <div className="lanes" data-reveal>
          <div className="lane">
            <span className="lane-kicker">AI Multicam Editor</span>
            <h4>ePOV</h4>
            <p>Multicam capture and telemetry go in; one cinematic, frame-synced flight film comes out.</p>
            <a href="https://www.extremepov.ai" target="_blank" rel="noopener noreferrer">extremepov.ai <span aria-hidden="true">→</span></a>
          </div>
          <div className="lane">
            <span className="lane-kicker">Flight Safety</span>
            <h4>Loop</h4>
            <p>Every flight scored against the Chief Pilot&apos;s envelope — green, yellow, red — with reports in minutes.</p>
          </div>
          <div className="lane">
            <span className="lane-kicker">3D Replay</span>
            <h4>3D</h4>
            <p>The aircraft flown back through real terrain from its own telemetry, with cinematic MP4 export.</p>
          </div>
        </div>

        {/* SPLINTR — live product */}
        <article id="splintr" className="panel panel-rev t2" data-reveal>
          <div className="panel-media">
            <img src="/splintr-logo.png" alt="SPLINTR" className="splintr-logo" />
          </div>
          <div className="panel-body">
            <div className="tags">
              <span className="tag">AI + YouTube</span>
              <span className="tag tag-live">Live</span>
            </div>
            <h3>SPLINTR</h3>
            <p className="lead">Intelligent AI video curation for YouTube. Give Archer any topic and it builds you the perfect playlist — from any angle, any depth, any mission.</p>
            <a href="https://asksplintr.com" target="_blank" rel="noopener noreferrer" className="cta">Visit asksplintr.com <span aria-hidden="true">→</span></a>
            <div className="links">
              <a href="/contact.html?project=SPLINTR&mode=nda">Request NDA <span aria-hidden="true">→</span></a>
              <a href="/contact.html?project=SPLINTR&mode=contact">Contact <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </article>

        {/* OneUforia Arthaus */}
        <article id="oneuforia" className="panel t3" data-reveal>
          <div className="panel-body">
            <div className="tags"><span className="tag">Digital Art Gallery</span></div>
            <h3>OneUforia Arthaus</h3>
            <p className="lead"><strong>Experience the Uforia of Metaphysical Surrealism.</strong> A self-hosted arthaus for the organically created work of Lin &ldquo;Wildcard&rdquo; Fisher — every piece shown whole and uncropped.</p>
            <div className="why"><b>Why visitors value it</b>No AI made any of this. Each piece takes weeks, and the framing is part of the art.</div>
            <a href="https://portal.oneuforia.com" target="_blank" rel="noopener noreferrer" className="cta">Enter the gallery <span aria-hidden="true">→</span></a>
          </div>
          <div className="panel-media">
            <div className="art" data-lightbox="/oneuforia.jpg" data-lightbox-alt="Remember The Future by Wildcard" role="button" tabIndex={0} aria-label="View Remember The Future fullscreen">
              <img src="/oneuforia.jpg" alt="Remember The Future by Wildcard" />
            </div>
          </div>
        </article>

        {/* HiVibe Temple */}
        <article id="hivibe" className="panel panel-rev t1" data-reveal>
          <div className="panel-media">
            <div className="plate">
              <span className="plate-kicker">Tech-Assisted Wellness</span>
              <span className="plate-brand plate-brand-stack">HIVIBE<br />TEMPLE</span>
              <span className="plate-sub">Modular Frequency Venue</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="tags"><span className="tag">Wellness Tech</span></div>
            <h3>HiVibe Temple</h3>
            <p className="lead">Immersive light, sound, and full-body vibration. A modular Infinity MagTile floor snaps into any footprint — fixed studio or mobile road case, same vibe anywhere.</p>
            <div className="links">
              <a href="/contact.html?project=HiVibe+Temple&mode=nda">Request NDA <span aria-hidden="true">→</span></a>
              <a href="/contact.html?project=HiVibe+Temple&mode=contact">Contact <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </article>

        {/* TireSledz — teaser, under NDA */}
        <article id="tiresledz" className="panel panel-short ty" data-reveal>
          <div className="panel-body">
            <div className="tags">
              <span className="tag">Recovery Equipment</span>
              <span className="tag tag-nda">Under NDA</span>
            </div>
            <h3>TireSledz</h3>
            <p className="lead">Off-road vehicle recovery skids for professional tow operators.</p>
            <a href="/contact.html?project=TireSledz&mode=nda" className="cta cta-yellow">Request NDA <span aria-hidden="true">→</span></a>
          </div>
          <div className="panel-media">
            <div className="plate plate-short">
              <span className="plate-kicker">TS-200 · TS-200T</span>
              <span className="plate-brand plate-brand-small">TIRESLEDZ</span>
              <span className="plate-sub">SledTrax</span>
            </div>
          </div>
        </article>

        {/* Smaller projects */}
        <div className="cards">
          <article id="nlc" className="card" data-reveal>
            <div className="card-media" data-lightbox="/nlc.png" data-lightbox-alt="No Limit Chess" role="button" tabIndex={0} aria-label="View No Limit Chess image fullscreen">
              <img src="/nlc.png" alt="No Limit Chess" />
            </div>
            <div className="card-body">
              <span className="label">Strategy Gaming</span>
              <h4>No Limit Chess</h4>
              <p>Where strategy meets chaos. A bold reimagining of the world&apos;s oldest game — built for the next generation of players.</p>
              <div className="links">
                <a href="/contact.html?project=No+Limit+Chess&mode=nda">Request NDA <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=No+Limit+Chess&mode=contact">Contact <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>
          <article id="akasha" className="card" data-reveal data-reveal-delay="1">
            <div className="card-media" data-lightbox="/akasha.jpg" data-lightbox-alt="Akasha Ai" role="button" tabIndex={0} aria-label="View Akasha Ai image fullscreen">
              <img src="/akasha.jpg" alt="Akasha Ai" />
            </div>
            <div className="card-body">
              <span className="label">AI + Gaming</span>
              <h4>Akasha Ai</h4>
              <p>An AI game master that builds living legends. Infinite worlds, infinite stories — every session unique, every player the hero.</p>
              <div className="links">
                <a href="/contact.html?project=Akasha+Ai&mode=nda">Request NDA <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=Akasha+Ai&mode=contact">Contact <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>
          <article id="oneto1" className="card" data-reveal data-reveal-delay="2">
            <div className="card-media" data-lightbox="/oto.png" data-lightbox-alt="1 TO 1" role="button" tabIndex={0} aria-label="View 1 TO 1 image fullscreen">
              <img src="/oto.png" alt="1 TO 1" />
            </div>
            <div className="card-body">
              <span className="label">FinTech</span>
              <h4>1 TO 1</h4>
              <p>Peer-to-peer bet matching without the house. Transparent, fair, and direct — the way it should have always been.</p>
              <div className="links">
                <a href="/contact.html?project=1+TO+1&mode=nda">Request NDA <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=1+TO+1&mode=contact">Contact <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>
        </div>

        {/* ABOUT */}
        <section id="about" className="about">
          <div data-reveal>
            <p className="label">About</p>
            <h2>Built<br />Different</h2>
          </div>
          <div data-reveal data-reveal-delay="1">
            <p>Heuristica Labs is an independent venture studio. We seek to partner with creatives and financial players to bring ideas into functional reality. Every project is built in-house, with the same obsessive attention to craft that defines the best products in the world.</p>
            <p>At Heuristica, we process ideas into practical shortcuts to discovery and entertainment — a way of finding answers by doing, not theorizing. That&apos;s exactly how we build.</p>
            <p>We are relentless in pursuit — the best products come from teams who are ALL IN!</p>
          </div>
        </section>
      </main>

      {/* CONTACT */}
      <section id="contact" className="contact">
        <div data-reveal>
          <p className="label">Get in Touch</p>
          <h2>Let&apos;s Build Something</h2>
          <p className="contact-sub">Have a bold idea, or interested in one of our projects? Let&apos;s connect.</p>
          <a href="/contact.html" className="cta">Send Us a Message <span aria-hidden="true">→</span></a>
          <p className="contact-mail">or email <a href="mailto:hello@heuristicalabs.com">hello@heuristicalabs.com</a></p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <Link href="/" className="nav-logo">HEURISTICA</Link>
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
