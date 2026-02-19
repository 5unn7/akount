'use client'

import { useEffect, useRef, useState, useCallback, type MouseEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { joinWaitlist } from '../apps/web/src/app/actions/waitlist'
import s from './landing.module.css'

// ─── Types ───
interface LandingPageProps {
  isSignedIn: boolean
}

// ─── Constants ───
const QUESTION_TEXT =
  'What if your finances just... made sense? What if one glance told you everything? What if anxiety around money simply... vanished?'
const ACCENT_WORDS = new Set(['sense?', 'everything?', 'vanished?'])
const GREEN_WORDS = new Set(['finances'])

const FEATURES = [
  {
    title: 'AI Categorization',
    desc: 'Transactions categorized the moment they arrive. The AI learns your patterns and becomes your tireless bookkeeper.',
    color: 'pri',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
        <path d="M12 6v6l4 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Multi-Currency Native',
    desc: 'Real-time FX rates, automatic conversions, reporting in your base currency. No spreadsheet gymnastics ever again.',
    color: 'green',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
      </svg>
    ),
  },
  {
    title: 'Bank Reconciliation',
    desc: 'Import CSV or PDF statements. Our algorithm matches and reconciles with 95% accuracy — automatically.',
    color: 'blue',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    ),
  },
  {
    title: 'AI-Powered Insights',
    desc: 'Proactive insights about cash flow, unusual spending, and optimization opportunities. Like a CFO in your pocket.',
    color: 'purple',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'Beautiful Invoicing',
    desc: 'Professional invoices in any currency. Track payments, send reminders, and watch your journal entries create themselves.',
    color: 'teal',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8" />
      </svg>
    ),
  },
  {
    title: 'Audit-Ready Books',
    desc: 'Immutable double-entry bookkeeping with complete audit trails. Tax season becomes a non-event.',
    color: 'red',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
]

const FEAT_COLORS: Record<string, { bg: string; color: string }> = {
  pri: { bg: 'var(--ak-pri-dim)', color: 'var(--primary)' },
  green: { bg: 'var(--ak-green-dim)', color: 'var(--ak-green)' },
  blue: { bg: 'var(--ak-blue-dim)', color: 'var(--ak-blue)' },
  purple: { bg: 'var(--ak-purple-dim)', color: 'var(--ak-purple)' },
  teal: { bg: 'var(--ak-teal-dim, rgba(45,212,191,0.12))', color: 'var(--ak-teal)' },
  red: { bg: 'var(--ak-red-dim)', color: 'var(--ak-red)' },
}

const TESTIMONIALS = [
  {
    quote:
      'I invoice clients in 4 currencies. Before Akount, tax season was a nightmare of spreadsheets. Now it\u2019s literally one click to see everything.',
    name: 'Sofia Navarro',
    role: 'Brand Consultant \u00b7 Barcelona',
    initials: 'SN',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  {
    quote:
      'The AI Pulse feels like having a CFO who actually understands my business. It caught a duplicate subscription I\u2019d been paying for months.',
    name: 'James Tanaka',
    role: 'Software Developer \u00b7 Tokyo',
    initials: 'JT',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
  },
  {
    quote:
      'I went from dreading my books to genuinely enjoying the clarity. The dark dashboard is gorgeous, and the data just makes sense instantly.',
    name: 'Amara Khoury',
    role: 'UX Designer \u00b7 Dubai',
    initials: 'AK',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
  },
]

// ─── Component ───
export default function LandingPage({ isSignedIn }: LandingPageProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const preloaderRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const questionRef = useRef<HTMLElement>(null)
  const tqTextRef = useRef<HTMLDivElement>(null)
  const dashFrameRef = useRef<HTMLDivElement>(null)
  const numbersRef = useRef<HTMLDivElement>(null)
  const orbsRef = useRef<(HTMLDivElement | null)[]>([])

  // State
  const [navScrolled, setNavScrolled] = useState(false)
  const [dashVisible, setDashVisible] = useState(false)
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formMessage, setFormMessage] = useState('')
  const [counters, setCounters] = useState([0, 0, 0, 0])
  const countedRef = useRef(false)

  // ─── Star Field Canvas ───
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    interface Star {
      x: number
      y: number
      r: number
      a: number
      pulse: number
    }
    let stars: Star[] = []

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight * 5
    }

    function createStars() {
      if (!canvas) return
      stars = []
      const count = Math.floor((canvas.width * canvas.height) / 18000)
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random() * 0.5 + 0.1,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = performance.now() * 0.001
      for (const star of stars) {
        const flicker = Math.sin(t * 2 + star.pulse) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240,240,245,${star.a * flicker})`
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }

    resize()
    createStars()
    draw()

    const onResize = () => {
      resize()
      createStars()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animId)
    }
  }, [])

  // ─── Preloader ───
  useEffect(() => {
    const timer = setTimeout(() => {
      preloaderRef.current?.classList.add(s.preloaderDone)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  // ─── Scroll handlers (progress + nav + ambient orbs) ───
  useEffect(() => {
    function onScroll() {
      // Scroll progress
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (progressRef.current && h > 0) {
        progressRef.current.style.width = `${(window.scrollY / h) * 100}%`
      }
      // Nav
      setNavScrolled(window.scrollY > 60)
      // Ambient orb parallax
      const y = window.scrollY
      const [o1, o2, o3] = orbsRef.current
      if (o1) o1.style.transform = `translate(${Math.sin(y * 0.001) * 30}px, ${y * -0.08}px)`
      if (o2) o2.style.transform = `translate(${Math.cos(y * 0.0008) * 40}px, ${y * -0.05}px)`
      if (o3) o3.style.transform = `translate(${Math.sin(y * 0.0012) * 20}px, ${y * -0.03}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ─── Scroll Reveal Observer ───
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // For reveal elements
            if (e.target.classList.contains(s.reveal)) {
              e.target.classList.add(s.revealVisible)
            }
            // For stagger children
            if (e.target.classList.contains(s.staggerChildren)) {
              e.target.classList.add(s.staggerChildrenVisible)
            }
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    )

    document.querySelectorAll(`.${s.reveal}, .${s.staggerChildren}`).forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // ─── The Question — Word-by-word reveal on scroll ───
  useEffect(() => {
    const section = questionRef.current
    const textEl = tqTextRef.current
    if (!section || !textEl) return

    function updateWords() {
      if (!section || !textEl) return
      const rect = section.getBoundingClientRect()
      const rawProgress = 1 - rect.top / (window.innerHeight * 0.5)
      const p = Math.max(0, Math.min(1, rawProgress))

      const words = textEl.querySelectorAll(`.${s.tqWord}`)
      words.forEach((el, i) => {
        const threshold = (i / words.length) * 0.85
        el.classList.toggle(s.tqWordLit, p > threshold)
      })
    }

    window.addEventListener('scroll', updateWords, { passive: true })
    updateWords()
    return () => window.removeEventListener('scroll', updateWords)
  }, [])

  // ─── Dashboard Perspective Reveal ───
  useEffect(() => {
    const frame = dashFrameRef.current
    if (!frame) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setDashVisible(true)
        })
      },
      { threshold: 0.15 }
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  // ─── Number Counter Animation ───
  useEffect(() => {
    const el = numbersRef.current
    if (!el) return

    const targets = [40, 10, 95, 0]
    const observer = new IntersectionObserver(
      (entries) => {
        if (countedRef.current) return
        entries.forEach((e) => {
          if (e.isIntersecting) {
            countedRef.current = true
            const duration = 2000
            const start = performance.now()

            const tick = (now: number) => {
              const elapsed = now - start
              const progress = Math.min(elapsed / duration, 1)
              const eased = 1 - Math.pow(1 - progress, 3)
              setCounters(targets.map((t) => Math.round(t * eased)))
              if (progress < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ─── Feature Card Mouse Glow ───
  const trackMouse = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    card.style.setProperty('--mx', `${x}%`)
    card.style.setProperty('--my', `${y}%`)
  }, [])

  // ─── Smooth anchor scrolling ───
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // ─── Waitlist Form ───
  const handleWaitlist = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState('submitting')

    const form = e.currentTarget
    const data = new FormData(form)
    const result = await joinWaitlist(data)

    if (result.success) {
      setFormState('success')
      setFormMessage(result.message)
      form.reset()
      setTimeout(() => setFormState('idle'), 3500)
    } else {
      setFormState('error')
      setFormMessage(result.message)
      setTimeout(() => setFormState('idle'), 3000)
    }
  }, [])

  // ─── Question words ───
  const questionWords = QUESTION_TEXT.split(' ')

  return (
    <>
      {/* PRELOADER */}
      <div ref={preloaderRef} className={s.preloader}>
        <div className={s.preloaderLogo}>A</div>
      </div>

      {/* AMBIENT BACKGROUND */}
      <canvas ref={canvasRef} className={s.starsCanvas} />
      <div className={s.ambient}>
        <div ref={(el) => { orbsRef.current[0] = el }} className={`${s.ambOrb} ${s.ambOrb1}`} />
        <div ref={(el) => { orbsRef.current[1] = el }} className={`${s.ambOrb} ${s.ambOrb2}`} />
        <div ref={(el) => { orbsRef.current[2] = el }} className={`${s.ambOrb} ${s.ambOrb3}`} />
      </div>
      <div className={s.noise} />

      {/* SCROLL PROGRESS */}
      <div ref={progressRef} className={s.scrollProgress} />

      {/* NAV */}
      <nav ref={navRef} className={`${s.nav} ${navScrolled ? s.navScrolled : ''}`}>
        <div className={`${s.container} ${s.navInner}`}>
          <a href="#" className={s.navLogo} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <div className={s.navLogoMark}>A</div>
            <span className={s.navLogoText}>Akount</span>
          </a>
          <div className={s.navLinks}>
            <button className={s.navLink} onClick={() => scrollTo('features')}>Features</button>
            <button className={s.navLink} onClick={() => scrollTo('how')}>How It Works</button>
            <button className={s.navLink} onClick={() => scrollTo('voices')}>Voices</button>
            {isSignedIn ? (
              <Link href="/overview" className={s.navCta}>Go to Dashboard</Link>
            ) : (
              <button className={s.navCta} onClick={() => scrollTo('final')}>Join the Waitlist</button>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className={s.hero} id="hero">
        <div className={s.heroOrbContainer}>
          <div className={s.heroOrb} />
        </div>
        <div className={s.heroContent}>
          <div className={s.heroBadge}>
            <span className={s.heroBadgePulse} />
            Now accepting early access
          </div>
          <h1 className={s.heroTitle}>
            <span className={s.heroLine}>Financial clarity</span>
            <span className={s.heroLine}>for <span className={s.glow}>global</span></span>
            <span className={s.heroLine}>solopreneurs</span>
          </h1>
          <p className={s.heroSub}>
            AI-powered accounting that thinks in every currency.
            <br />
            <em className={s.heroSubEm}>One glance. Zero anxiety.</em>
          </p>
          <div className={s.heroCtaWrap}>
            {isSignedIn ? (
              <Link href="/overview" className={s.dashboardCta}>
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <form className={s.heroCtaGroup} onSubmit={handleWaitlist}>
                  <input
                    type="email"
                    name="email"
                    className={s.heroInput}
                    placeholder="you@company.com"
                    required
                    aria-label="Email"
                  />
                  <button
                    type="submit"
                    className={`${s.heroBtn} ${formState === 'success' ? s.heroBtnSuccess : ''}`}
                    disabled={formState === 'submitting'}
                    style={formState === 'submitting' ? { opacity: 0.7 } : undefined}
                  >
                    {formState === 'submitting'
                      ? 'Joining...'
                      : formState === 'success'
                        ? formMessage
                        : 'Join the Waitlist'}
                  </button>
                </form>
                <p className={s.heroNote}>Free early access &middot; No credit card &middot; Cancel anytime</p>
              </>
            )}
          </div>
        </div>
        <div className={s.scrollHint}>
          <span className={s.scrollHintText}>Scroll</span>
          <div className={s.scrollHintLine} />
        </div>
      </section>

      {/* ═══ THE QUESTION ═══ */}
      <section ref={questionRef} className={s.theQuestion} id="the-question">
        <div ref={tqTextRef} className={s.tqText}>
          {questionWords.map((word, i) => {
            let cls = s.tqWord
            if (ACCENT_WORDS.has(word)) cls += ` ${s.tqWordAccent}`
            if (GREEN_WORDS.has(word)) cls += ` ${s.tqWordGreen}`
            return <span key={i} className={cls}>{word}</span>
          })}
        </div>
      </section>

      {/* ═══ DASHBOARD EMERGENCE ═══ */}
      <section className={s.dashboardSection}>
        <div className={s.container}>
          <div className={`${s.dashLabel} ${s.reveal}`}>
            <div className={s.dashLabelTag}>The Dashboard</div>
            <h2 className={s.dashLabelTitle}>Your entire financial world. One screen.</h2>
            <p className={s.dashLabelSub}>No tabs. No spreadsheets. Just clarity.</p>
          </div>

          <div
            ref={dashFrameRef}
            className={`${s.dashFrame} ${s.reveal} ${dashVisible ? s.dashFrameVisible : ''}`}
          >
            {/* Window chrome */}
            <div className={s.windowBar}>
              <div className={`${s.windowDot} ${s.windowDotR}`} />
              <div className={`${s.windowDot} ${s.windowDotY}`} />
              <div className={`${s.windowDot} ${s.windowDotG}`} />
              <div className={s.windowTitle}>Akount &mdash; Financial Command Center</div>
            </div>

            <div className={s.mockShell}>
              {/* Sidebar */}
              <div className={s.mockSide}>
                <div className={s.msLogo}>A</div>
                <div className={`${s.msIco} ${s.msIcoActive}`}>
                  <svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" /><rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" /></svg>
                </div>
                <div className={s.msIco}>
                  <svg viewBox="0 0 16 16"><path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h12v2H2z" /></svg>
                </div>
                <div className={s.msIco}>
                  <svg viewBox="0 0 16 16"><path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" /></svg>
                </div>
                <div className={s.msDiv} />
                <div className={s.msIco}>
                  <svg viewBox="0 0 16 16"><path d="M14 2H2v12h12V2zM4 4h3v3H4zm5 0h3v3H9zM4 9h8v3H4z" /></svg>
                </div>
                <div className={s.msIco}>
                  <svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" /><path d="M3 14c0-3 2-5 5-5s5 2 5 5" /></svg>
                </div>
                <div className={s.msBottom}>
                  <div className={s.msDiv} />
                  <div className={s.msIco}>
                    <svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4v3l2 2" /></svg>
                  </div>
                  <div className={s.msAvatar}>SK</div>
                </div>
              </div>

              {/* Main */}
              <div className={s.mockBody}>
                <div className={s.mockTop}>
                  <div className={s.mtEntity}><span className={s.mtDot} />Maple &amp; Co. Design</div>
                  <div className={s.mtSearch}><span style={{ marginRight: 6, opacity: 0.4 }}>&#128269;</span>Search transactions, clients...</div>
                  <div className={s.mtRight}>
                    <div className={s.mtBtn}>&#128276;</div>
                    <div className={s.mtBtn}>&#9881;</div>
                  </div>
                </div>
                <div className={s.mockPage}>
                  {/* Pulse brief */}
                  <div className={s.mpPulse}>
                    <div className={s.mpOrb} />
                    <div className={s.mpBrief}>
                      Your cash position is <span className={s.mpBriefPos}>strong</span>. <span className={s.mpBriefHl}>CAD $42,180</span> across 3 currencies. Revenue up <span className={s.mpBriefPos}>+12%</span> vs last month.
                    </div>
                    <div className={s.mpCurr}>
                      <div className={s.mpCurrItem}><span className={s.mpCurrCode}>CAD</span><span className={s.mpCurrBar} style={{ width: 48 }} /></div>
                      <div className={s.mpCurrItem}><span className={s.mpCurrCode}>USD</span><span className={s.mpCurrBar} style={{ width: 32, background: 'var(--ak-blue)' }} /><span className={`${s.mpCurrFx} ${s.fxChangeUp}`}>+0.12%</span></div>
                      <div className={s.mpCurrItem}><span className={s.mpCurrCode}>EUR</span><span className={s.mpCurrBar} style={{ width: 20, background: 'var(--ak-purple)' }} /><span className={`${s.mpCurrFx} ${s.fxChangeDn}`}>-0.08%</span></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className={s.mpStats}>
                    <div className={s.mpSt}><div className={s.mpStLabel}>Revenue</div><div className={s.mpStValue}>$18,420</div><div className={`${s.mpStTrend} ${s.mpStTrendUp}`}>{'\u25B2'} 12.3%</div></div>
                    <div className={s.mpSt}><div className={s.mpStLabel}>Expenses</div><div className={s.mpStValue}>$6,180</div><div className={`${s.mpStTrend} ${s.mpStTrendDn}`}>{'\u25B2'} 4.1%</div></div>
                    <div className={s.mpSt}><div className={s.mpStLabel}>Outstanding</div><div className={s.mpStValue}>$3,250</div><div className={`${s.mpStTrend} ${s.mpStTrendFlat}`}>2 invoices</div></div>
                    <div className={s.mpSt}><div className={s.mpStLabel}>Net Cash</div><div className={s.mpStValue}>$42,180</div><div className={`${s.mpStTrend} ${s.mpStTrendUp}`}>{'\u25B2'} 8.7%</div></div>
                  </div>

                  {/* Chart + Transactions */}
                  <div className={s.mpRow}>
                    <div className={s.mpChartCard}>
                      <div className={s.mpCardTitle}>Cash Flow &middot; 6 months</div>
                      <svg className={s.mpChartSvg} viewBox="0 0 460 90" fill="none" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ak-green)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--ak-green)" stopOpacity="0" /></linearGradient>
                          <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ak-red)" stopOpacity="0.15" /><stop offset="100%" stopColor="var(--ak-red)" stopOpacity="0" /></linearGradient>
                        </defs>
                        <path d="M0,68 C50,58 100,48 150,42 C200,36 250,52 300,30 C350,10 400,16 460,6 V90 H0Z" fill="url(#ig)" />
                        <path d="M0,68 C50,58 100,48 150,42 C200,36 250,52 300,30 C350,10 400,16 460,6" stroke="var(--ak-green)" strokeWidth="2" fill="none" />
                        <path d="M0,78 C50,75 100,72 150,70 C200,74 250,67 300,62 C350,64 400,60 460,55 V90 H0Z" fill="url(#eg)" />
                        <path d="M0,78 C50,75 100,72 150,70 C200,74 250,67 300,62 C350,64 400,60 460,55" stroke="var(--ak-red)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                        <circle cx="300" cy="30" r="3" fill="var(--ak-green)" /><circle cx="300" cy="30" r="6" fill="var(--ak-green)" opacity="0.2" />
                        <circle cx="460" cy="6" r="3" fill="var(--ak-green)" /><circle cx="460" cy="6" r="6" fill="var(--ak-green)" opacity="0.2" />
                      </svg>
                    </div>
                    <div className={s.mpTxnCard}>
                      <div className={s.mpCardTitle}>Recent Transactions</div>
                      <div className={s.mpTxn}>
                        <div className={s.mpTxnIco} style={{ background: 'var(--ak-green-dim)', color: 'var(--ak-green)' }}>&#8599;</div>
                        <div className={s.mpTxnInfo}><div className={s.mpTxnName}>Stripe Payout</div><div className={s.mpTxnCat}>Revenue &middot; USD</div></div>
                        <div className={s.mpTxnAmt} style={{ color: 'var(--ak-green)' }}>+$4,200</div>
                      </div>
                      <div className={s.mpTxn}>
                        <div className={s.mpTxnIco} style={{ background: 'var(--ak-red-dim)', color: 'var(--ak-red)' }}>&#8601;</div>
                        <div className={s.mpTxnInfo}><div className={s.mpTxnName}>Adobe Creative Cloud</div><div className={s.mpTxnCat}>Software &middot; CAD</div></div>
                        <div className={s.mpTxnAmt} style={{ color: 'var(--ak-red)' }}>-$79.99</div>
                      </div>
                      <div className={s.mpTxn}>
                        <div className={s.mpTxnIco} style={{ background: 'var(--ak-blue-dim)', color: 'var(--ak-blue)' }}>&#8644;</div>
                        <div className={s.mpTxnInfo}><div className={s.mpTxnName}>Wise Transfer</div><div className={s.mpTxnCat}>EUR &rarr; CAD</div></div>
                        <div className={s.mpTxnAmt} style={{ color: 'var(--ak-blue)' }}>&euro;1,800</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className={s.featuresSection} id="features">
        <div className={s.container}>
          <div className={`${s.secLabel} ${s.reveal}`}>Features</div>
          <h2 className={`${s.secTitle} ${s.reveal}`}>
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
          <p className={`${s.secSub} ${s.reveal}`}>
            Built for solopreneurs who earn in dollars, pay in euros, and report in yen.
          </p>

          <div className={`${s.featGrid} ${s.staggerChildren}`}>
            {FEATURES.map((f) => (
              <div key={f.title} className={s.featCard} onMouseMove={trackMouse}>
                <div
                  className={s.featIco}
                  style={{ background: FEAT_COLORS[f.color].bg, color: FEAT_COLORS[f.color].color }}
                >
                  {f.icon}
                </div>
                <h3 className={s.featCardTitle}>{f.title}</h3>
                <p className={s.featCardDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SHOWCASE 1: Multi-Currency ═══ */}
      <section className={s.showcase}>
        <div className={s.container}>
          <div className={s.showcasePair}>
            <div className={`${s.scText} ${s.reveal}`}>
              <div className={s.scTag}>Multi-Currency</div>
              <h3 className={s.scTextTitle}>Think globally,<br />report locally</h3>
              <p className={s.scTextDesc}>Earn in USD, pay contractors in EUR, and file taxes in CAD. Exchange rates captured at transaction time. Your books always balance — in every currency.</p>
              <ul className={s.scList}>
                <li className={s.scListItem}><span className={s.scListDot} />Real-time rates from 40+ currencies</li>
                <li className={s.scListItem}><span className={s.scListDot} />Automatic base currency conversion</li>
                <li className={s.scListItem}><span className={s.scListDot} />Immutable historical FX preservation</li>
                <li className={s.scListItem}><span className={s.scListDot} />Multi-entity support for each business</li>
              </ul>
            </div>
            <div className={`${s.scVisual} ${s.reveal} ${s.revealDelay2}`}>
              <div className={s.scFx}>
                <div className={s.scFxHeader}>
                  <div className={s.scFxTitle}>Currency Overview</div>
                  <div className={s.scFxLive}>Live</div>
                </div>
                {[
                  { flag: '\u{1F1FA}\u{1F1F8}', pair: 'USD / CAD', full: 'US Dollar \u2192 Canadian Dollar', rate: '1.3542', change: '\u25B2 0.12%', up: true },
                  { flag: '\u{1F1EA}\u{1F1FA}', pair: 'EUR / CAD', full: 'Euro \u2192 Canadian Dollar', rate: '1.4891', change: '\u25BC 0.08%', up: false },
                  { flag: '\u{1F1EC}\u{1F1E7}', pair: 'GBP / CAD', full: 'British Pound \u2192 Canadian Dollar', rate: '1.7234', change: '\u25B2 0.24%', up: true },
                  { flag: '\u{1F1EF}\u{1F1F5}', pair: 'JPY / CAD', full: 'Japanese Yen \u2192 Canadian Dollar', rate: '0.0091', change: '\u25BC 0.15%', up: false },
                ].map((fx) => (
                  <div key={fx.pair} className={s.fxRow}>
                    <div className={s.fxFlag}>{fx.flag}</div>
                    <div className={s.fxInfo}><div className={s.fxPair}>{fx.pair}</div><div className={s.fxFull}>{fx.full}</div></div>
                    <div className={s.fxRate}><div className={s.fxVal}>{fx.rate}</div><div className={`${s.fxChange} ${fx.up ? s.fxChangeUp : s.fxChangeDn}`}>{fx.change}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SHOWCASE 2: Insights ═══ */}
      <section className={s.showcase}>
        <div className={s.container}>
          <div className={`${s.showcasePair} ${s.showcasePairFlip}`}>
            <div className={`${s.scText} ${s.reveal}`}>
              <div className={s.scTag}>Insights</div>
              <h3 className={s.scTextTitle}>Your finances,<br />interpreted beautifully</h3>
              <p className={s.scTextDesc}>The AI Pulse reads your financial data and tells you what matters — in plain language. No dashboards to decipher. No reports to generate. Just clarity.</p>
              <ul className={s.scList}>
                <li className={s.scListItem}><span className={s.scListDot} />Natural language financial summaries</li>
                <li className={s.scListItem}><span className={s.scListDot} />Proactive alerts for anomalies</li>
                <li className={s.scListItem}><span className={s.scListDot} />Cash flow forecasting and trends</li>
                <li className={s.scListItem}><span className={s.scListDot} />Pattern learning that improves daily</li>
              </ul>
            </div>
            <div className={`${s.scVisual} ${s.reveal} ${s.revealDelay2}`}>
              <div className={s.scAi}>
                <div className={s.scAiHeader}>
                  <div className={s.scAiOrb} />
                  <div className={s.scAiTitle}>AI Pulse</div>
                  <div className={s.scAiBadge}>Intelligent</div>
                </div>
                <div className={s.aiCard}>
                  <div className={s.aiCardText}>Your <span className={s.aiCardHl}>net cash position</span> is strong at <span className={s.aiCardPos}>CAD $42,180</span>. Revenue grew <span className={s.aiCardPos}>+12%</span> this month, driven by a <span className={s.aiCardHl}>new US client</span> paying in USD.</div>
                  <div className={s.aiCardMeta}><span>Confidence</span><div className={s.aiConf}><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={s.aiConfBar} /></div></div>
                </div>
                <div className={s.aiCard}>
                  <div className={s.aiCardText}><span className={s.aiCardWarn}>Heads up:</span> Your <span className={s.aiCardHl}>Adobe subscription</span> renewed at <span className={s.aiCardWarn}>$79.99/mo</span> — <span className={s.aiCardWarn}>15% higher</span> than last year. Worth reviewing?</div>
                  <div className={s.aiCardMeta}><span>Confidence</span><div className={s.aiConf}><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={s.aiConfBar} /><i className={s.aiConfBar} /></div></div>
                </div>
                <div className={s.aiCard}>
                  <div className={s.aiCardText}><span className={s.aiCardHl}>2 invoices</span> totalling <span className={s.aiCardPos}>$3,250 USD</span> are due in 7 days. Based on history, expect payment within <span className={s.aiCardHl}>3 business days</span>.</div>
                  <div className={s.aiCardMeta}><span>Confidence</span><div className={s.aiConf}><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /><i className={`${s.aiConfBar} ${s.aiConfBarOn}`} /></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SHOWCASE 3: Invoicing ═══ */}
      <section className={s.showcase}>
        <div className={s.container}>
          <div className={s.showcasePair}>
            <div className={`${s.scText} ${s.reveal}`}>
              <div className={s.scTag}>Invoicing</div>
              <h3 className={s.scTextTitle}>Get paid faster,<br />in any currency</h3>
              <p className={s.scTextDesc}>Create polished invoices that reflect your brand. Send in your client&apos;s currency, track status live, and let the system handle every journal entry.</p>
              <ul className={s.scList}>
                <li className={s.scListItem}><span className={s.scListDot} />Professional templates with your branding</li>
                <li className={s.scListItem}><span className={s.scListDot} />Multi-currency invoicing with auto FX</li>
                <li className={s.scListItem}><span className={s.scListDot} />Automatic payment tracking and reminders</li>
                <li className={s.scListItem}><span className={s.scListDot} />Journal entries created on payment</li>
              </ul>
            </div>
            <div className={`${s.scVisual} ${s.reveal} ${s.revealDelay2}`}>
              <div className={s.scInv}>
                <div className={s.scInvHeader}>
                  <div>
                    <div className={s.scInvTitle}>Invoice #INV-2024-087</div>
                    <div className={s.scInvNum}>Feb 1, 2026 &middot; Due: Mar 1, 2026</div>
                  </div>
                  <div className={`${s.scInvBadge} ${s.scInvBadgePaid}`}>Paid</div>
                </div>
                <div className={s.invLine}><span className={s.invLineLab}>Client</span><span className={s.invLineVal} style={{ fontFamily: 'var(--font-sans)' }}>Vercel Inc.</span></div>
                <div className={s.invLine}><span className={s.invLineLab}>Brand Strategy Consulting</span><span className={s.invLineVal}>$3,500.00</span></div>
                <div className={s.invLine}><span className={s.invLineLab}>UI/UX Design Sprint (5 days)</span><span className={s.invLineVal}>$4,500.00</span></div>
                <div className={s.invLine}><span className={s.invLineLab}>Design System Documentation</span><span className={s.invLineVal}>$2,000.00</span></div>
                <div className={s.invLine}><span className={s.invLineLab}>Tax (HST 13%)</span><span className={s.invLineVal}>$1,300.00</span></div>
                <div className={s.invTotal}><span>Total (USD)</span><span className={s.invTotalVal}>$11,300.00</span></div>
                <div className={s.invFooter}><span className={s.invFooterFx}>Converted: CAD $15,306 @ 1.3545</span><span className={s.invFooterStatus}>Payment received</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ NUMBERS ═══ */}
      <section className={s.numbers}>
        <div className={s.container}>
          <div ref={numbersRef} className={`${s.numbersGrid} ${s.staggerChildren}`}>
            <div><div className={s.numItemVal}>{counters[0]}<span className={s.numUnit}>+</span></div><div className={s.numItemLabel}>Currencies supported</div></div>
            <div><div className={s.numItemVal}>{counters[1]}<span className={s.numUnit}>hrs</span></div><div className={s.numItemLabel}>Saved per month</div></div>
            <div><div className={s.numItemVal}>{counters[2]}<span className={s.numUnit}>%</span></div><div className={s.numItemLabel}>Auto-reconciliation accuracy</div></div>
            <div><div className={s.numItemVal}>{counters[3]}</div><div className={s.numItemLabel}>Accounting degrees needed</div></div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className={s.howSection} id="how">
        <div className={s.container}>
          <div className={`${s.secLabel} ${s.reveal}`}>How It Works</div>
          <h2 className={`${s.secTitle} ${s.reveal}`}>Three steps to financial zen</h2>
          <p className={`${s.secSub} ${s.reveal}`}>No accountant needed. No spreadsheets. No stress.</p>

          <div className={`${s.howSteps} ${s.staggerChildren}`}>
            <div className={s.howStep}>
              <div className={s.howNum}>1</div>
              <h3 className={s.howStepTitle}>Connect your accounts</h3>
              <p className={s.howStepDesc}>Link bank accounts and credit cards, or import statements via CSV and PDF. We support major banks worldwide.</p>
            </div>
            <div className={s.howStep}>
              <div className={s.howNum}>2</div>
              <h3 className={s.howStepTitle}>AI organizes everything</h3>
              <p className={s.howStepDesc}>Transactions categorized, currencies converted, books balanced — all automatically. The AI learns and improves every day.</p>
            </div>
            <div className={s.howStep}>
              <div className={s.howNum}>3</div>
              <h3 className={s.howStepTitle}>See your complete picture</h3>
              <p className={s.howStepDesc}>One dashboard with cash flow, invoices, expenses, and AI insights. Tax season becomes a non-event.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className={s.testSection} id="voices">
        <div className={s.container}>
          <div className={`${s.secLabel} ${s.reveal}`}>Voices</div>
          <h2 className={`${s.secTitle} ${s.reveal}`}>From our early access community</h2>
          <p className={`${s.secSub} ${s.reveal}`}>Real feedback from solopreneurs who beta-tested Akount.</p>

          <div className={`${s.testGrid} ${s.staggerChildren}`}>
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`${s.testCard} ${i === 1 ? s.testCardMiddle : ''}`}>
                <div className={s.testStars}>{'\u2733\u2733\u2733\u2733\u2733'}</div>
                <div className={s.testQuote}>{t.quote}</div>
                <div className={s.testAuthor}>
                  <div className={s.testAvatar} style={{ background: t.gradient }}>{t.initials}</div>
                  <div>
                    <div className={s.testName}>{t.name}</div>
                    <div className={s.testRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className={s.finalSection} id="final">
        <div className={s.container}>
          <div className={`${s.finalOrbWrap} ${s.reveal}`}>
            <div className={s.finalOrb} />
            <div className={`${s.finalRing} ${s.finalRing1}`} />
            <div className={`${s.finalRing} ${s.finalRing2}`} />
            <div className={`${s.finalRing} ${s.finalRing3}`} />
          </div>
          <h2 className={`${s.finalTitle} ${s.reveal} ${s.revealDelay1}`}>Ready for financial clarity?</h2>
          <p className={`${s.secSub} ${s.finalSub} ${s.reveal} ${s.revealDelay2}`}>
            Join solopreneurs worldwide who are taking back<br />control of their financial story.
          </p>
          {isSignedIn ? (
            <div className={`${s.reveal} ${s.revealDelay3}`}>
              <Link href="/overview" className={s.dashboardCta}>Go to Dashboard &rarr;</Link>
            </div>
          ) : (
            <>
              <form className={`${s.finalForm} ${s.reveal} ${s.revealDelay3}`} onSubmit={handleWaitlist}>
                <input type="email" name="email" className={s.heroInput} placeholder="you@company.com" required aria-label="Email" />
                <button
                  type="submit"
                  className={`${s.heroBtn} ${formState === 'success' ? s.heroBtnSuccess : ''}`}
                  disabled={formState === 'submitting'}
                  style={formState === 'submitting' ? { opacity: 0.7 } : undefined}
                >
                  {formState === 'submitting'
                    ? 'Joining...'
                    : formState === 'success'
                      ? formMessage
                      : 'Join the Waitlist'}
                </button>
              </form>
              <p className={`${s.finalNote} ${s.reveal} ${s.revealDelay4}`}>Free early access &middot; No credit card &middot; Cancel anytime</p>
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerInner}>
            <div className={s.footerLogo}>
              <div className={s.footerLogoMark}>A</div>
              <span className={s.footerLogoText}>Akount</span>
            </div>
            <div className={s.footerLinks}>
              <button className={s.footerLink} onClick={() => scrollTo('features')}>Features</button>
              <button className={s.footerLink} onClick={() => scrollTo('how')}>How It Works</button>
              <span className={s.footerLink}>Privacy</span>
              <span className={s.footerLink}>Terms</span>
              <a href="mailto:hello@akount.app" className={s.footerLink}>Contact</a>
            </div>
          </div>
          <div className={s.footerCopy}>&copy; 2026 Akount. Built for solopreneurs who think globally.</div>
        </div>
      </footer>
    </>
  )
}
