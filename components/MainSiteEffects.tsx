"use client"

import { useEffect } from "react"

export default function MainSiteEffects() {
  useEffect(() => {
    // Scroll Reveal
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      revealObserver.observe(el)
    })

    // Nav Glassmorphism
    const nav = document.getElementById("nav")
    const hero = document.getElementById("hero")
    let navObserver: IntersectionObserver | null = null
    if (nav && hero) {
      navObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return
          nav.classList.toggle("scrolled", !entry.isIntersecting)
        },
        { threshold: 0.05 }
      )
      navObserver.observe(hero)
    }

    // Smooth scroll for anchor links.
    // Hand-rolled rather than scrollIntoView({behavior:"smooth"}): the native
    // duration is browser-controlled and slow over the long distances between
    // project blocks, and it ignores the fixed nav overlapping the target.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const NAV_OFFSET = 96
    const SCROLL_MS = 620
    let scrollRAF = 0

    function scrollToTarget(target: Element) {
      const startY = window.scrollY
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      const endY = Math.max(0, Math.min(maxY, startY + target.getBoundingClientRect().top - NAV_OFFSET))
      const distance = endY - startY
      if (prefersReducedMotion || Math.abs(distance) < 2) {
        window.scrollTo(0, endY)
        return
      }
      cancelAnimationFrame(scrollRAF)
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min((now - start) / SCROLL_MS, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        window.scrollTo(0, startY + distance * eased)
        if (progress < 1) scrollRAF = requestAnimationFrame(step)
      }
      scrollRAF = requestAnimationFrame(step)
    }

    const anchorHandlers: Array<{ el: Element; handler: (e: Event) => void }> = []
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      const handler = (e: Event) => {
        const href = anchor.getAttribute("href")
        if (!href || href === "#") return
        const target = document.querySelector(href)
        if (target) {
          e.preventDefault()
          scrollToTarget(target)
        }
      }
      anchor.addEventListener("click", handler)
      anchorHandlers.push({ el: anchor, handler })
    })

    // Animate stats counter on reveal
    function animateCounter(el: HTMLElement, target: number, prefix = "", suffix = "") {
      const duration = 1400
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const value = Math.round(target * eased)
        el.textContent = prefix + value + suffix
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const raw = el.dataset.count
          if (!raw) return
          const isPercent = raw.endsWith("%")
          const prefix = el.dataset.prefix || ""
          const num = parseInt(raw, 10)
          animateCounter(el, num, prefix, isPercent ? "%" : "")
          statObserver.unobserve(el)
        })
      },
      { threshold: 0.5 }
    )
    document.querySelectorAll<HTMLElement>(".stat-number[data-count]").forEach((el) => {
      statObserver.observe(el)
    })

    // Image Lightbox
    const lightbox = document.getElementById("lightbox")
    const lightboxImg = document.getElementById("lightbox-img") as HTMLImageElement | null
    const lightboxClose = lightbox?.querySelector(".lightbox-close") as HTMLElement | null

    function openLightbox(src: string, alt: string) {
      if (!lightbox || !lightboxImg) return
      lightboxImg.src = src
      lightboxImg.alt = alt || ""
      lightbox.classList.add("is-open")
      lightbox.setAttribute("aria-hidden", "false")
      document.body.style.overflow = "hidden"
    }

    function closeLightbox() {
      if (!lightbox || !lightboxImg) return
      lightbox.classList.remove("is-open")
      lightbox.setAttribute("aria-hidden", "true")
      document.body.style.overflow = ""
      setTimeout(() => { lightboxImg.src = "" }, 300)
    }

    const lightboxItemHandlers: Array<{ el: Element; click: (e: Event) => void; keydown: (e: Event) => void }> = []
    document.querySelectorAll<HTMLElement>("[data-lightbox]").forEach((el) => {
      const click = () => openLightbox(el.dataset.lightbox || "", el.dataset.lightboxAlt || "")
      const keydown = (e: Event) => {
        const k = (e as KeyboardEvent).key
        if (k === "Enter" || k === " ") openLightbox(el.dataset.lightbox || "", el.dataset.lightboxAlt || "")
      }
      el.addEventListener("click", click)
      el.addEventListener("keydown", keydown)
      lightboxItemHandlers.push({ el, click, keydown })
    })

    const onCloseClick = () => closeLightbox()
    lightboxClose?.addEventListener("click", onCloseClick)

    const onLightboxClick = (e: Event) => { if (e.target === lightbox) closeLightbox() }
    lightbox?.addEventListener("click", onLightboxClick)

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightbox?.classList.contains("is-open")) closeLightbox()
    }
    document.addEventListener("keydown", onKeydown)

    // Swipe left to go back
    let touchStartX = 0
    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (lightbox?.classList.contains("is-open")) return
      const t = e.changedTouches[0]
      if (!t) return
      const deltaX = t.clientX - touchStartX
      const deltaY = t.clientY - touchStartY
      if (deltaX < -60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        history.back()
      }
    }
    document.addEventListener("touchstart", onTouchStart, { passive: true })
    document.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      cancelAnimationFrame(scrollRAF)
      revealObserver.disconnect()
      navObserver?.disconnect()
      statObserver.disconnect()
      anchorHandlers.forEach(({ el, handler }) => el.removeEventListener("click", handler))
      lightboxItemHandlers.forEach(({ el, click, keydown }) => {
        el.removeEventListener("click", click)
        el.removeEventListener("keydown", keydown)
      })
      lightboxClose?.removeEventListener("click", onCloseClick)
      lightbox?.removeEventListener("click", onLightboxClick)
      document.removeEventListener("keydown", onKeydown)
      document.removeEventListener("touchstart", onTouchStart)
      document.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  return null
}
