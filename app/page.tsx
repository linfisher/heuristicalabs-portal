import Link from "next/link"
import type { Metadata } from "next"
import MainSiteEffects from "@/components/MainSiteEffects"
import "./main-site.css"

export const metadata: Metadata = {
  title: "Heuristica Labs — Venture Studio",
  description: "Heuristica Labs is an independent venture studio building bold, original technology companies from the ground up.",
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
            <li><a href="#halo">Projects</a></li>
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
        <div className="manifesto-split" data-reveal>
          <div className="manifesto-panel manifesto-dark">
            <p className="manifesto-statement">HEURISTIC</p>
            <p className="manifesto-eyebrow">/ hjʊˈrɪstɪk / — adjective</p>
            <p className="manifesto-definition">Enabling a person to discover or learn something for themselves.</p>
          </div>
          <div className="manifesto-panel manifesto-heuristica">
            <p className="manifesto-statement">HEURISTICA</p>
            <p className="manifesto-eyebrow">/ hjʊˈrɪstɪkə / — verb</p>
            <p className="manifesto-definition">Activating everyone to discover or learn something for themselves by having <strong>FUN</strong>.</p>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects">
        <div className="section-header" data-reveal>
          <p className="section-label">What We&apos;re Building</p>
          <h2>8 Active Projects</h2>
        </div>

        <nav className="project-chips" aria-label="Jump to a project" data-reveal>
          <a href="#halo" className="project-chip">
            <span className="chip-name">HALO</span>
            <span className="chip-note">Extreme aviation SaaS</span>
          </a>
          <a href="#splintr" className="project-chip">
            <span className="chip-name">SPLINTR</span>
            <span className="chip-note">AI video curation for YouTube</span>
          </a>
          <a href="#extremepov" className="project-chip">
            <span className="chip-name">extremePOV.ai</span>
            <span className="chip-note">AI multicam for extreme sports</span>
          </a>
          <a href="#oneuforia" className="project-chip">
            <span className="chip-name">OneUforia Arthaus</span>
            <span className="chip-note">Metaphysical surrealist gallery</span>
          </a>
          <a href="#hivibe" className="project-chip">
            <span className="chip-name">HiVibe Temple</span>
            <span className="chip-note">Immersive frequency venue</span>
          </a>
          <a href="#nlc" className="project-chip">
            <span className="chip-name">No Limit Chess</span>
            <span className="chip-note">Strategy meets chaos</span>
          </a>
          <a href="#akasha" className="project-chip">
            <span className="chip-name">Akasha Ai</span>
            <span className="chip-note">AI game master</span>
          </a>
          <a href="#oneto1" className="project-chip">
            <span className="chip-name">1 TO 1</span>
            <span className="chip-note">Peer-to-peer bet matching</span>
          </a>
        </nav>

        {/* HALO — FEATURED SaaS PLATFORM */}
        <div id="halo" className="halo-inner">
          <div className="halo-hero" data-reveal>
            <div className="halo-hero-media">
              <div className="halo-plate">
                <span className="halo-plate-kicker">One Flight-Telemetry Engine</span>
                <span className="halo-plate-brand">HALO</span>
                <span className="halo-plate-sub">Extreme Aviation SaaS Platform</span>
                <img src="/halo-rocker.png" alt="" aria-hidden="true" className="halo-rocker" />
              </div>
            </div>
            <div className="halo-hero-content">
              <div className="splintr-tags">
                <span className="project-tag">Aviation SaaS</span>
                <span className="project-badge-live project-badge-beta">Beta</span>
              </div>
              <h2 className="halo-title">HALO</h2>
              <p className="halo-desc"><strong>One flight-telemetry engine. Three web-service products. One platform.</strong> HALO decodes a single stream of flight data <strong>once</strong>, then feeds all three lanes from the <strong>same source of truth</strong> — the finished film, the safety record, and the replay. <strong>In Beta today with Sky Combat Ace.</strong></p>
              <div className="why-block"><span className="why-label">Why customers value it</span><p className="why-text">One operator, three expensive problems: editors losing most of a week to hand-cutting, <strong>flight-safety exposure nobody was measuring</strong>, and no way to show a customer the flight they just took. All three fall out of the <strong>same telemetry stream</strong> — so you wire up once and get three products, with no extra hardware and no extra work for the crew.</p></div>
              <div className="project-links" style={{ marginTop: "28px" }}>
                <a href="/contact.html?project=HALO&mode=nda" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=HALO&mode=contact" className="project-link">Contact <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </div>

          <div className="feature-list feature-list--halo" data-reveal data-reveal-delay="1">
            <article className="feature-item">
              <div className="feature-head">
                <span className="feature-tag">AI Multicam Editor</span>
                <h3 className="feature-title">ePOV</h3>
              </div>
              <p className="feature-desc">Multi-cam capture and the telemetry feed go in; <strong>one cinematic, frame-synced flight film comes out.</strong> Pilot voice, aircraft telemetry, and computer vision <strong>each vote on what matters</strong>, so the cut lands on the moments that actually happened. The operator marks a flight from a single web page — real frames from all three cameras served behind it — and the machine cuts from those marks. The editor receives <strong>three synced camera lanes</strong> with the action cut in and the dead stretches <strong>hidden between, never deleted.</strong></p>
              <div className="why-block"><span className="why-label">Why customers value it</span><p className="why-text">Hand-cutting a batch of flights used to cost <strong>two editors most of a week</strong>. That work now runs unattended, so the customer’s film stops being an editorial bottleneck and starts shipping on its own.</p></div>
            </article>
            <article className="feature-item">
              <div className="feature-head">
                <span className="feature-tag">Flight Safety</span>
                <h3 className="feature-title">Loop</h3>
              </div>
              <p className="feature-desc">Every flight is scored against <strong>a discipline envelope the Chief Pilot sets</strong> — the limit the operation chooses to fly to, not the airframe&apos;s structural one. Load factor is <strong>banded green, yellow, and red</strong>, with each out-of-envelope moment <strong>timestamped</strong> against the G-trace and the flight path. Pilots get their report automatically within minutes of the telemetry landing; <strong>the Chief Pilot is pulled in only when a flight goes red.</strong> Fleet and per-pilot dashboards, plus a monthly summary that sends itself, turn the whole record into training and risk evidence.</p>
              <div className="why-block"><span className="why-label">Why customers value it</span><p className="why-text">Exposure that nobody was measuring becomes a <strong>written, timestamped record</strong>. The Chief Pilot coaches from evidence instead of impression, and the operation can <strong>prove how it flies</strong> rather than assert it.</p></div>
            </article>
            <article className="feature-item">
              <div className="feature-head">
                <span className="feature-tag">3D Replay</span>
                <h3 className="feature-title">3D</h3>
              </div>
              <p className="feature-desc">The aircraft is <strong>flown back through real USGS terrain from its own telemetry</strong> — same track, same attitude, same G. A full recording studio with a <strong>cinematic auto-director and MP4 export</strong> turns any flight into a replay worth showing. Altitude was settled at the source with the flight recorder&apos;s manufacturer, and every flight republished against the corrected figures. The flight list flags only what matters: <strong>a safety breach shows red, a clean flight shows nothing.</strong></p>
              <div className="why-block"><span className="why-label">Why customers value it</span><p className="why-text">A customer walks off an aerobatic flight with <strong>no way to show anyone what just happened</strong>. The replay makes the flight shareable — and gives the crew a debrief tool that a G-trace on its own can never be.</p></div>
            </article>
          </div>
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
            <p className="splintr-desc">Intelligent AI video curation for YouTube. Archer doesn&apos;t just find videos — <strong>it organizes them with intention.</strong></p>
            <p className="splintr-desc">That intent is a <strong>Mission</strong>: what you want from a subject, not just what you typed. <strong>Bi-POV</strong> builds the strongest case on both sides. <strong>Learn About</strong> sequences real educators from beginner to expert. <strong>News</strong> holds out for journalism-grade reporting over creator takes. The mission decides what qualifies and how it&apos;s ordered — so <strong>the same query returns a completely different playlist</strong> depending on the job you gave it.</p>
            <p className="splintr-desc">What comes back is a <strong>Playlist you actually own</strong>. Rename it, reorder it, cut what doesn&apos;t belong — then one link sends the whole set to someone, with <strong>no account and no app at their end</strong>. The link keeps updating as you edit, and one click publishes it to your real YouTube with Archer writing the title, description and tags. <strong>YouTube, hyper-extended.</strong></p>
            <a href="https://asksplintr.com" target="_blank" rel="noopener noreferrer" className="splintr-cta">Visit asksplintr.com <span aria-hidden="true">→</span></a>
            <div className="why-block"><span className="why-label">Why customers value it</span><p className="why-text">Finding the right video for a specific purpose — both sides of a debate, a skill from scratch, a story you&apos;re tracking — takes <strong>twenty minutes of scrolling instead of twenty seconds of watching</strong>. The algorithm shows you what YouTube wants you to watch, not what you came for. SPLINTR does in seconds what would take you an hour by hand.</p></div>
            <div className="project-links" style={{ marginTop: "28px" }}>
              <a href="/contact.html?project=SPLINTR&mode=nda" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
              <a href="/contact.html?project=SPLINTR&mode=contact" className="project-link">Contact <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>

        {/* MID-TIER FEATURE: extremePOV.ai */}
        <div id="extremepov" className="mid-feature" data-reveal>
          <div className="mid-feature-media">
            <div className="mid-feature-placeholder mid-feature-mcam">
              <span className="mid-feature-kicker">Now in Private Beta</span>
              <span className="mid-feature-brand">SEND IT.<br />WE CUT IT.</span>
              <span className="mid-feature-sub">Ai Multicam Editing for Extreme Sports Creators</span>
            </div>
          </div>
          <div className="mid-feature-content">
            <span className="project-tag">MultiCam Action Sports · Ai Edit &amp; Delivery</span>
            <h3 className="mid-feature-title">extremePOV.ai</h3>
            <p className="mid-feature-desc">Send it. We cut it. AI multicam editing built for extreme sports creators — auto-sync up to 18 cameras, peak moments picked via G-force and telemetry, customer-ready 4K reels in minutes. Cut 65–70% of edit costs. Now in private beta.</p>
            <div className="project-links">
              <a href="https://www.extremepov.ai" target="_blank" rel="noopener noreferrer" className="project-link">Visit extremepov.ai <span aria-hidden="true">→</span></a>
              <a href="/contact.html?project=extremePOV.ai&mode=nda" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
              <a href="/contact.html?project=extremePOV.ai&mode=contact" className="project-link">Contact <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>

        {/* MID-TIER FEATURE: OneUforia Arthaus */}
        <div id="oneuforia" className="mid-feature" data-reveal>
          <div className="mid-feature-media">
            <div className="mid-feature-placeholder mid-feature-oneuforia">
              <img src="/oneuforia.jpg" alt="Remember The Future by Wildcard" className="oneuforia-art" />
            </div>
          </div>
          <div className="mid-feature-content">
            <span className="project-tag">Digital Art Gallery</span>
            <h3 className="mid-feature-title">OneUforia Arthaus</h3>
            <p className="mid-feature-desc"><strong>Experience the Uforia of Metaphysical Surrealism.</strong> A self-hosted arthaus for the organically created digital work of Lin &ldquo;Wildcard&rdquo; Fisher. Every piece is shown <strong>whole and uncropped</strong> at its true aspect ratio, and every room can be walked five different ways — a justified wall, a filmstrip, one work per screen, a numbered journal, or a theater that advances on its own. Albums open to everyone, go out by private link, or sit behind a passcode. Alongside the stills sits <strong>&ldquo;Becoming&rdquo;</strong>, a video piece featuring Alan Watts on consciousness and the solidity of existence.</p>
            <div className="why-block"><span className="why-label">Why visitors value it</span><p className="why-text"><strong>No AI made any of this.</strong> Each piece is organically created and takes weeks to finish. In a feed drowning in generated images, the arthaus is a room where the work is <strong>unmistakably human</strong> — and where a crop is never allowed to decide what you see, because the framing is part of the artistry.</p></div>
            <a href="https://portal.oneuforia.com" target="_blank" rel="noopener noreferrer" className="splintr-cta oneuforia-cta">Enter the gallery <span aria-hidden="true">&rarr;</span></a>
            <div className="project-links">
              <a href="/contact.html?project=OneUforia+Arthaus&mode=nda" className="project-link">Request NDA <span aria-hidden="true">&rarr;</span></a>
              <a href="/contact.html?project=OneUforia+Arthaus&mode=contact" className="project-link">Contact <span aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
        </div>

        {/* MID-TIER FEATURE: HiVibe Temple */}
        <div id="hivibe" className="mid-feature mid-feature-reverse" data-reveal>
          <div className="mid-feature-media">
            <div className="mid-feature-placeholder mid-feature-hivibe">
              <span className="mid-feature-kicker">Tech-Assisted Wellness · Set &amp; Setting<br />Hardware &amp; Protocols</span>
              <span className="mid-feature-brand">HIVIBE<br />TEMPLE</span>
              <span className="mid-feature-sub">Modular Frequency Venue</span>
            </div>
          </div>
          <div className="mid-feature-content">
            <span className="project-tag">Wellness Tech</span>
            <h3 className="mid-feature-title">HiVibe Temple</h3>
            <p className="mid-feature-desc"><strong>Immersive light, sound, and full-body vibration.</strong> Modular Infinity MagTile floor <strong>snaps into any footprint</strong> — fixed studio or mobile road case, same vibe anywhere.</p>
            <div className="project-links">
              <a href="/contact.html?project=HiVibe+Temple&mode=nda" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
              <a href="/contact.html?project=HiVibe+Temple&mode=contact" className="project-link">Contact <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>

        <div className="projects-grid">

          <article id="nlc" className="project-card" data-reveal>
            <div className="card-media" data-lightbox="/nlc.png" data-lightbox-alt="No Limit Chess" role="button" tabIndex={0} aria-label="View No Limit Chess image fullscreen">
              <img src="/nlc.png" alt="No Limit Chess" className="card-img" />
              <div className="card-zoom-hint">View</div>
            </div>
            <div className="card-info">
              <span className="project-tag">Strategy Gaming</span>
              <h3>No Limit Chess</h3>
              <p><strong>Where strategy meets chaos.</strong> A bold reimagining of the world&apos;s oldest game — built for the next generation of players.</p>
              <div className="project-links">
                <a href="/contact.html?project=No+Limit+Chess&mode=nda" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=No+Limit+Chess&mode=contact" className="project-link">Contact <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>

          <article id="akasha" className="project-card" data-reveal data-reveal-delay="1">
            <div className="card-media" data-lightbox="/akasha.jpg" data-lightbox-alt="Akasha Ai" role="button" tabIndex={0} aria-label="View Akasha Ai image fullscreen">
              <img src="/akasha.jpg" alt="Akasha Ai" className="card-img" />
              <div className="card-zoom-hint">View</div>
            </div>
            <div className="card-info">
              <span className="project-tag">AI + Gaming</span>
              <h3>Akasha Ai</h3>
              <p><strong>An AI game master that builds living legends.</strong> Infinite worlds. Infinite stories. Every session unique, every player the hero.</p>
              <div className="project-links">
                <a href="/contact.html?project=Akasha+Ai&mode=nda" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=Akasha+Ai&mode=contact" className="project-link">Contact <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>

          <article id="oneto1" className="project-card" data-reveal data-reveal-delay="2">
            <div className="card-media" data-lightbox="/oto.png" data-lightbox-alt="1 TO 1" role="button" tabIndex={0} aria-label="View 1 TO 1 image fullscreen">
              <img src="/oto.png" alt="1 TO 1" className="card-img" />
              <div className="card-zoom-hint">View</div>
            </div>
            <div className="card-info">
              <span className="project-tag">FinTech</span>
              <h3>1 TO 1</h3>
              <p><strong>Peer-to-peer bet matching without the house.</strong> Transparent, fair, and direct — the way it should have always been.</p>
              <div className="project-links">
                <a href="/contact.html?project=1+TO+1&mode=nda" className="project-link">Request NDA <span aria-hidden="true">→</span></a>
                <a href="/contact.html?project=1+TO+1&mode=contact" className="project-link">Contact <span aria-hidden="true">→</span></a>
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
                <span className="stat-number" data-count="8">8</span>
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
            <a href="#halo">Projects</a>
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
