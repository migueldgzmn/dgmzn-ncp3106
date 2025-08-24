// Portfolio JavaScript Functionality

document.addEventListener("DOMContentLoaded", () => {
  try {
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link")

  // Set CSS variable for navbar height so CSS `scroll-margin-top` can offset anchors
  const setNavbarHeightVar = () => {
    const navbarEl = document.querySelector('.navbar') || document.querySelector('.navbar-custom')
    const h = navbarEl ? navbarEl.offsetHeight : 70
    document.documentElement.style.setProperty('--navbar-height', `${h}px`)
  }

  // initialize and keep updated on resize
  setNavbarHeightVar()
  window.addEventListener('resize', setNavbarHeightVar)
  // small helper: respect user preference for reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // robust smooth scroll helper using requestAnimationFrame
  const smoothScrollTo = (targetY, duration = 700) => {
    if (prefersReduced) {
      window.scrollTo(0, targetY)
      return
    }

    const startY = window.pageYOffset || document.documentElement.scrollTop
    const diff = targetY - startY
    let startTime = null

    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const t = Math.min(1, elapsed / duration)
      const eased = easeInOutCubic(t)
      window.scrollTo(0, Math.round(startY + diff * eased))
      if (elapsed < duration) window.requestAnimationFrame(step)
    }

    window.requestAnimationFrame(step)
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault()
      const targetId = this.getAttribute('href')
      const targetSection = document.querySelector(targetId)

      if (!targetSection) return

      const navbarEl = document.querySelector('.navbar') || document.querySelector('.navbar-custom')
      const navbarHeight = navbarEl ? navbarEl.offsetHeight : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 70
      const targetRect = targetSection.getBoundingClientRect()
      const targetY = window.pageYOffset + targetRect.top - navbarHeight - 12

      // perform smooth glide
      smoothScrollTo(targetY, 700)

      // update active link state
      navLinks.forEach((navLink) => navLink.classList.remove('active'))
      this.classList.add('active')

      // on small screens, collapse the name-pill and restore original name text if swapped
      try {
        const navNameEl = document.querySelector('.nav-name')
        if (navNameEl) {
          // restore original text immediately if stored
          if (navNameEl._originalDesktop) {
            const d = navNameEl.querySelector('.name-text--desktop')
            const m = navNameEl.querySelector('.name-text--mobile')
            if (d) d.innerHTML = navNameEl._originalDesktop
            if (m) m.innerHTML = navNameEl._originalMobile
          }
          navNameEl.classList.remove('expanded', 'temporarily-open', 'nav-name--clicked')
          navNameEl.setAttribute('aria-expanded', 'false')
          // also remove focus to avoid accidental reopen
          try { navNameEl.blur() } catch (e) {}
        }
      } catch (err) {
        console.warn('Failed to restore nav-name after click', err)
      }
    })
  })

  const sections = document.querySelectorAll("section[id]")

  // helper for temporary nav reveal on active-section change
  const navName = document.querySelector('.nav-name')
  let tempTimerGlobal = null
  let lastActiveSectionId = null
  const isDesktop = () => window.matchMedia('(min-width: 992px)').matches

  window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY + 120 // Increased offset for better desktop detection

    sections.forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute("id")

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove("active")
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active")
            // reveal nav-name briefly when entering a new section (desktop only)
            if (isDesktop() && navName && sectionId !== lastActiveSectionId) {
               lastActiveSectionId = sectionId
              navName.classList.add('temporarily-open')
              if (tempTimerGlobal) clearTimeout(tempTimerGlobal)
              tempTimerGlobal = setTimeout(() => navName.classList.remove('temporarily-open'), 1800)
            }
          }
        })
      }
    })
  })

  // Navbar link activation on scroll
  // convert NodeList to Array to ensure `forEach` and other array helpers are available
  let sectionsForNav = Array.from(document.querySelectorAll("div[id], section[id]"))

  // defensive: if for some environment or accidental overwrite `forEach` is missing,
  // try to coerce to a plain Array; if coercion fails, fall back to an empty array.
  if (!sectionsForNav || typeof sectionsForNav.forEach !== 'function') {
    try {
      sectionsForNav = Array.prototype.slice.call(sectionsForNav || [])
    } catch (err) {
      console.warn('sectionsForNav is not iterable; skipping link observer init', sectionsForNav, err)
      sectionsForNav = []
    }
  }

  const linkObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("id")
        const link = document.querySelector(`.navbar-nav a[href="#${id}"]`)

        // reuse existing `navLinks` NodeList from above
        navLinks.forEach((navLink) => navLink.classList.toggle("active", entry.isIntersecting && navLink === link))
      })
    },
    { threshold: 0.4, rootMargin: "0px" },
  )

  sectionsForNav.forEach((section) => linkObserver.observe(section))

  (function () {
    try {
      const navbar = document.querySelector('.navbar-custom')
    // ensure we have at least one section to observe
    if (!navbar || !sectionsForNav || sectionsForNav.length === 0) return

      // create banner element inside navbar
      let banner = navbar.querySelector('.nav-banner')
      if (!banner) {
        banner = document.createElement('div')
        banner.className = 'nav-banner'
        banner.setAttribute('role', 'status')
        banner.setAttribute('aria-live', 'polite')
        navbar.appendChild(banner)
      }

      let bannerTimeout = null

      // Temporarily swap the displayed name to the section title (for a quick notification)
      const nameSwap = (text) => {
        if (!text) return
        const navNameEl = document.querySelector('.nav-name')
        if (!navNameEl) return

        // store originals if not already stored
        if (!navNameEl._originalDesktop) {
          const d = navNameEl.querySelector('.name-text--desktop')
          const m = navNameEl.querySelector('.name-text--mobile')
          navNameEl._originalDesktop = d ? d.innerHTML : ''
          navNameEl._originalMobile = m ? m.innerHTML : ''
        }

        const dEl = navNameEl.querySelector('.name-text--desktop')
        const mEl = navNameEl.querySelector('.name-text--mobile')

        // set new text (keep the dot for visual continuity)
        if (dEl) dEl.innerHTML = `<span class="temp-section-title">${text}</span>`
        if (mEl) mEl.innerHTML = `<span class="temp-section-title">${text}</span>`

        // ensure we don't interrupt other temporary states
        setTimeout(() => {
          if (dEl) dEl.innerHTML = navNameEl._originalDesktop
          if (mEl) mEl.innerHTML = navNameEl._originalMobile
        }, 1800)
      }

      const showBanner = (text) => {
        if (!text) return
        banner.textContent = text
        // animate navbar down and reveal banner
        navbar.classList.add('scrolled-section')
        // also swap the displayed nav name temporarily for visibility
        try {
          if (typeof nameSwap === 'function') nameSwap(text)
        } catch (err) {
          // swallow nameSwap errors to avoid breaking UX
          console.warn('nameSwap failed', err)
        }
        banner.classList.add('show')

        if (bannerTimeout) clearTimeout(bannerTimeout)
        bannerTimeout = setTimeout(() => {
          banner.classList.remove('show')
          navbar.classList.remove('scrolled-section')
        }, 2000)
      }

      // Observe sections (use existing `sections` nodeList)
      const bannerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // prefer visible section title text when available
              const titleEl = entry.target.querySelector('.section-title')
              const title = titleEl ? titleEl.textContent.trim() : entry.target.getAttribute('id')
              showBanner(title)
            }
          })
        },
        { threshold: 0.65, rootMargin: '0px' },
      )

          if (typeof sections !== 'undefined' && sections && sections.length) {
            sections.forEach((s) => bannerObserver.observe(s))
          }
    } catch (err) {
      console.error('nav/banner init uncaught error:', err)
    }
  })()

  // Temporarily reveal the nav-name menu (like hover) when entering a section (desktop only)
  ;(function () {
    const navName = document.querySelector('.nav-name')
    if (!navName) return

  // reuse outer isDesktop helper
  let tempTimer = null

    const revealBriefly = () => {
      if (!isDesktop()) return
      navName.classList.add('temporarily-open')
      if (tempTimer) clearTimeout(tempTimer)
      tempTimer = setTimeout(() => navName.classList.remove('temporarily-open'), 1800)
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) revealBriefly()
        })
      },
      { threshold: 0.7 },
    )

    if (typeof sections !== 'undefined' && sections && sections.length) {
      sections.forEach((s) => sectionObserver.observe(s))
    }
  })()
  } catch (err) {
    console.error('Error inside DOMContentLoaded handler:', err)
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible")
      }
    })
  }, observerOptions)

  const fadeElements = document.querySelectorAll(".card, .timeline-item, .section-title")
  fadeElements.forEach((el) => {
    el.classList.add("fade-in")
    observer.observe(el)
  })

  const contactForms = document.querySelectorAll("form")

  contactForms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault()

      const submitBtn = this.querySelector('button[type="submit"]')
      const originalText = submitBtn.innerHTML

      submitBtn.innerHTML = '<span class="loading"></span> Sending...'
      submitBtn.disabled = true

      setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Message Sent!'
        submitBtn.classList.remove("btn-dark", "btn-light")
        submitBtn.classList.add("btn-success")

        this.reset()

        setTimeout(() => {
          submitBtn.innerHTML = originalText
          submitBtn.disabled = false
          submitBtn.classList.remove("btn-success")
          submitBtn.classList.add("btn-dark")
        }, 3000)

        const modal = window.bootstrap.Modal.getInstance(document.getElementById("contactModal"))
        if (modal) {
          setTimeout(() => modal.hide(), 1500)
        }
      }, 2000)
    })
  })

  /* hero typewriter removed — no <h1> in current markup; parallax intentionally disabled */

  const skillCards = document.querySelectorAll("#skills .card")

  skillCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-10px) scale(1.02)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)"
    })
  })

  const projectCarousel = document.getElementById("projectCarousel")
  if (projectCarousel) {
    const carousel = new window.bootstrap.Carousel(projectCarousel, {
      interval: 5000,
      wrap: true,
    })

    projectCarousel.addEventListener("mouseenter", () => {
      carousel.pause()
    })

    projectCarousel.addEventListener("mouseleave", () => {
      carousel.cycle()
    })
  }

  const buttons = document.querySelectorAll(".btn")

  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      const ripple = document.createElement("span")
      const rect = this.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      ripple.style.width = ripple.style.height = size + "px"
      ripple.style.left = x + "px"
      ripple.style.top = y + "px"
      ripple.classList.add("ripple")

      this.appendChild(ripple)

      setTimeout(() => {
        ripple.remove()
      }, 600)
    })
  })

  const backToTop = document.createElement("button")
  backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>'
  backToTop.className = "btn btn-dark position-fixed"
  backToTop.style.cssText = `
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    `

  document.body.appendChild(backToTop)

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTop.style.opacity = "1"
      backToTop.style.visibility = "visible"
    } else {
      backToTop.style.opacity = "0"
      backToTop.style.visibility = "hidden"
    }
  })

  backToTop.addEventListener("click", () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0)
    }
  })

})

// Name-only navbar accessibility and close-on-click for desktop reveal
;(function () {
  const navName = document.querySelector('.nav-name')
  if (!navName) return

  const menu = navName.querySelector('.nav-menu')
  const links = menu ? menu.querySelectorAll('.nav-link') : []

  const setAria = (expanded) => navName.setAttribute('aria-expanded', expanded ? 'true' : 'false')

  navName.addEventListener('focusin', () => setAria(true))
  navName.addEventListener('focusout', (e) => {
    // Close only when focus moves outside the name container
    if (!navName.contains(e.relatedTarget)) setAria(false)
  })

  links.forEach((a) => {
    a.addEventListener('click', () => {
      // close reveal after navigation for desktop
      navName.blur()
      setAria(false)
    })
  })
})()

  // Mobile touch toggle for the name-navbar
;(function () {
  const navName = document.querySelector('.nav-name')
  if (!navName) return

  const menu = navName.querySelector('.nav-menu')
  const links = menu ? menu.querySelectorAll('.nav-link') : []

  const isSmallScreen = () => window.matchMedia('(max-width: 991.98px)').matches

  const closeMenu = () => {
    navName.classList.remove('expanded')
    navName.setAttribute('aria-expanded', 'false')
  }

  const openMenu = () => {
    navName.classList.add('expanded')
    navName.setAttribute('aria-expanded', 'true')
  }

  navName.addEventListener('click', (e) => {
    if (!isSmallScreen()) return
    // if clicking a link inside, let the link handler run; else toggle
    if (e.target.closest('.nav-link')) {
      closeMenu()
      return
    }
    e.preventDefault()
    if (navName.classList.contains('expanded')) closeMenu()
    else openMenu()
  })

  // close when clicking outside on small screens
  document.addEventListener('click', (e) => {
    if (!isSmallScreen()) return
    if (!navName.contains(e.target)) closeMenu()
  })

  // ensure links close menu on click
  links.forEach((a) => a.addEventListener('click', (e) => {
    // let existing nav click handler handle scrolling, then force collapse/restore
    try {
      closeMenu()
      const navNameEl = document.querySelector('.nav-name')
      if (navNameEl && navNameEl._originalDesktop) {
        const d = navNameEl.querySelector('.name-text--desktop')
        const m = navNameEl.querySelector('.name-text--mobile')
        if (d) d.innerHTML = navNameEl._originalDesktop
        if (m) m.innerHTML = navNameEl._originalMobile
      }
      // remove any temporary open classes
      if (navNameEl) {
        navNameEl.classList.remove('temporarily-open', 'nav-name--clicked')
        navNameEl.setAttribute('aria-expanded', 'false')
        try { navNameEl.blur() } catch (err) {}
      }
    } catch (err) {
      console.warn('Error collapsing nav after link click', err)
    }
  }))
})()
