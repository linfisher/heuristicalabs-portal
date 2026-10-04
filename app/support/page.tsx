import Link from "next/link"
import type { Metadata } from "next"
import "../main-site.css"

export const metadata: Metadata = {
  title: "Support — OneUforia Arthaus for Apple TV",
  description: "Support for the OneUforia Arthaus Apple TV app: how to use it, common questions, and how to get in touch.",
  robots: "index, follow",
}

// Apple requires a reachable support URL with a real way to make contact.
export default function SupportPage() {
  return (
    <>
      <nav id="nav" className="scrolled">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">HEURISTICA</Link>
          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><a href="/contact.html" className="nav-portal">Contact</a></li>
          </ul>
        </div>
      </nav>

      <main className="legal">
        <p className="label">Support</p>
        <h1>OneUforia Arthaus for Apple TV — Support</h1>
        <p className="legal-date">The metaphysical surrealist art, music and films of Lin Fisher, on Apple TV.</p>

        <h2>Getting in touch</h2>
        <p>Email <a href="mailto:hello@heuristicalabs.com">hello@heuristicalabs.com</a> or use the <a href="/contact.html">contact form</a>. We read every message.</p>

        <h2>Using the app</h2>
        <p>Press Select on the opening screen to reach the hub. From there:</p>
        <ul>
          <li><strong>Art Gallery</strong>: choose an album, then a work. Swipe left or right for the previous or next work, swipe down to read about it, and hold Select to zoom.</li>
          <li><strong>Slideshow</strong>: on any work, press Play/Pause to start or stop it. Swipe up to change how long each work stays on screen.</li>
          <li><strong>Music</strong>: choose a mix to play it. Play/Pause works from any screen. Hold Play/Pause to bring up the music controls.</li>
          <li><strong>Menu</strong> goes back one step.</li>
          <li><strong>Help</strong> in the app shows all of this on screen.</li>
        </ul>

        <h2>Common questions</h2>
        <p><strong>Nothing loads.</strong> The app needs an internet connection. Check that your Apple TV is online (Settings, Network), then open the app again.</p>
        <p><strong>An album says LOCKED.</strong> Some albums are private. They cannot be opened from the app.</p>
        <p><strong>A film shows only its poster.</strong> Films hosted on YouTube are listed for reference and are not played inside the app.</p>
        <p><strong>Do I need an account?</strong> No. There is no account and nothing to sign in to.</p>

        <h2>Requirements</h2>
        <p>Apple TV HD or Apple TV 4K, with tvOS 17 or later.</p>

        <p className="legal-back"><Link href="/privacy">Privacy policy</Link> · <Link href="/">Heuristica Labs</Link></p>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <Link href="/" className="nav-logo">HEURISTICA</Link>
          <span className="footer-copy">&copy; 2026 Heuristica Labs. All rights reserved.</span>
          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/">Home</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
