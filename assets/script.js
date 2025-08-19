// --- Dot nav active state, timeline animation, forms, etc ---
;(() => {
  // Order MUST match actual DOM order for deterministic highlighting
  const sections = [
    { id: "hero" },
    { id: "about" },
    { id: "features" },
    { id: "timeline" }, // (Journey / Background)
    { id: "work" },
    { id: "marquee" },
    { id: "contact" },
    { id: "newsletter" },
  ]

  const dots = Array.from(document.querySelectorAll(".dot-nav .dot"))

  // Smooth-scroll for header nav links and logo
  const headerLinks = Array.from(document.querySelectorAll(".header-links a, .site-logo"))
  headerLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href")
      if (!href || !href.startsWith("#")) return
      e.preventDefault()
      const id = href.slice(1)
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        try {
          history.pushState(null, "", `#${id}`)
        } catch (err) {}
      }
    })
  })

  // Global delegated handler: smooth-scroll any same-page anchor links (href="#id")
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]')
    if (!a) return

    // Ignore links without a fragment, external targets, or intentionally disabled links
    const href = a.getAttribute("href")
    if (!href || href === "#" || a.target === "_blank" || a.getAttribute("aria-disabled") === "true") return

    const id = href.slice(1)
    const target = document.getElementById(id)
    if (!target) return

    e.preventDefault()
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    try {
      history.pushState(null, "", `#${id}`)
    } catch (err) {}
  })

  function setActiveDot(id) {
    dots.forEach((d) => d.classList.toggle("active", d.dataset.section === id))
  }

  // Scroll-based deterministic section highlighting (replaces IO to avoid jumpy activation)
  const sectionEls = sections
    .map(s=>({ id:s.id, el: document.getElementById(s.id) }))
    .filter(s=>s.el)
    // Safety: sort by actual vertical position in case array order ever drifts
    .sort((a,b)=> a.el.offsetTop - b.el.offsetTop)
  let secRAF = 0
  function chooseActiveSection(){
    secRAF = 0
    const vh = window.innerHeight || document.documentElement.clientHeight
    const pivotY = vh * 0.28 // reference line
    const activationLead = 140 // px lead before pivot actually enters a section
    let active = null
    for (const s of sectionEls) {
      const rect = s.el.getBoundingClientRect()
      // If pivot has crossed (top - lead) this becomes candidate
      if (rect.top - activationLead <= pivotY) {
        active = s
      } else {
        break
      }
    }
    // Bottom fallback (allow slight tolerance ~16px)
    const nearBottom = (window.scrollY + vh) >= (document.documentElement.scrollHeight - 16)
    if (nearBottom) active = sectionEls[sectionEls.length - 1]
    if (active) setActiveDot(active.id)
  }
  function onScrollSections(){ if(!secRAF) secRAF = requestAnimationFrame(chooseActiveSection) }
  window.addEventListener('scroll', onScrollSections, { passive:true })
  window.addEventListener('resize', chooseActiveSection)
  chooseActiveSection()

  // Per-character animation for "My Projects" title
  ;(() => {
    const title = document.getElementById('projects-title')
    if (!title) return
    if (title._charsApplied) return
    title._charsApplied = true
    const text = title.textContent.trim()
    const frag = document.createDocumentFragment()
    const baseDelay = 40 // ms between chars
    Array.from(text).forEach((ch, i) => {
      const span = document.createElement('span')
      span.className = 'char'
      if (ch === ' ') {
        span.style.width = '0.45em'
        span.innerHTML = '&nbsp;'
      } else {
        span.textContent = ch
      }
      span.style.animationDelay = (i * baseDelay) + 'ms'
      frag.appendChild(span)
    })
    title.textContent = ''
    title.appendChild(frag)

    // Interactive scramble effect (adapted from React component) ---------------------------------
    // Attempts to use GSAP ScrambleTextPlugin if loaded; otherwise falls back to a custom scrambling.
    const chars = Array.from(title.querySelectorAll('.char'))
    const original = chars.map(c => c.textContent)
    const pluginAvailable = typeof gsap !== 'undefined' && gsap.plugins && gsap.plugins.ScrambleTextPlugin
    const radius = 100
    const duration = 0.5
    const scrambleChars = '.:'
    let lastPointer = { x: 0, y: 0 }
    let ticking = false
    function dist(a, b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy) }

    function handleMove(evt){
      const rect = title.getBoundingClientRect()
      lastPointer = { x: evt.clientX, y: evt.clientY }
      if (!ticking){
        requestAnimationFrame(()=>{
          ticking = false
          const centerY = rect.top + rect.height/2
          const centerX = rect.left + rect.width/2
          const pointer = lastPointer
          chars.forEach((span, i)=>{
            const crect = span.getBoundingClientRect()
            const ccenter = { x: crect.left + crect.width/2, y: crect.top + crect.height/2 }
            const d = dist(pointer, ccenter)
            if (d < radius){
              const strength = 1 - (d / radius)
              if (pluginAvailable){
                if (span._scrambling) return
                span._scrambling = true
                gsap.to(span, { duration: duration * (0.35 + 0.65*strength), scrambleText: { text: original[i], chars: scrambleChars, revealDelay: 0, tweenLength: false }, onComplete(){ span._scrambling = false } })
              } else {
                // Fallback: manual randomization then restore
                if (span._scrambling) return
                span._scrambling = true
                const target = original[i]
                const cycles = Math.max(5, Math.floor(15 * strength))
                let c = 0
                const interval = setInterval(()=>{
                  if (c >= cycles){
                    clearInterval(interval)
                    span.textContent = target
                    span._scrambling = false
                  } else {
                    const randChar = scrambleChars[Math.floor(Math.random()*scrambleChars.length)] || ':'
                    span.textContent = randChar
                  }
                  c++
                }, 30)
              }
            }
          })
        })
        ticking = true
      }
    }
    title.addEventListener('pointermove', handleMove)
    title.addEventListener('touchmove', e=>{ if (e.touches && e.touches[0]) handleMove(e.touches[0]) }, { passive:true })
  // ----------------------------------------------------------------------------------------------
  })()

  // Expandable timeline cards
  document.querySelectorAll(".timeline-card[data-expand]").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("expanded")
    })
  })
  // (Removed particle system for performance / bug reduction)

  // Contact form validation and status
  const contactForm = document.getElementById("contact-form")
  if (contactForm) {
    const status = contactForm.querySelector(".form-status")
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const data = new FormData(contactForm)
      const name = String(data.get("name") || "").trim()
      const email = String(data.get("email") || "").trim()
      const message = String(data.get("message") || "").trim()

      let valid = true
      const setError = (field, msg) => {
        const err = contactForm.querySelector(`[data-error-for="${field}"]`)
        if (err) err.textContent = msg || ""
        if (msg) valid = false
      }

      setError("name", name.length >= 2 ? "" : "Name must be at least 2 characters.")
      setError("email", /^\S+@\S+\.\S+$/.test(email) ? "" : "Please enter a valid email address.")
      setError("message", message.length >= 10 ? "" : "Message must be at least 10 characters.")

      if (!valid) return

      status.textContent = "Sending..."
      setTimeout(() => {
        status.textContent = "Message sent! We'll get back to you as soon as possible."
        contactForm.reset()
      }, 1000)
    })
  }
  // Add this to your script.js to trigger the hero background animation once
  document.addEventListener("DOMContentLoaded", () => {
    var hero = document.getElementById("hero")
    if (hero) {
      hero.classList.add("hero-bg-pop")
    }
  })

  // Newsletter form
  const newsForm = document.getElementById("newsletter-form")
  if (newsForm) {
    const newsStatus = document.getElementById("newsletter-status")
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = String(new FormData(newsForm).get("email") || "").trim()
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        newsStatus.textContent = "Please enter a valid email address."
        return
      }
      newsStatus.textContent = "Subscribing..."
      setTimeout(() => {
        newsStatus.textContent = "Thank you for subscribing!"
        newsForm.reset()
      }, 800)
    })
  }

  // Ensure clicking a dot sets it active immediately (in addition to IO)
  dots.forEach((dot) => {
    dot.addEventListener("click", (e) => {
      // Prevent browser's default instant jump so we can perform smooth scrolling
      e.preventDefault()

      const targetSection = dot.dataset.section
      const targetElement = document.getElementById(targetSection)

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })

        // Update the URL hash without causing another jump
        try {
          history.pushState(null, "", `#${targetSection}`)
        } catch (err) {}
      }

      setActiveDot(targetSection || "")
    })
  })

  // --- Timeline progress animation (smooth like Framer Motion) ---
  const timelineSection = document.getElementById("timeline")
  const timelineWrap = timelineSection ? timelineSection.querySelector(".timeline-wrap") : null

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Create or reuse sticky flower icon centered on the line
  let progressIcon = null
  if (timelineWrap) {
    progressIcon = timelineWrap.querySelector(".timeline-progress-icon")
    if (!progressIcon) {
      progressIcon = document.createElement("div")
      progressIcon.className = "timeline-progress-icon"
      progressIcon.setAttribute("aria-hidden", "true")
      progressIcon.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.477 17.5228 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" stroke="currentColor" stroke-width="2"/>' +
        '<path d="M12 8C12 8 14 10 14 12C14 14 12 16 12 16C12 16 10 14 10 12C10 10 12 8 12 8Z" stroke="currentColor" stroke-width="2"/>' +
        "</svg>"
      timelineWrap.appendChild(progressIcon)
    }

    // Inline styles (no CSS changes required)
    Object.assign(progressIcon.style, {
      position: "sticky",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%) scale(0.5)",
      zIndex: "5",
      color: "var(--primary)",
      pointerEvents: "none",
      lineHeight: "1",
      filter: "drop-shadow(0 2px 6px rgba(79, 70, 229, 0.25))",
      display: "block",
    })
    const svg = progressIcon.querySelector("svg")
    if (svg) {
      svg.style.width = "28px"
      svg.style.height = "28px"
      svg.style.display = "block"
    }
  }

  // Smooth progress with lerp for spring-like feel
  let targetProgress = 0 // 0..1 based on scroll
  let displayedProgress = 0 // lerped render value
  let rafId = 0

  function measureProgress() {
    if (!timelineWrap) return

    const rect = timelineWrap.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight

    // Map progress: top hits bottom => 0, bottom hits top => 1
    const total = rect.height + vh
    const scrolled = vh - rect.top
    const p = clamp(scrolled / total, 0, 1)

    targetProgress = p
    startRAF()
  }

  function startRAF() {
    if (rafId) return // already running

    const step = () => {
      if (!timelineWrap) {
        rafId = 0
        return
      }

      if (prefersReducedMotion) {
        displayedProgress = targetProgress
      } else {
        // LERP towards target
        displayedProgress += (targetProgress - displayedProgress) * 0.12
      }

      // Update the vertical progress line via CSS var --progress (used in your CSS ::after)
      timelineWrap.style.setProperty("--progress", displayedProgress.toFixed(4))

      // Update sticky icon Y offset (~0..100px) and scale (0.5..1.0)
      if (progressIcon) {
        const offset = (displayedProgress * 100).toFixed(2)
        const scale = (0.5 + displayedProgress * 0.5).toFixed(4)
        progressIcon.style.transform = `translate(-50%, -50%) translateY(${offset}px) scale(${scale})`
      }

      // Reveal / hide timeline rows based strictly on progress line reaching/leaving their dot centers
      if (timelineRows.length && timelineHeight > 0) {
        // Raw fill in px
        let filledPx = displayedProgress * timelineHeight
        // Adjust for vertical nudge so visible line alignment is accurate
        let verticalNudge = 0
        try { verticalNudge = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timeline-line-nudge')) || 0 } catch (_) {}
        // Visible fill compensates for nudge (negative nudge means line visually starts higher)
        let visibleFill = filledPx - (verticalNudge < 0 ? Math.abs(verticalNudge) : verticalNudge)
        if (visibleFill < 0) visibleFill = 0

        const revealBuffer = 0   // appear exactly when line reaches dot center
        const hideBuffer = 0     // disappear exactly when line retracts past dot center

        timelineRows.forEach(row => {
          const dot = row.querySelector('.timeline-dot')
            // Compute dot center relative to timeline top
          let dotCenter = row.offsetTop + (dot ? (dot.offsetTop + dot.offsetHeight / 2) : (row.offsetHeight / 2))

          if (!row.classList.contains('in-view')) {
            if (dotCenter <= visibleFill + revealBuffer) {
              row.classList.add('in-view')
              row.classList.remove('leaving')
            }
          } else {
            if (dotCenter > visibleFill + hideBuffer) {
              if (!row.classList.contains('leaving')) {
                row.classList.add('leaving')
                setTimeout(() => { row.classList.remove('in-view'); row.classList.remove('leaving') }, 620)
              }
            }
          }
        })
      }

      // Stop when close to target
      if (Math.abs(targetProgress - displayedProgress) < 0.001) {
        displayedProgress = targetProgress
        rafId = 0
      } else {
        rafId = requestAnimationFrame(step)
      }
    }

    rafId = requestAnimationFrame(step)
  }

  // Progress-based reveal (cards appear when progress line passes them)
  let timelineRows = []
  let timelineHeight = 0
  if (timelineWrap) {
    timelineRows = Array.from(timelineWrap.querySelectorAll('.timeline-row'))
  }

  function measureProgress() {
    if (!timelineWrap) return
    const rect = timelineWrap.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    timelineHeight = rect.height
    const viewportCenter = vh / 2
    // Progress: how far the viewport center has traveled from the top of the timeline
    const raw = (viewportCenter - rect.top) / rect.height
    const p = clamp(raw, 0, 1)
    targetProgress = p
    startRAF()
  }

  if (timelineWrap) {
    function gatedMeasure(){
      const sectionRect = timelineSection.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const partiallyVisible = sectionRect.bottom > 0 && sectionRect.top < vh
      if (partiallyVisible) {
        // Allow natural reveal/hide inside section
        measureProgress()
      } else {
        // Fully out of view: hard reset for a clean re-entry
        timelineRows.forEach(r=>{ r.classList.remove('in-view','leaving') })
        timelineWrap.style.setProperty('--progress','0')
        targetProgress = 0
        displayedProgress = 0
      }
    }
    window.addEventListener('scroll', gatedMeasure, { passive: true })
    window.addEventListener('resize', gatedMeasure)
    gatedMeasure()
  }
})()

// ===== Feature card skill hover label (bottom text) =====
;(function(){
  const cards = document.querySelectorAll('.feature-card .feature-card-back')
  if(!cards.length) return
  cards.forEach(back=>{
    const label = back.querySelector('.skill-hover-label')
    if(!label) return
    const skills = back.querySelectorAll('.skill-badge, .skill-logos > i, .skill-logos > span')
    skills.forEach(el=>{
      el.addEventListener('mouseenter',()=>{
        const name = el.getAttribute('data-brand') || el.getAttribute('title') || el.getAttribute('aria-label') || ''
        if(!name) return
        label.textContent = name
        label.classList.add('visible')
      })
      el.addEventListener('focus',()=>{
        const name = el.getAttribute('data-brand') || el.getAttribute('title') || el.getAttribute('aria-label') || ''
        if(!name) return
        label.textContent = name
        label.classList.add('visible')
      })
      el.addEventListener('mouseleave',()=>{
        // Only hide if leaving to outside the skill group (not moving between icons fast)
        label.classList.remove('visible')
      })
      el.addEventListener('blur',()=>{ label.classList.remove('visible') })
    })
  })
})()
;(() => {
  const header = document.querySelector(".site-header")
  if (!header) return

  const toggle = header.querySelector(".nav-toggle")
  const menu = header.querySelector("#primary-nav")
  const navLinks = header.querySelectorAll(".header-links a")
  const dotNav = document.querySelector(".dot-nav")

  if (!toggle || !menu) return

  const mqlDesktop = window.matchMedia("(min-width: 901px)")
  let lastScrollY = window.scrollY
  let isScrollingDown = false

  // Navigation functionality
  function openMenu() {
    header.classList.add("open", "navbar-expanded")
    toggle.setAttribute("aria-expanded", "true")
    if (!mqlDesktop.matches) document.body.classList.add("no-scroll")
  }

  function closeMenu() {
    header.classList.remove("open", "navbar-expanded")
    toggle.setAttribute("aria-expanded", "false")
    document.body.classList.remove("no-scroll")
  }

  function toggleMenu() {
    if (header.classList.contains("open")) closeMenu()
    else openMenu()
  }
  navLinks.forEach(l=> l.addEventListener('click', ()=>{ if(window.innerWidth < 821) closeMenu() }))

  function handleScroll() {
    const currentScrollY = window.scrollY
    isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100
    const heroSection = document.getElementById('hero')
    let heroMostlyVisible = true
    if (heroSection) {
      const rect = heroSection.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
      const visibleRatio = visiblePx / Math.max(rect.height, 1)
  // consider hero "mostly visible" if at least 25% of its height remains in viewport
  heroMostlyVisible = visibleRatio >= 0.25 && rect.bottom > 0
    }

    // On mobile, do not auto-hide the header and do not show dot nav
    if (!mqlDesktop.matches) {
      header.classList.remove('navbar-hidden')
      if (dotNav) dotNav.classList.remove('visible')
      lastScrollY = currentScrollY
      return
    }

    // Show dot nav only after hero is mostly scrolled away
    if (!heroMostlyVisible && !header.classList.contains('open')) {
      header.classList.add('navbar-hidden')
      if (dotNav) dotNav.classList.add('visible')
    } else {
      header.classList.remove('navbar-hidden')
      if (dotNav) dotNav.classList.remove('visible')
    }

    lastScrollY = currentScrollY
  }

  // Event listeners
  toggle.addEventListener("click", toggleMenu)

  // Close on link click
  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a")
    if (!a) return
    closeMenu()
  })

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!header.classList.contains("open")) return
    if (!header.contains(e.target)) closeMenu()
  })

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("open")) closeMenu()
  })

  // Handle scroll for auto-hide and expansion
  window.addEventListener("scroll", handleScroll, { passive: true })

  // Reset on desktop
  function handleResize() {
    if (mqlDesktop.matches) closeMenu()
  }

  mqlDesktop.addEventListener
    ? mqlDesktop.addEventListener("change", handleResize)
    : window.addEventListener("resize", handleResize)

  // Initial active state
  handleScroll()
})()

// Pop-in animation: allow re-trigger when fully out of view to replay; avoid jitter at threshold
;(() => {
  const els = document.querySelectorAll('.pop-in')
  if (!els.length) return

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const el = entry.target
      if (entry.isIntersecting) {
        if (el._popInRemoveTimer) { clearTimeout(el._popInRemoveTimer); el._popInRemoveTimer = null }
        if (el._popInAddTimer) return // already scheduled
        if (!el.classList.contains('in-view')) {
          const seenBefore = !!el.dataset.popInSeen
          // Delay longer if replay
          const delay = seenBefore ? 220 : 90
          el._popInAddTimer = setTimeout(()=>{
            if (seenBefore) el.classList.add('pop-in-replay')
            el.classList.add('in-view')
            el.dataset.popInSeen = '1'
            el._popInAddTimer = null
          }, delay)
        }
      } else {
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight || document.documentElement.clientHeight
        // Only remove once fully out of view (above or below) so we can replay cleanly
        if (rect.bottom < 0 || rect.top > vh) {
          if (el._popInAddTimer) { clearTimeout(el._popInAddTimer); el._popInAddTimer = null }
          if (el.classList.contains('in-view')) {
            el.classList.remove('in-view')
            el.classList.remove('pop-in-replay')
            void el.offsetWidth // reflow for next transition
          }
        }
      }
    })
  }, { threshold: [0, 0.15, 0.35], rootMargin: '0px 0px -12% 0px' })

  els.forEach(el=>observer.observe(el))

  // Reset animations when hero dominates viewport so scrolling back down replays smoothly
  const hero = document.getElementById('hero')
  let heroRAF = 0
  function checkHeroReset(){
    heroRAF = 0
    if(!hero) return
    const rect = hero.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    const visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
    const ratio = visiblePx / Math.max(rect.height,1)
    // When hero mostly visible, clear in-view so elements can replay
    if(ratio >= 0.65){
      els.forEach(el=>{
        if(el === hero) return
        if(el.classList.contains('in-view')){
          el.classList.remove('in-view','pop-in-replay')
          void el.offsetWidth
        }
      })
    }
  }
  window.addEventListener('scroll', ()=>{ if(!heroRAF) heroRAF = requestAnimationFrame(checkHeroReset) }, { passive:true })
})()

// --- Modal logic for feature cards and external links ---
function showModal(linkEl) {
  const modal = document.getElementById("link-modal")
  const tEl = document.getElementById("link-modal-title")
  const uEl = document.getElementById("link-modal-url")
  if (!linkEl) return
  // Detect if from work section
  const card = linkEl.closest('.card')
  const isWork = !!card && !!card.closest('#work')
  if (isWork && card) {
    // Manual override support: use data attributes if provided on link or card
    const rawTag = card.querySelector('.tag')?.textContent?.trim() || 'PROJECT'
  const domTitle = card.querySelector('h2, h3')?.textContent?.trim() || 'Project'
    const href = linkEl.href || ''
    const getAttr = (name) => linkEl.getAttribute(name) || card.getAttribute(name) || ''
    const customTitle = getAttr('data-modal-title') || domTitle
    const customDesc = getAttr('data-modal-desc') || `${rawTag} showcase.`
    const tagsAttr = getAttr('data-modal-tags') || rawTag
    const tags = tagsAttr.split(',').map(t=>t.trim()).filter(Boolean).slice(0,12)
    // Images (and optional captions) defined as: src|Caption;src2|Caption2
    const imagesAttr = getAttr('data-modal-images') || ''
    const slides = imagesAttr.split(';').map(s=>s.trim()).filter(Boolean).map((s)=>{
      const [srcPart, capPart] = s.split('|')
      // Remove automatic numbering: if no caption provided leave blank
      return { src: (srcPart||'').trim(), cap: (capPart||'').trim() }
    })
    // Code sample: allow inline attribute with \n for newlines
    const codeAttr = getAttr('data-modal-code') || ''
    // Escape helper
    const container = modal.querySelector('.link-modal-content')
    const esc = (s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
    if (container) {
      const tagsHtml = tags.map(t=>`<span class="modal-mac-tag">${esc(t)}</span>`).join('')
      const carouselId = 'carouselProject'
      let slidesHtml = ''
      if (slides.length) {
        slidesHtml = slides.map((sl,i)=> {
          const altText = sl.cap || customTitle || 'Slide'
          const imgTag = sl.src ? `<img src="${esc(sl.src)}" class="d-block w-100" alt="${esc(altText)}"/>` : `<div class='d-block w-100' style='height:320px;background:#333;display:flex;align-items:center;justify-content:center;color:#999;font-size:28px;'></div>`
          const captionHtml = sl.cap ? `<div class="carousel-caption d-none d-md-block"><p>${esc(sl.cap)}</p></div>` : ''
          return `<div class="carousel-item ${i===0?'active':''}">${imgTag}${captionHtml}</div>`
        }).join('')
      } else {
        // Fallback placeholder slides (no numbering/captions)
        slidesHtml = ['#666666','#777777','#ffffff'].map((clr,i)=>{
          return `<div class="carousel-item ${i===0?'active':''}"><div class='d-block w-100' style='height:320px;background:${esc(clr)};display:flex;align-items:center;justify-content:center;color:#222;font-size:32px;'></div></div>`
        }).join('')
      }
      const carouselHtml = `<div id="${carouselId}" class="carousel slide" data-bs-theme="dark"><div class="carousel-inner">${slidesHtml}</div><button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span></button><button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span></button></div>`
      let codeHtml = ''
      if (codeAttr) {
        const decoded = codeAttr.replace(/\\n/g,'\n')
        codeHtml = `<div class="modal-mac-code"><pre><code>${esc(decoded)}</code></pre></div>`
      } else {
        const defaultCode = `Title: ${customTitle}\nURL: ${href}`
        codeHtml = `<div class="modal-mac-code"><pre><code>${esc(defaultCode)}</code></pre></div>`
      }
      const githubLink = getAttr('data-modal-github') || 'https://github.com/migueldgzmn'
      const isSplitLayout = /(get to know|hi-low game app)/i.test(customTitle)
      if(isSplitLayout){
        container.innerHTML = `
          <div class="modal-mac-header">
            <span class="red" role="button" aria-label="Close modal"></span><span class="yellow"></span><span class="green"></span>
          </div>
          <div class="gtkm-split">
            <div class="gtkm-left">${carouselHtml}</div>
            <div class="gtkm-right">
              <h2 class="modal-mac-title" style="margin-top:0;">${esc(customTitle)}</h2>
              <p class="modal-mac-desc" style="max-width:520px;">${esc(customDesc)}</p>
              <div class="modal-mac-tags" style="margin-top:12px;">${tagsHtml}</div>
              ${codeHtml}
              <div class="modal-mac-footer" style="justify-content:flex-end; gap:12px; margin-top:18px;">
                <a class="modal-mac-github" href="${esc(githubLink)}" target="_blank" rel="noopener" aria-label="GitHub Link">
                  <i class="fa-brands fa-github" aria-hidden="true"></i>
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>`
        if(!document.getElementById('gtkm-style')){
          const st=document.createElement('style'); st.id='gtkm-style'; st.textContent=`.link-modal-content .gtkm-split{display:flex;align-items:center;gap:54px;min-height:460px;} .link-modal-content .gtkm-left{flex:0 0 300px;} .link-modal-content .gtkm-left .carousel{width:300px;} .link-modal-content .gtkm-right{flex:1;display:flex;flex-direction:column;justify-content:center;min-width:0;} .link-modal-content .gtkm-right .modal-mac-title{margin-top:0;} @media (max-width:900px){ .link-modal-content .gtkm-split{flex-direction:column;align-items:flex-start;gap:28px;} .link-modal-content .gtkm-right{justify-content:flex-start;} .link-modal-content .gtkm-left{flex:none;} .link-modal-content .gtkm-left .carousel{width:100%;} }`; document.head.appendChild(st)
        }
      } else {
        container.innerHTML = `
          <div class="modal-mac-header">
            <span class="red" role="button" aria-label="Close modal"></span><span class="yellow"></span><span class="green"></span>
          </div>
          <h2 class="modal-mac-title">${esc(customTitle)}</h2>
          <p class="modal-mac-desc">${esc(customDesc)}</p>
          <div class="modal-mac-tags">${tagsHtml}</div>
          <div class="modal-mac-body">${carouselHtml}</div>
          ${codeHtml}
          <div class="modal-mac-footer">
            <a class="modal-mac-github" href="${esc(githubLink)}" target="_blank" rel="noopener" aria-label="GitHub Link">
              <i class="fa-brands fa-github" aria-hidden="true"></i>
              <span>GitHub</span>
            </a>
          </div>`
      }
      const redDot = container.querySelector('.modal-mac-header .red')
      if (redDot) {
        redDot.addEventListener('click', closeMainModal)
        redDot.tabIndex = 0
        redDot.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); closeMainModal() } })
      }
    }
  } else {
    // Fallback to legacy simple content
    if (tEl) tEl.textContent = linkEl.textContent.trim() || linkEl.getAttribute("aria-label") || "External Link"
    if (uEl) uEl.textContent = linkEl.href || ''
  }
  modal.hidden = false
  modal.focus()
  lockScroll()
  try { document.dispatchEvent(new CustomEvent('app:modal-open')) } catch (_) {}
}

// Track dragging state globally
window.__featureTrackDragging = false

// Modal close logic
function closeMainModal() {
  const m = document.getElementById('link-modal')
  if (!m) return
  if (!m.hasAttribute('hidden')) {
    m.hidden = true
    try { document.dispatchEvent(new CustomEvent('app:modal-close')) } catch (_) {}
  // Clear active card shadow state
  document.querySelectorAll('.work .card.modal-active-card').forEach(c=>c.classList.remove('modal-active-card'))
  unlockScroll()
  }
}
document.querySelector(".link-modal-close").addEventListener("click", closeMainModal)
document.getElementById("link-modal").addEventListener("click", function (e) {
  if (e.target === this) closeMainModal()
})
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMainModal()
})

// Modal elements
document.addEventListener("DOMContentLoaded", () => {
  // Modal elements
  const modal = document.getElementById("link-modal")
  const modalTitle = document.getElementById("link-modal-title")
  const modalUrl = document.getElementById("link-modal-url")
  const modalClose = document.querySelector(".link-modal-close")

  // Only handle feature "Learn more" links with data-modal-title
  document.querySelectorAll("#features .learn[data-modal-title]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const title = this.getAttribute("data-modal-title") || "More Info"
      const content = this.getAttribute("data-modal-content") || ""
      modalTitle.textContent = title
      modalUrl.textContent = content
      if (modal.hasAttribute('hidden')) {
        modal.removeAttribute("hidden")
        modal.focus()
  lockScroll()
      }
    })
  })

  // Close modal on button click
  modalClose.addEventListener("click", () => {
    if (!modal.hasAttribute('hidden')) {
      modal.setAttribute("hidden", "")
      try { document.dispatchEvent(new CustomEvent('app:modal-close')) } catch (_) {}
  unlockScroll()
    }
  })

  // Close modal on outside click or ESC
  modal.addEventListener("click", (e) => {
    if (e.target === modal && !modal.hasAttribute('hidden')) {
      modal.setAttribute("hidden", "")
      try { document.dispatchEvent(new CustomEvent('app:modal-close')) } catch (_) {}
      unlockScroll()
    }
  })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hasAttribute('hidden')) {
      modal.setAttribute("hidden", "")
      try { document.dispatchEvent(new CustomEvent('app:modal-close')) } catch (_) {}
      unlockScroll()
    }
  })
})

// Delegate click for explicit View Project buttons to open modal
document.addEventListener('click', (e)=>{
  const btn = e.target.closest && e.target.closest('#work a.view-project[data-open-modal]')
  if(!btn) return
  e.preventDefault()
  const card = btn.closest('.card')
  if(!card) return
  document.querySelectorAll('.work .card.modal-active-card').forEach(c=>c.classList.remove('modal-active-card'))
  card.classList.add('modal-active-card')
  showModal(btn)
})

// Central scroll lock utilities (avoid page jump by preserving scroll and compensating scrollbar width)
function lockScroll(){
  const body = document.body
  if(body.classList.contains('scroll-locked')) return
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
  body.dataset.prevOverflow = body.style.overflow || ''
  body.dataset.prevPaddingRight = body.style.paddingRight || ''
  if(scrollBarWidth > 0){ body.style.paddingRight = scrollBarWidth + 'px' }
  body.style.overflow = 'hidden'
  body.classList.add('scroll-locked')
}
function unlockScroll(){
  const body = document.body
  if(!body.classList.contains('scroll-locked')) return
  body.classList.remove('scroll-locked')
  body.style.overflow = body.dataset.prevOverflow || ''
  body.style.paddingRight = body.dataset.prevPaddingRight || ''
  delete body.dataset.prevOverflow
  delete body.dataset.prevPaddingRight
}

// --- Stable Work section hover label (replaces previous buggy highlight logic) ---
;(function () {
  const work = document.getElementById('work')
  if (!work) return
  const cards = Array.from(work.querySelectorAll('.card'))
  if (!cards.length) return

  let label = null
  let activeCard = null
  let hideTimer = null
  let rafId = 0
  let targetX = 0
  let targetY = 0
  let typeTimer = null
  let currentText = ''

  function ensureLabel() {
    if (label) return
    label = document.createElement('span')
    label.className = 'highlight-label-follow'
    label.textContent = ''
    label.style.opacity = '0'
    label.style.transform = 'scale(0.9)'
    document.body.appendChild(label)
    requestAnimationFrame(() => {
      if (label) {
        label.style.opacity = '1'
        label.style.transform = 'scale(1)'
      }
    })
  }

  function animate() {
    if (!label) { rafId = 0; return }
    const cx = parseFloat(label.dataset.x || '0')
    const cy = parseFloat(label.dataset.y || '0')
    const nx = cx + (targetX - cx) * 0.25
    const ny = cy + (targetY - cy) * 0.25
    label.style.left = nx + 'px'
    label.style.top = ny + 'px'
    label.dataset.x = nx
    label.dataset.y = ny
    rafId = requestAnimationFrame(animate)
  }

  function startRAF() { if (!rafId) rafId = requestAnimationFrame(animate) }

  function show(card, clientX, clientY) {
  // Do not show while modal open
  const openModal = document.getElementById('link-modal')
  if (openModal && !openModal.hasAttribute('hidden')) return
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
    if (activeCard !== card) activeCard = card
    // Determine card title (prefer h3 inside card)
  const titleEl = card.querySelector('h2, h3')
    const newText = (titleEl?.textContent || 'Project').trim()
    if (newText !== currentText) {
      currentText = newText
      // force retype on content change
      if (label) label.textContent = ''
    }
    ensureLabel()
    targetX = clientX + 18
    targetY = clientY - 10
    // Immediately place label at cursor (avoid starting from top-left)
    label.style.left = targetX + 'px'
    label.style.top = targetY + 'px'
    label.dataset.x = targetX
    label.dataset.y = targetY

    // Restart typewriter only when label first created or card changed and text not fully shown
  if (label.textContent !== currentText) {
      if (typeTimer) clearTimeout(typeTimer)
      label.textContent = ''
      let i = 0
      const run = () => {
        if (!label) return
        if (i <= currentText.length) {
          label.textContent = currentText.slice(0, i)
          i++
          typeTimer = setTimeout(run, 28)
        }
      }
      run()
    }
    startRAF()
  }

  function scheduleHide() {
    if (hideTimer) return
    hideTimer = setTimeout(() => {
  // If modal opened during hide delay, just remove immediately and abort animation reuse
  const modal = document.getElementById('link-modal')
  if (modal && !modal.hasAttribute('hidden')) {
    if (label) { label.remove(); label = null }
    activeCard = null
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    hideTimer = null
    return
  }
      activeCard = null
      if (label) {
        label.style.opacity = '0'
        label.style.transform = 'scale(0.9)'
        setTimeout(() => {
          if (label && !activeCard) {
            label.remove()
            label = null
            if (rafId) cancelAnimationFrame(rafId)
            rafId = 0
          }
        }, 180)
      }
    }, 220)
  }

  cards.forEach(card => {
    card.addEventListener('pointerenter', (e) => {
      const link = card.querySelector('.learn.highlight')
      // If hovering link later, we still keep same label; no duplication.
      show(card, e.clientX, e.clientY)
    })
    card.addEventListener('pointermove', (e) => {
      if (activeCard === card) {
        targetX = e.clientX + 18
        targetY = e.clientY - 10
        startRAF()
      }
    })
    card.addEventListener('pointerleave', () => {
      if (activeCard === card) scheduleHide()
    })

    // Ensure clicking the link inside the card does not blank the label
  // Clicking the card ensures label finalizes before modal (handled above)
  })

  // Keyboard focus support: when link inside card focuses, center label
  work.addEventListener('focusin', (e) => {
    const card = e.target.closest?.('#work .card')
    if (!card) return
    const openModal = document.getElementById('link-modal')
    if (openModal && !openModal.hasAttribute('hidden')) return
    const rect = card.getBoundingClientRect()
    show(card, rect.left + rect.width / 2, rect.top + rect.height / 2)
  })
  work.addEventListener('focusout', (e) => {
    // Defer to see where focus moved
    setTimeout(() => {
      const ae = document.activeElement
      const stillInside = ae && ae.closest && ae.closest('#work .card')
      if (!stillInside) scheduleHide()
    }, 0)
  })

  // Remove label forcibly on modal open
  document.addEventListener('app:modal-open', () => {
    if (label) {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      label.remove()
      label = null
      activeCard = null
      if (typeTimer) { clearTimeout(typeTimer); typeTimer = null }
    }
  })
})()

// Feature card reactive tilt: flip once, then subtle pointer-based tilt while hovered
;(function(){
  const cards = document.querySelectorAll('.feature-card')
  if(!cards.length) return
  const MAX_TILT = 10 // degrees
  const MAX_Z = 6 // rotateZ degrees
  const DAMP = 0.12
  cards.forEach(card => {
    const inner = card.querySelector('.feature-card-inner')
    if(!inner) return
    let active = false
    let rx=0, ry=0, rz=0
    let trX=0, trY=0, trZ=0
    let animId=0
    function animate(){
      rx += (trX - rx)*DAMP
      ry += (trY - ry)*DAMP
      rz += (trZ - rz)*DAMP
      // base flip 180deg
      inner.style.transform = `rotateY(180deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`
      if (Math.abs(rx - trX) > 0.1 || Math.abs(rz - trZ) > 0.1) {
        animId = requestAnimationFrame(animate)
      } else {
        animId = 0
      }
    }
    function start(){
      if(active) return
      active = true
      card.classList.add('flip-active')
      inner.style.transition = 'transform .7s cubic-bezier(.33,1,.68,1)'
      inner.style.transform = 'rotateY(180deg)'
      setTimeout(()=>{ inner.style.transition=''; }, 720)
    }
    function end(){
      active = false
      card.classList.remove('flip-active')
      if(animId) cancelAnimationFrame(animId)
      animId=0
      rx=ry=rz=trX=trY=trZ=0
      inner.style.transition = 'transform .6s cubic-bezier(.33,1,.68,1)'
      inner.style.transform = 'rotateY(0deg)'
      setTimeout(()=>{ inner.style.transition=''; }, 620)
    }
    function pointerMove(e){
      if(!active) return
      const rect = card.getBoundingClientRect()
      const cx = rect.left + rect.width/2
      const cy = rect.top + rect.height/2
      const dx = (e.clientX - cx) / (rect.width/2)
      const dy = (e.clientY - cy) / (rect.height/2)
  // Push effect: card tilts away from cursor position (invert previous mapping)
  // When cursor is at top, rotateX slightly positive (leans back); bottom -> negative (leans forward)
  trX = dy * MAX_TILT
  // RotateZ so moving right pushes right side down (positive dx -> positive Z)
  trZ = dx * MAX_Z
  // We keep rotateY locked at 180deg; trY not used (set to 0)
  trY = 0
      // Only rotate around X and Z for subtle effect; Y remains 180deg flipped
      if(!animId) animId = requestAnimationFrame(animate)
    }
    card.addEventListener('pointerenter', start)
    card.addEventListener('focusin', start)
    card.addEventListener('pointerleave', end)
    card.addEventListener('focusout', end)
    card.addEventListener('pointermove', pointerMove)
  })
})()

// Smooth floating label for all hoverable elements except dot nav, with animated text

function getHoverLabel(el) {
  // Use aria-label, data-label, alt, placeholder, or text content
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("data-label") ||
    el.getAttribute("alt") ||
    el.getAttribute("placeholder") ||
    el.innerText?.trim() ||
    el.value?.trim() ||
    "View"
  )
}

function isDotNav(el) {
  return el.closest(".dot-nav")
}

// Select hoverable elements (not in dot nav)
// Exclude #work .highlight links here because they have their own scoped floating label above.
const hoverables = Array.from(
  document.querySelectorAll(
    `.card`
  ),
).filter((el) => !isDotNav(el) && !el.closest('#work'))

let label = null
let labelTimeout = null

hoverables.forEach((el) => {
  el.addEventListener("mouseenter", (e) => {
  const openModal = document.getElementById('link-modal')
  if (openModal && !openModal.hasAttribute('hidden')) return
    if (label) {
      label.remove()
      label = null
      clearTimeout(labelTimeout)
    }
    label = document.createElement("span")
    label.className = "floating-hover-label"
    label.style.opacity = "0"
    label.style.transform = "scale(0.95)"
    document.body.appendChild(label)

    // Animate text loading
    const labelText = getHoverLabel(el)
    label.textContent = ""
    let i = 0
    function typeText() {
      if (!label) return
      if (i <= labelText.length) {
        label.textContent = labelText.slice(0, i)
        i++
        labelTimeout = setTimeout(typeText, 18)
      }
    }
    typeText()

    // Position immediately
    label.style.left = e.clientX + 16 + "px"
    label.style.top = e.clientY - 8 + "px"
    setTimeout(() => {
      if (label) {
        label.style.opacity = "1"
        label.style.transform = "scale(1)"
      }
    }, 10)
  })

  el.addEventListener("mousemove", (e) => {
    if (label) {
      label.style.left = e.clientX + 16 + "px"
      label.style.top = e.clientY - 8 + "px"
    }
  })

  el.addEventListener("mouseleave", () => {
    if (label) {
      label.style.opacity = "0"
      label.style.transform = "scale(0.95)"
      setTimeout(() => {
        if (label) {
          label.remove()
          label = null
        }
      }, 220)
    }
    clearTimeout(labelTimeout)
  })
})

// Remove generic floating label when modal opens
document.addEventListener('app:modal-open', () => {
  if (label) {
    label.remove()
    label = null
    if (labelTimeout) { clearTimeout(labelTimeout); labelTimeout = null }
  }
})

// Pop-in animation for hero background and content (only once)
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.getElementById("hero")
  const heroCopy = hero?.querySelector(".hero-copy")
  const socialIcons = hero?.querySelector(".social-icons")
  if (hero) hero.classList.add("hero-pop-bg")
  if (heroCopy) heroCopy.classList.add("hero-pop-content")
  if (socialIcons) socialIcons.classList.add("hero-pop-content")
})

// If the page loads with a hash (e.g. example.com/#about), the browser jumps instantly.
// Replace the instant jump with a smooth scroll after load.
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (location.hash) {
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
        window.scrollTo(0, 0)
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          try { history.replaceState(null, '', `#${id}`) } catch (e) {}
        }, 40)
      }
    }
  } catch (err) {}
})

// (Custom cursor removed – reverted per user request)

// ===== Inertia Smooth Scrolling (wheel smoothing) =====
;(()=>{
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(pointer:fine)').matches
  if(prefersReduced || !finePointer) return // respect user settings / touch devices
  let target = window.scrollY
  let current = window.scrollY
  let raf = 0
  const ease = 0.12
  const maxStep = 140 // clamp single wheel step
  function clamp(v,min,max){ return v<min?min:(v>max?max:v) }
  function getMaxScroll(){ return document.documentElement.scrollHeight - window.innerHeight }
  function loop(){
    const diff = target - current
    if (Math.abs(diff) < 0.3){ current = target; raf = 0; return }
    current += diff * ease
    window.scrollTo(0, current)
    raf = requestAnimationFrame(loop)
  }
  function requestLoop(){ if(!raf) raf = requestAnimationFrame(loop) }
  window.addEventListener('wheel', (e)=>{
    if(e.ctrlKey) return // let zoom gestures pass
    e.preventDefault()
    const maxScroll = getMaxScroll()
    // Normalize delta (some devices give large values)
    let delta = e.deltaY
    delta = clamp(delta, -maxStep, maxStep)
    target = clamp(target + delta, 0, maxScroll)
    requestLoop()
  }, { passive:false })
  // Sync if user scrolls via scrollbar / programmatic
  window.addEventListener('scroll', ()=>{
    if(!raf){ current = target = window.scrollY }
  }, { passive:true })
  // Keyboard navigation support (PageUp/Down, Space, Arrows, Home/End)
  window.addEventListener('keydown', (e)=>{
    const maxScroll = getMaxScroll()
    const vh = window.innerHeight
    let used = true
    switch(e.key){
      case 'ArrowDown': target += 60; break
      case 'ArrowUp': target -= 60; break
      case 'PageDown': target += vh * 0.85; break
      case 'PageUp': target -= vh * 0.85; break
      case 'Home': target = 0; break
      case 'End': target = maxScroll; break
      case ' ': // space scrolls down (shift+space up)
        target += (e.shiftKey ? -1 : 1) * vh * 0.9; break
      default: used = false
    }
    if(used){
      e.preventDefault()
      target = clamp(target, 0, maxScroll)
      requestLoop()
    }
  })
  console.info('[SmoothScroll] inertia scrolling enabled')
})()
