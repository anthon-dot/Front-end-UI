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
  backgroundImage: "url('/market-stall.webp')"
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

<style scoped src="./Landing.css"></style>
