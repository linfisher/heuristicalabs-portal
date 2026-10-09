import Link from "next/link"
import type { Metadata } from "next"
import "../main-site.css"

export const metadata: Metadata = {
  title: "Privacy Policy — OneUforia Arthaus for Apple TV",
  description: "Privacy policy for the OneUforia Arthaus Apple TV app. The app collects no information: no account, no analytics, no tracking.",
  robots: "index, follow",
}

// Apple requires a reachable privacy policy URL for the tvOS app submission.
export default function PrivacyPage() {
  return (
    <>
      <nav id="nav" className="scrolled">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">HEURISTICA</Link>
          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/support">Support</Link></li>
            <li><a href="/contact.html" className="nav-portal">Contact</a></li>
          </ul>
        </div>
      </nav>

      <main className="legal">
        <p className="label">Privacy</p>
        <h1>OneUforia Arthaus for Apple TV — Privacy Policy</h1>
        <p className="legal-date">Effective 4 October 2026</p>

        <h2>The short version</h2>
        <p>The app does not collect any information about you. There is no account, no sign-in, no advertising, no analytics and no tracking.</p>

        <h2>What the app stores on your Apple TV</h2>
        <p>The app remembers three settings on your Apple TV so it can pick up where you left off:</p>
        <ul>
          <li>how long the slideshow holds each work,</li>
          <li>how far the skip buttons jump in a mix,</li>
          <li>where you stopped in each music mix.</li>
        </ul>
        <p>These stay on your Apple TV. They are never sent to us or to anyone else. Deleting the app deletes them.</p>

        <h2>What the app fetches</h2>
        <p>To show you the gallery, the app downloads images, text, music and films from the artist&apos;s gallery server at portal.oneuforia.com. For a few films hosted on YouTube, it downloads the poster image from YouTube&apos;s image server (i.ytimg.com). The app does not play anything from YouTube and does not sign you in to YouTube. A few album pictures in the Art Gallery are downloaded from the OneUforia store&apos;s image server (oneuforia.com); the app does not open the store or sell anything.</p>

        <h2>What the gallery server sees</h2>
        <p>When your Apple TV asks for a picture or a song, the server receives the request and, as with any website, your network&apos;s IP address. The server keeps standard web access logs for up to 14 days to keep the service running and secure, and does not use them to identify, profile or track anyone. YouTube&apos;s handling of its image requests is covered by Google&apos;s privacy policy, and the store image server&apos;s by Shopify&apos;s.</p>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell or share any information.</li>
          <li>We do not track you across apps or websites.</li>
          <li>We do not knowingly collect information from anyone, including children.</li>
        </ul>

        <h2>Contact</h2>
        <p>Questions about this policy: <a href="mailto:hello@heuristicalabs.com">hello@heuristicalabs.com</a>.</p>

        <h2>Changes</h2>
        <p>If this policy changes, the new version will be posted on this page with a new effective date.</p>

        <p className="legal-back"><Link href="/support">Support page</Link> · <Link href="/">Heuristica Labs</Link></p>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <Link href="/" className="nav-logo">HEURISTICA</Link>
          <span className="footer-copy">&copy; 2026 Heuristica Labs. All rights reserved.</span>
          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/">Home</Link>
            <Link href="/support">Support</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
