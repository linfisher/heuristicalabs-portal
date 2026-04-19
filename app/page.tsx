import Link from "next/link"
import type { Metadata } from "next"
import MainSiteEffects from "@/components/MainSiteEffects"
import "./main-site.css"

export const metadata: Metadata = {
  title: "Heuristica Labs — Venture Studio",
  description: "Heuristica Labs is an independent venture studio building bold, original technology companies from the ground up.",
  openGraph: {
    title: "Heuristica Labs",
    description: "Venture Studio. Bold Ideas. Real Products.",
    url: "https://heuristicalabs.com",
    type: "website",
  },
  robots: "index, follow",
}

export default function HomePage() {
  return (
    <>
      {/* NAV */}
      <nav id="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">HEURISTICA</Link>
          <ul className="nav-links">
            <li><a href="#splintr">Projects</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link href="/portal" className="nav-portal">Client Portal</Link></li>
          </ul>
          <div className="nav-spacer"></div>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <Link href="/"><img src="/logo.png" alt="Heuristica" className="hero-logo" /></Link>
          <p className="hero-tagline">Venture Studio. Bold Ideas. Real Products.</p>
          <p className="hero-sub">We build Ai driven solutions that are unapologetically original, obsessively crafted, and engineered to create&nbsp;value.</p>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="manifesto">
        <div className="manifesto-inner" data-reveal>
          <p className="manifesto-statement">HEURISTIC</p>
          <p className="manifesto-eyebrow">/ hjʊˈrɪstɪk / — adjective</p>
          <p className="manifesto-definition">Enabling a person to discover or learn<br />something for themselves.</p>
          <p className="manifesto-body">We build answers the world didn&apos;t know it needed.</p>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects">
        <div className="section-header" data-reveal>
          <p className="section-label">What We&apos;re Building</p>
          <h2>4 Investments into the Future</h2>
        </div>

        {/* SPLINTR — FEATURED LIVE PRODUCT */}
        <div id="splintr" className="splintr-inner">
          <div className="splintr-media" data-reveal>
            <div className="splintr-placeholder">
              <div className="splintr-logo-wrap">
                <img src="/splintr-logo.png" alt="SPLINTR" className="splintr-logo-img" />
                <span className="splintr-card-tagline">Intelligent AI Video Curation</span>
              </div>
            </div>
          </div>
          <div className="splintr-content" data-reveal data-reveal-delay="1">
            <div className="splintr-tags">
              <span className="project-tag">AI + YouTube</span>
              <span className="project-badge-live">Live</span>
            </div>
            <h2 className="splintr-title">SPLINTR</h2>
            <p className="splintr-desc">Intelligent AI video curation for YouTube. Give Archer any topic and it builds you the perfect playlist — from any angle, any depth, any mission.</p>
            <a href="https://asksplintr.com" target="_blank" rel="noopener noreferrer" className="splintr-cta">Visit asksplintr.com <span aria-hidden="true">→</span></a>
            <div className="project-links" style={{ marginTop: "28px" }}>
              <a href="/contact.html?project=SPLINTR&nda=true" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>

        <div className="projects-grid">

          <article className="project-card" data-reveal>
            <div className="card-media" data-lightbox="/nlc.png" data-lightbox-alt="No Limit Chess" role="button" tabIndex={0} aria-label="View No Limit Chess image fullscreen">
              <img src="/nlc.png" alt="No Limit Chess" className="card-img" />
              <div className="card-zoom-hint">View</div>
            </div>
            <div className="card-info">
              <span className="project-tag">Strategy Gaming</span>
              <h3>No Limit Chess</h3>
              <p>Where strategy meets chaos. A bold reimagining of the world&apos;s oldest game — built for the next generation of players.</p>
              <div className="project-links">
                <a href="/nlc.html" className="project-link">Introduction Deck <span aria-hidden="true">→</span></a>
                <a href="/nlc-biz.html" className="project-link">Business Deck <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=No+Limit+Chess&nda=true" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>

          <article className="project-card" data-reveal data-reveal-delay="1">
            <div className="card-media" data-lightbox="/akasha.jpg" data-lightbox-alt="Akasha Ai" role="button" tabIndex={0} aria-label="View Akasha Ai image fullscreen">
              <img src="/akasha.jpg" alt="Akasha Ai" className="card-img" />
              <div className="card-zoom-hint">View</div>
            </div>
            <div className="card-info">
              <span className="project-tag">AI + Gaming</span>
              <h3>Akasha Ai</h3>
              <p>An AI game master that builds living legends. Infinite worlds. Infinite stories. Every session unique, every player the hero.</p>
              <div className="project-links">
                <a href="/akasha.html" className="project-link">Introduction Deck <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=Akasha+Ai&nda=true" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>

          <article className="project-card" data-reveal data-reveal-delay="2">
            <div className="card-media" data-lightbox="/oto.png" data-lightbox-alt="1 TO 1" role="button" tabIndex={0} aria-label="View 1 TO 1 image fullscreen">
              <img src="/oto.png" alt="1 TO 1" className="card-img" />
              <div className="card-zoom-hint">View</div>
            </div>
            <div className="card-info">
              <span className="project-tag">FinTech</span>
              <h3>1 TO 1</h3>
              <p>Peer-to-peer bet matching without the house. Transparent, fair, and direct — the way it should have always been.</p>
              <div className="project-links">
                <a href="/contact.html?project=1 TO 1&nda=true" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>

        </div>
      </section>

      {/* ABOUT */}
      <section id="about">
        <div className="about-inner">
          <div className="about-left" data-reveal>
            <p className="section-label">About</p>
            <h2>Built<br />Different</h2>
            <div className="stat-stack">
              <div className="stat-item">
                <span className="stat-number" data-count="4">4</span>
                <span className="stat-label">Active Products</span>
              </div>
              <div className="stat-item">
                <span className="stat-number" data-count="100%">100%</span>
                <span className="stat-label">Independent</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">1000%</span>
                <span className="stat-label">All In</span>
              </div>
            </div>
          </div>
          <div className="about-right" data-reveal data-reveal-delay="1">
            <p>Heuristica Labs is an independent venture studio. We seek to partner with creatives and financial players to bring ideas into functional reality. Every project is built in-house, with the same obsessive attention to craft that defines the best products in the world.</p>
            <p>At Heuristica, we process ideas into practical shortcuts to discovery and entertainment — a way of finding answers by doing, not theorizing. That&apos;s exactly how we build.</p>
            <p>We are relentless in pursuit — the best products come from teams who are ALL IN!</p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <div className="contact-inner" data-reveal>
          <p className="section-label">Get in Touch</p>
          <h2>Let&apos;s Build<br />Something</h2>
          <p className="contact-sub">Have a bold idea? Let&apos;s talk about it.</p>
          <p className="contact-sub">Interested in one of our projects? Let&apos;s Connect!</p>

          <a href="/contact.html" className="hero-cta" style={{ marginTop: "16px" }}>Send Us a Message <span aria-hidden="true">→</span></a>
          <p style={{ marginTop: "20px", fontSize: "13px", color: "rgba(255,255,255,0.22)" }}>
            or email directly at <a href="mailto:hello@heuristicalabs.com" style={{ color: "rgba(232,20,127,0.65)", textDecoration: "none" }}>hello@heuristicalabs.com</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <Link href="/" className="footer-logo">HEURISTICA</Link>
          <span className="footer-copy">&copy; 2026 Heuristica Labs. All rights reserved.</span>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#splintr">Projects</a>
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
