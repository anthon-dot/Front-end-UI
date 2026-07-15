<template>
  <div class="page">
    <header class="navbar" :class="{ open: menuOpen }">
      <router-link to="/" class="logo" @click="closeMenu">
        <span class="brand-mark">RM</span>
        <span class="title">Manticao Market Rentals</span>
      </router-link>

      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-label="Toggle navigation"
        @click="menuOpen = !menuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="nav-links" aria-label="Primary navigation">
        <a href="#services" @click="closeMenu">Services</a>
        <a href="#why" @click="closeMenu">Why us</a>
        <a href="#testimonials" @click="closeMenu">Stories</a>
        <a href="#faq" @click="closeMenu">FAQ</a>
        <router-link to="/login" @click="closeMenu">Log in</router-link>
        <router-link to="/create-account" class="nav-cta" @click="closeMenu">
          Create Account
        </router-link>
      </nav>
    </header>

    <main>
      <section class="hero section-reveal">
        <div class="hero-copy">
          <div class="tabs" aria-label="Market rental workflows">
            <button class="tab active" type="button">Stall Rentals</button>
            <button class="tab" type="button">Applications</button>
          </div>

          <p class="eyebrow">Public market leasing, simplified</p>

          <h1 class="hero-title">
            A modern operating layer for market stall rentals.
          </h1>

          <p class="hero-subtitle">
            Browse available stalls, apply online, track approvals, and keep
            rental records moving through one elegant portal built for vendors
            and public market teams.
          </p>

          <div class="hero-actions">
            <router-link to="/stalls" class="btn primary">View Stall List</router-link>
            <router-link to="/create-account" class="btn secondary">Start Application</router-link>
          </div>
        </div>

        <div class="hero-stage" aria-label="Rental management product preview">
          <div class="stage-backdrop"></div>

          <div class="product-shell">
            <div class="product-topbar">
              <span></span>
              <span></span>
              <span></span>
              <strong>Market Operations</strong>
            </div>

            <div class="product-grid">
              <div class="product-media" :style="leftCard">
                <div>
                  <span>Available now</span>
                  <strong>Stall A-14</strong>
                </div>
              </div>

              <div class="product-panel">
                <p>Application pipeline</p>
                <div class="pipeline">
                  <span style="width: 72%"></span>
                </div>
                <div class="pipeline-meta">
                  <strong>3 offices synced</strong>
                  <small>Review in progress</small>
                </div>
              </div>
            </div>
          </div>

          <div class="floating-note note-one">
            <span class="status-dot"></span>
            <div>
              <strong>Payment recorded</strong>
              <small>Updated billing balance</small>
            </div>
          </div>

          <div class="floating-note note-two">
            <strong>{{ displayStats[2].value }}{{ displayStats[2].suffix }}</strong>
            <small>records visible from one dashboard</small>
          </div>

          <div class="floating-flow">
            <div v-for="step in workflow" :key="step.title" class="flow-item">
              <span>{{ step.id }}</span>
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.text }}</p>
              </div>
            </div>
            <router-link to="/login" class="panel-link">Track your application</router-link>
          </div>
        </div>
      </section>

      <section class="stats-section section-reveal" aria-label="Platform statistics">
        <div v-for="stat in displayStats" :key="stat.label" class="stat-item">
          <strong>{{ stat.prefix }}{{ stat.value }}{{ stat.suffix }}</strong>
          <span>{{ stat.label }}</span>
        </div>
      </section>

      <section id="services" class="content-section split-section section-reveal">
        <div class="section-heading">
          <p class="eyebrow">Services</p>
          <h2>Designed for every handoff from inquiry to occupancy.</h2>
          <p>
            A calmer, more transparent workflow for applicants, stakeholders,
            and reviewing offices without changing the existing process.
          </p>
        </div>

        <div class="feature-stack">
          <article v-for="feature in features" :key="feature.title" class="feature-row">
            <span class="feature-index">{{ feature.icon }}</span>
            <div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.text }}</p>
            </div>
          </article>
        </div>
      </section>

      <section id="why" class="why-section section-reveal">
        <div class="why-visual">
          <div class="signal-line"></div>
          <div v-for="benefit in benefits" :key="benefit.title" class="benefit">
            <span></span>
            <div>
              <strong>{{ benefit.title }}</strong>
              <p>{{ benefit.text }}</p>
            </div>
          </div>
        </div>

        <div class="why-copy">
          <p class="eyebrow">Why choose us</p>
          <h2>Premium UX for a practical public market workflow.</h2>
          <p>
            Applicants get clear next steps. Offices get structured review
            surfaces. Records stay easier to scan from application to billing.
          </p>
          <router-link to="/login" class="btn primary">Open Dashboard</router-link>
        </div>
      </section>

      <section id="testimonials" class="content-section section-reveal">
        <div class="section-heading centered">
          <p class="eyebrow">Community stories</p>
          <h2>Clearer updates for vendors and offices.</h2>
        </div>

        <div class="testimonial-grid">
          <article v-for="item in testimonials" :key="item.name" class="testimonial-card">
            <p>"{{ item.quote }}"</p>
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.role }}</span>
            </div>
          </article>
        </div>
      </section>

      <section id="faq" class="faq-section section-reveal">
        <div class="section-heading compact">
          <p class="eyebrow">FAQ</p>
          <h2>Questions before you apply?</h2>
        </div>

        <div class="faq-list">
          <article v-for="(item, index) in faqs" :key="item.question" class="faq-item">
            <button type="button" @click="toggleFaq(index)">
              <span>{{ item.question }}</span>
              <strong>{{ activeFaq === index ? '-' : '+' }}</strong>
            </button>
            <Transition name="accordion">
              <p v-if="activeFaq === index">{{ item.answer }}</p>
            </Transition>
          </article>
        </div>
      </section>

      <section class="cta-section section-reveal">
        <div>
          <p class="eyebrow">Ready to begin?</p>
          <h2>Find a stall or continue your application today.</h2>
        </div>
        <div class="cta-actions">
          <router-link to="/stalls" class="btn primary">Browse Stalls</router-link>
          <router-link to="/login" class="btn secondary">Sign In</router-link>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div>
        <router-link to="/" class="footer-brand">
          <span class="brand-mark">RM</span>
          Manticao Market Rentals
        </router-link>
        <p>Modern rental management for public market operations.</p>
      </div>
      <nav>
        <a href="#services">Services</a>
        <a href="#why">Why us</a>
        <a href="#faq">FAQ</a>
        <router-link to="/login">Log in</router-link>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const menuOpen = ref(false)
const activeFaq = ref(0)
const progress = ref(0)
let animationFrame = 0

const leftCard = {
  backgroundImage: "url('/market-stall.png')"
}

const workflow = [
  {
    id: '01',
    title: 'Find a stall',
    text: 'Review available spaces and choose a location that fits your business.'
  },
  {
    id: '02',
    title: 'Submit requirements',
    text: 'Create an account and complete the application flow online.'
  },
  {
    id: '03',
    title: 'Track progress',
    text: 'Monitor status updates from review through approval.'
  }
]

const stats = [
  { label: 'Application steps organized', value: 4, suffix: '', prefix: '' },
  { label: 'Core offices connected', value: 3, suffix: '', prefix: '' },
  { label: 'Rental records in one view', value: 100, suffix: '%', prefix: '' },
  { label: 'Always accessible portal', value: 24, suffix: '/7', prefix: '' }
]

const features = [
  {
    icon: '01',
    title: 'Online Applications',
    text: 'Guide applicants through account creation, requirements, and status tracking.'
  },
  {
    icon: '02',
    title: 'Stall Discovery',
    text: 'Present available stalls with practical details so vendors can make faster decisions.'
  },
  {
    icon: '03',
    title: 'Billing Visibility',
    text: 'Keep rental billing and payment records easier to scan from dashboard views.'
  },
  {
    icon: '04',
    title: 'Review Workflow',
    text: 'Support market supervisor, BPLO, endorsing, and treasurer handoffs.'
  }
]

const benefits = [
  {
    title: 'Less guesswork',
    text: 'Applicants can see what to do next instead of waiting for manual updates.'
  },
  {
    title: 'Cleaner records',
    text: 'Dashboards, tables, and progress views keep important rental information organized.'
  },
  {
    title: 'Faster office review',
    text: 'Role-based dashboards help each office focus on the applications that need action.'
  }
]

const testimonials = [
  {
    quote: 'The process feels clearer because applicants can track what stage they are in.',
    name: 'Market Office Staff',
    role: 'Application review'
  },
  {
    quote: 'It is easier to see available stalls before starting the application.',
    name: 'Local Vendor',
    role: 'Stall applicant'
  },
  {
    quote: 'Billing and payment screens help reduce back-and-forth when checking records.',
    name: 'Treasury User',
    role: 'Collections'
  }
]

const faqs = [
  {
    question: 'Can I browse stalls before creating an account?',
    answer: 'Yes. Use the stall list to review available spaces, then create an account when you are ready to apply.'
  },
  {
    question: 'Where do I check my application status?',
    answer: 'After signing in, the system routes you to the right dashboard or progress page based on your role and application status.'
  },
  {
    question: 'Does this change the existing office workflow?',
    answer: 'No. It keeps the same application and review structure while making the frontend clearer and easier to use.'
  }
]

const displayStats = computed(() =>
  stats.map((stat) => ({
    ...stat,
    value: Math.round(stat.value * progress.value)
  }))
)

function closeMenu() {
  menuOpen.value = false
}

function toggleFaq(index) {
  activeFaq.value = activeFaq.value === index ? -1 : index
}

function animateStats() {
  const start = performance.now()
  const duration = 1100

  function tick(now) {
    const elapsed = Math.min((now - start) / duration, 1)
    progress.value = 1 - Math.pow(1 - elapsed, 3)

    if (elapsed < 1) {
      animationFrame = requestAnimationFrame(tick)
    }
  }

  animationFrame = requestAnimationFrame(tick)
}

onMounted(() => {
  animateStats()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  overflow-x: hidden;
  color: #0b1220;
  background:
    linear-gradient(120deg, rgba(37, 99, 235, 0.16) 0%, rgba(37, 99, 235, 0) 28%),
    linear-gradient(250deg, rgba(20, 184, 166, 0.18) 0%, rgba(20, 184, 166, 0) 31%),
    linear-gradient(180deg, #fbfdff 0%, #f4f7fb 44%, #ffffff 100%);
}

.page::before {
  position: fixed;
  inset: 0;
  pointer-events: none;
  content: "";
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.72), transparent 72%);
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: min(1180px, calc(100% - 36px));
  margin: 14px auto 0;
  padding: 10px 10px 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 18px 70px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(22px);
}

.logo,
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: #0b1220;
  font-weight: 900;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #111827, #2563eb 54%, #0f766e);
  color: #ffffff;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.26);
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-links a,
.footer nav a {
  color: #475467;
  font-weight: 760;
  text-decoration: none;
}

.nav-links a {
  padding: 10px 12px;
  border-radius: 14px;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.nav-links a:hover {
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  transform: translateY(-1px);
}

.nav-links .nav-cta {
  margin-left: 4px;
  background: #0b1220;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
}

.menu-toggle {
  display: none;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.84);
}

.menu-toggle span {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: #0b1220;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.navbar.open .menu-toggle span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.navbar.open .menu-toggle span:nth-child(2) {
  opacity: 0;
}

.navbar.open .menu-toggle span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.hero,
.content-section,
.why-section,
.faq-section,
.cta-section,
.stats-section,
.footer {
  width: min(1180px, calc(100% - 36px));
  margin: 0 auto;
}

.section-reveal {
  animation: section-enter 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr);
  gap: clamp(32px, 5vw, 70px);
  align-items: center;
  min-height: calc(100vh - 92px);
  padding: clamp(64px, 8vw, 112px) 0 72px;
}

.hero::after {
  position: absolute;
  right: -14vw;
  bottom: 8%;
  width: 56vw;
  height: 42%;
  pointer-events: none;
  content: "";
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.16), rgba(20, 184, 166, 0.12), transparent);
  filter: blur(36px);
  transform: skewY(-10deg);
}

.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 790px;
}

.tabs {
  display: inline-flex;
  gap: 6px;
  margin-bottom: 26px;
  padding: 5px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
}

.tab {
  min-height: 34px;
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #475467;
  font-size: 0.84rem;
  font-weight: 850;
}

.tab.active {
  background: #0b1220;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
}

.eyebrow {
  margin: 0 0 14px;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-title,
.section-heading h2,
.why-copy h2,
.cta-section h2 {
  margin: 0;
  color: #0b1220;
  letter-spacing: 0;
}

.hero-title {
  max-width: 880px;
  font-size: clamp(4rem, 9.6vw, 8.8rem);
  font-weight: 950;
  line-height: 0.88;
}

.hero-subtitle {
  max-width: 670px;
  margin: 30px 0 0;
  color: #475467;
  font-size: clamp(1.05rem, 1.8vw, 1.28rem);
  line-height: 1.8;
}

.hero-actions,
.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 13px 20px;
  border-radius: 15px;
  font-weight: 850;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.btn:hover {
  transform: translateY(-2px) scale(1.01);
}

.btn:active {
  transform: translateY(0) scale(0.98);
}

.btn.primary {
  background: linear-gradient(135deg, #0b1220, #2563eb 58%, #0f766e);
  color: #ffffff;
  box-shadow: 0 20px 42px rgba(37, 99, 235, 0.28);
}

.btn.secondary {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.72);
  color: #0b1220;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
}

.hero-stage {
  position: relative;
  z-index: 2;
  min-height: 620px;
  perspective: 1100px;
}

.stage-backdrop {
  position: absolute;
  inset: 10% -6% auto 4%;
  height: 76%;
  border-radius: 46px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(20, 184, 166, 0.10)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.18));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 48px 110px rgba(15, 23, 42, 0.16);
  transform: rotate(-5deg) skewY(-2deg);
}

.product-shell {
  position: absolute;
  top: 70px;
  right: 14px;
  width: min(96%, 560px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.70);
  box-shadow: 0 46px 120px rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(24px);
  transform: rotateY(-12deg) rotateX(5deg) rotateZ(-2deg);
  animation: float-main 7s ease-in-out infinite;
}

.product-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.product-topbar span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #cbd5e1;
}

.product-topbar span:nth-child(1) {
  background: #fb7185;
}

.product-topbar span:nth-child(2) {
  background: #fbbf24;
}

.product-topbar span:nth-child(3) {
  background: #34d399;
}

.product-topbar strong {
  margin-left: auto;
  color: #475467;
  font-size: 0.84rem;
}

.product-grid {
  display: grid;
  grid-template-columns: 1.04fr 0.96fr;
  gap: 16px;
  padding: 18px;
}

.product-media {
  min-height: 300px;
  overflow: hidden;
  border-radius: 24px;
  background-size: cover;
  background-position: center;
}

.product-media > div {
  display: flex;
  height: 100%;
  min-height: 300px;
  flex-direction: column;
  justify-content: flex-end;
  padding: 18px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.68));
  color: #ffffff;
}

.product-media span,
.floating-note small,
.product-panel p,
.pipeline-meta small {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.product-media strong {
  margin-top: 4px;
  font-size: 1.7rem;
}

.product-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 300px;
  padding: 18px;
  border-radius: 24px;
  background:
    linear-gradient(150deg, rgba(37, 99, 235, 0.12), rgba(20, 184, 166, 0.08)),
    rgba(248, 250, 252, 0.86);
}

.product-panel p {
  margin: 0 0 18px;
  color: #475467;
  text-transform: uppercase;
}

.pipeline {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.09);
}

.pipeline span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #14b8a6);
}

.pipeline-meta {
  display: grid;
  gap: 4px;
  margin-top: 18px;
}

.pipeline-meta strong {
  color: #0b1220;
}

.pipeline-meta small {
  color: #667085;
}

.floating-note,
.floating-flow {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.62);
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(22px);
}

.floating-note {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 20px;
  padding: 14px 16px;
}

.floating-note strong,
.floating-flow strong {
  display: block;
  color: #0b1220;
}

.floating-note small,
.floating-flow p {
  color: #667085;
}

.note-one {
  top: 26px;
  left: 28px;
  animation: float-soft 6s ease-in-out infinite;
}

.note-two {
  right: 0;
  bottom: 112px;
  display: grid;
  min-width: 190px;
  animation: float-soft 6.5s ease-in-out 0.8s infinite;
}

.note-two strong {
  font-size: 2rem;
  line-height: 1;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #16a34a;
  box-shadow: 0 0 0 8px rgba(22, 163, 74, 0.12);
}

.floating-flow {
  left: 0;
  bottom: 22px;
  width: min(430px, 82%);
  border-radius: 26px;
  padding: 18px;
  animation: float-soft 7.5s ease-in-out 0.35s infinite;
}

.flow-item {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.flow-item:first-child {
  padding-top: 0;
}

.flow-item span,
.feature-index {
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 950;
}

.flow-item p {
  margin: 3px 0 0;
  line-height: 1.45;
}

.panel-link {
  display: inline-flex;
  margin-top: 14px;
  color: #2563eb;
  font-weight: 850;
  text-decoration: none;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 10px 0 84px;
}

.stat-item {
  padding: 10px 26px;
  border-left: 1px solid rgba(148, 163, 184, 0.24);
}

.stat-item:first-child {
  border-left: 0;
}

.stat-item strong {
  display: block;
  color: #0b1220;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1;
}

.stat-item span {
  display: block;
  max-width: 170px;
  margin-top: 10px;
  color: #667085;
  font-weight: 760;
  line-height: 1.45;
}

.content-section,
.faq-section {
  padding: clamp(70px, 9vw, 118px) 0;
}

.split-section {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(34px, 6vw, 92px);
  align-items: start;
}

.section-heading {
  max-width: 760px;
}

.section-heading.centered {
  max-width: 740px;
  margin: 0 auto 42px;
  text-align: center;
}

.section-heading.compact {
  max-width: 560px;
}

.section-heading h2,
.why-copy h2,
.cta-section h2 {
  font-size: clamp(2.35rem, 5.4vw, 4.6rem);
  font-weight: 950;
  line-height: 0.98;
}

.section-heading p,
.why-copy p,
.feature-row p,
.benefit p,
.testimonial-card span,
.footer p,
.faq-item p {
  color: #667085;
  line-height: 1.7;
}

.section-heading p,
.why-copy p {
  margin: 22px 0 0;
  font-size: 1.06rem;
}

.feature-stack {
  display: grid;
  gap: 0;
  border-top: 1px solid rgba(148, 163, 184, 0.22);
}

.feature-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 22px;
  padding: 28px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.feature-row:hover {
  border-color: rgba(37, 99, 235, 0.36);
  transform: translateX(8px);
}

.feature-row h3 {
  margin: 0;
  color: #0b1220;
  font-size: clamp(1.18rem, 2vw, 1.5rem);
}

.feature-row p {
  max-width: 640px;
  margin: 9px 0 0;
}

.feature-index {
  padding-top: 5px;
}

.why-section {
  display: grid;
  grid-template-columns: 1fr 0.92fr;
  gap: clamp(36px, 6vw, 82px);
  align-items: center;
  padding: clamp(72px, 9vw, 124px) 0;
}

.why-visual {
  position: relative;
  display: grid;
  gap: 18px;
  padding: 36px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 34px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.13), rgba(20, 184, 166, 0.08)),
    rgba(255, 255, 255, 0.66);
  box-shadow: 0 44px 110px rgba(15, 23, 42, 0.13);
  backdrop-filter: blur(22px);
}

.signal-line {
  position: absolute;
  top: 54px;
  bottom: 54px;
  left: 51px;
  width: 2px;
  background: linear-gradient(180deg, #2563eb, #14b8a6);
  opacity: 0.34;
}

.benefit {
  position: relative;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 18px;
  padding: 18px 0;
}

.benefit > span {
  width: 14px;
  height: 14px;
  margin-top: 6px;
  border: 3px solid #ffffff;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.10);
}

.benefit strong {
  color: #0b1220;
  font-size: 1.08rem;
}

.benefit p {
  margin: 7px 0 0;
}

.why-copy .btn {
  margin-top: 30px;
}

.testimonial-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr 1.05fr;
  gap: 18px;
}

.testimonial-card {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 26px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 252, 0.66));
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.testimonial-card:nth-child(2) {
  transform: translateY(34px);
}

.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 34px 100px rgba(15, 23, 42, 0.13);
}

.testimonial-card:nth-child(2):hover {
  transform: translateY(24px);
}

.testimonial-card p {
  margin: 0;
  color: #344054;
  font-size: 1.08rem;
  line-height: 1.72;
}

.testimonial-card strong,
.testimonial-card span {
  display: block;
}

.testimonial-card strong {
  color: #0b1220;
}

.faq-section {
  display: grid;
  grid-template-columns: 0.72fr 1fr;
  gap: clamp(30px, 5vw, 70px);
}

.faq-list {
  display: grid;
  gap: 8px;
  border-top: 1px solid rgba(148, 163, 184, 0.22);
}

.faq-item {
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.faq-item button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 0;
  border: 0;
  background: transparent;
  color: #0b1220;
  text-align: left;
  font-weight: 880;
}

.faq-item button strong {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.09);
  color: #2563eb;
}

.faq-item p {
  margin: 0;
  padding: 0 52px 24px 0;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.cta-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 36px;
  padding: clamp(34px, 6vw, 58px);
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 36px;
  background:
    linear-gradient(120deg, rgba(37, 99, 235, 0.16), rgba(20, 184, 166, 0.10)),
    rgba(255, 255, 255, 0.72);
  box-shadow: 0 36px 100px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(22px);
}

.cta-section .eyebrow {
  margin-bottom: 12px;
}

.cta-actions {
  flex: 0 0 auto;
  margin-top: 0;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 56px 0;
}

.footer p {
  margin: 12px 0 0;
}

.footer nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16px;
}

@keyframes section-enter {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float-main {
  0%,
  100% {
    transform: rotateY(-12deg) rotateX(5deg) rotateZ(-2deg) translateY(0);
  }
  50% {
    transform: rotateY(-12deg) rotateX(5deg) rotateZ(-2deg) translateY(-12px);
  }
}

@keyframes float-soft {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 1100px) {
  .hero,
  .split-section,
  .why-section,
  .faq-section {
    grid-template-columns: 1fr;
  }

  .hero {
    min-height: auto;
  }

  .hero-stage {
    min-height: 650px;
  }

  .stats-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 26px 0;
  }

  .stat-item:nth-child(odd) {
    border-left: 0;
  }
}

@media (max-width: 760px) {
  .navbar {
    align-items: center;
    flex-wrap: wrap;
    width: min(100% - 24px, 1180px);
    margin-top: 10px;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .nav-links {
    display: grid;
    width: 100%;
    max-height: 0;
    grid-template-columns: 1fr;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.28s ease, opacity 0.18s ease, padding 0.18s ease;
  }

  .navbar.open .nav-links {
    max-height: 430px;
    padding-top: 8px;
    opacity: 1;
  }

  .nav-links a {
    width: 100%;
  }

  .nav-links .nav-cta {
    margin-left: 0;
  }

  .hero,
  .content-section,
  .why-section,
  .faq-section,
  .cta-section,
  .stats-section,
  .footer {
    width: min(100% - 28px, 1180px);
  }

  .hero {
    padding-top: 54px;
  }

  .hero-title {
    font-size: clamp(3.1rem, 16vw, 5.1rem);
  }

  .hero-actions,
  .cta-actions,
  .btn {
    width: 100%;
  }

  .hero-stage {
    min-height: auto;
    perspective: none;
  }

  .stage-backdrop,
  .note-one,
  .note-two {
    display: none;
  }

  .product-shell,
  .floating-flow {
    position: relative;
    inset: auto;
    width: 100%;
    transform: none;
    animation: none;
  }

  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-media,
  .product-media > div,
  .product-panel {
    min-height: 240px;
  }

  .floating-flow {
    margin-top: 16px;
  }

  .stats-section,
  .testimonial-grid {
    grid-template-columns: 1fr;
  }

  .stat-item {
    border-left: 0;
    border-top: 1px solid rgba(148, 163, 184, 0.24);
    padding: 22px 0;
  }

  .stat-item:first-child {
    border-top: 0;
  }

  .feature-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .why-visual {
    padding: 24px;
  }

  .signal-line {
    display: none;
  }

  .testimonial-card:nth-child(2),
  .testimonial-card:nth-child(2):hover {
    transform: none;
  }

  .cta-section,
  .footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .footer nav {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .title {
    max-width: 200px;
  }

  .tabs {
    width: 100%;
  }

  .tab {
    flex: 1 1 auto;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
