// --- Dot nav active state, timeline animation, forms, etc ---
;(() => {
  const sections = [
    { id: "hero" },
    { id: "about" },
    { id: "features" },
    { id: "work" },
    { id: "timeline" },
    { id: "marquee" },
    { id: "contact" },
    { id: "newsletter" },
  ]

  const dots = Array.from(document.querySelectorAll(".dot-nav .dot"))

  function setActiveDot(id) {
    dots.forEach((d) => d.classList.toggle("active", d.dataset.section === id))
  }

  // Intersection Observer to highlight current section
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveDot(entry.target.id)
        }
      })
    },
    {
      root: null,
      rootMargin: "0px 0px -60% 0px",
      threshold: 0.2,
    },
  )

  sections.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) io.observe(el)
  })

  // Expandable timeline cards
  document.querySelectorAll(".timeline-card[data-expand]").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("expanded")
    })
  })

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
    dot.addEventListener("click", () => {
      setActiveDot(dot.dataset.section || "")
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

  // Sequential "one by one" reveal of timeline rows
  if (timelineWrap) {
    const rows = Array.from(timelineWrap.querySelectorAll(".timeline-row"))
    const revealed = new Set()
    const candidates = new Set()
    let running = false

    // Wait long enough so each animation completes before the next starts
    const STAGGER_MS = 650 // adjust for faster/slower sequencing (matches ~0.6s CSS transition)

    function revealNext() {
      if (running) return
      // Pick the next candidate in DOM order
      const next = rows.find((r) => candidates.has(r) && !revealed.has(r))
      if (!next) return

      running = true
      next.classList.add("in-view")
      revealed.add(next)
      rowObserver.unobserve(next)
      candidates.delete(next)

      setTimeout(() => {
        running = false
        // Immediately attempt to reveal the next in queue
        revealNext()
      }, STAGGER_MS)
    }

    const rowObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target
          if (entry.isIntersecting && !revealed.has(el)) {
            candidates.add(el)
            revealNext()
          } else if (!entry.isIntersecting && !revealed.has(el)) {
            // If it leaves before being revealed, remove from queue
            candidates.delete(el)
          }
        })
      },
      { threshold: 0.25 },
    )

    rows.forEach((row) => rowObserver.observe(row))

    window.addEventListener("scroll", measureProgress, { passive: true })
    window.addEventListener("resize", measureProgress)
    measureProgress()
  }
})()
;(() => {
  const header = document.querySelector(".site-header")
  if (!header) return

  const toggle = header.querySelector(".nav-toggle")
  const menu = header.querySelector("#primary-nav")
  const navLinks = header.querySelectorAll(".header-links a")

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

  // Auto-hide navbar on scroll down, show on scroll up
  function handleScroll() {
    const currentScrollY = window.scrollY
    isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100

    if (isScrollingDown && !header.classList.contains("open")) {
      header.classList.add("navbar-hidden")
    } else {
      header.classList.remove("navbar-hidden")
    }

    // Expand navbar when near sections
    const sections = document.querySelectorAll("section[id]")
    let nearSection = false

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect()
      if (rect.top <= 100 && rect.bottom >= 0) {
        nearSection = true
        // Update active nav link
        const sectionId = section.getAttribute("id")
        navLinks.forEach((link) => {
          const href = link.getAttribute("href")
          if (href === `#${sectionId}`) {
            link.classList.add("active")
          } else {
            link.classList.remove("active")
          }
        })
      }
    })

    if (nearSection && !header.classList.contains("open")) {
      header.classList.add("navbar-expanded")
    } else if (!header.classList.contains("open")) {
      header.classList.remove("navbar-expanded")
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

// Pop-in animation for all .pop-in elements (exclude timeline-card to avoid conflicts with sequencer)
;(() => {
  const popSections = document.querySelectorAll(".pop-in")

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!entry.target._popInTimeout) {
            entry.target._popInTimeout = setTimeout(() => {
              entry.target.classList.add("in-view")
              entry.target._popInTimeout = null
            }, 120) // delay in ms
          }
        } else {
          entry.target.classList.remove("in-view")
          if (entry.target._popInTimeout) {
            clearTimeout(entry.target._popInTimeout)
            entry.target._popInTimeout = null
          }
        }
      })
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -17% 0px", // triggers when element is lower in viewport
    },
  )

  popSections.forEach((section) => observer.observe(section))
})()

// --- Modal logic for feature cards and external links ---
function showModal(cardOrLink) {
  const modal = document.getElementById("link-modal")
  const title = document.getElementById("link-modal-title")
  const url = document.getElementById("link-modal-url")

  if (cardOrLink.classList.contains("feature-card")) {
    title.textContent = cardOrLink.querySelector("h3")?.textContent?.trim() || "Feature"
    url.textContent = cardOrLink.querySelector(".learn")?.href || ""
  } else {
    title.textContent = cardOrLink.textContent.trim() || cardOrLink.getAttribute("aria-label") || "External Link"
    url.textContent = cardOrLink.href
  }

  modal.hidden = false
  modal.focus()
}

// Track dragging state globally
window.__featureTrackDragging = false

// Feature card click handler (not while dragging)
document.querySelectorAll(".feature-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    if (window.__featureTrackDragging) return
    showModal(card)
  })
})

// Only open modal for feature cards and work/project links, NOT social icons

// Remove or comment out this block:
// document.querySelectorAll('a[target="_blank"]').forEach((link) => {
//   link.addEventListener("click", (e) => {
//     e.preventDefault()
//     showModal(link)
//   })
// })

// If you want modals for project links only, use a more specific selector:
document.querySelectorAll('.card .learn[target="_blank"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault()
    showModal(link)
  })
})

// Social icons will now open in a new tab as expected.

// Modal close logic
document.querySelector(".link-modal-close").addEventListener("click", () => {
  document.getElementById("link-modal").hidden = true
})
document.getElementById("link-modal").addEventListener("click", function (e) {
  if (e.target === this) this.hidden = true
})
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.getElementById("link-modal").hidden = true
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
      modal.removeAttribute("hidden")
      modal.focus()
    })
  })

  // Close modal on button click
  modalClose.addEventListener("click", () => {
    modal.setAttribute("hidden", "")
  })

  // Close modal on outside click or ESC
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.setAttribute("hidden", "")
    }
  })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal.setAttribute("hidden", "")
    }
  })
})

// --- Follow cursor highlight for links and buttons ---
document.querySelectorAll(".highlight").forEach((el) => {
  let label
  el.addEventListener("mouseenter", () => {
    label = document.createElement("span")
    label.className = "highlight-label-follow"
    label.textContent = "View"
    document.body.appendChild(label)
    el.classList.add("active")
  })
  el.addEventListener("mousemove", (e) => {
    if (label) {
      label.style.left = e.clientX + 16 + "px"
      label.style.top = e.clientY - 8 + "px"
    }
  })
  el.addEventListener("mouseleave", () => {
    if (label) {
      label.remove()
      label = null
    }
    el.classList.remove("active")
  })
})

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
const hoverables = Array.from(
  document.querySelectorAll(`
  a, button, input, textarea, select, label,
  .feature-card, .card, .timeline-card, .tag
`),
).filter((el) => !isDotNav(el))

let label = null
let labelTimeout = null

hoverables.forEach((el) => {
  el.addEventListener("mouseenter", (e) => {
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

// Pop-in animation for hero background and content (only once)
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.getElementById("hero")
  const heroCopy = hero?.querySelector(".hero-copy")
  const socialIcons = hero?.querySelector(".social-icons")
  if (hero) hero.classList.add("hero-pop-bg")
  if (heroCopy) heroCopy.classList.add("hero-pop-content")
  if (socialIcons) socialIcons.classList.add("hero-pop-content")
})
