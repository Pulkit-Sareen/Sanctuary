import { Link } from 'react-router-dom'
import { EmergencyExit } from '../components/EmergencyExit'
import {
  IconEyeOff,
  IconMic,
  IconScale,
  IconShieldLock,
  IconSupport,
  IconUsers,
} from '../components/Icons'

export function LandingPage() {
  return (
    <div className="animate-fade-in flex min-h-svh flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b border-[#e8e4df]/80 bg-[#faf9f7]/95 backdrop-blur-sm">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8"
          aria-label="Primary"
        >
          <Link
            to="/"
            className="font-heading text-xl font-semibold tracking-tight text-[#333333] transition hover:text-[#4a5568]"
          >
            Sanctuary
          </Link>

          <div className="order-3 flex w-full flex-1 justify-center gap-10 sm:order-none sm:w-auto">
            <a
              href="#"
              className="text-[15px] font-medium text-[#5a5a5a] transition hover:text-[#333333]"
            >
              Home
            </a>
            <a
              href="#resources"
              className="text-[15px] font-medium text-[#5a5a5a] transition hover:text-[#333333]"
            >
              Resources
            </a>
          </div>

          <EmergencyExit />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        {/* Hero */}
        <section className="animate-fade-in-up mb-20 text-center sm:mb-28">
          <h1 className="font-heading mb-5 text-4xl font-medium leading-tight tracking-tight text-[#333333] sm:text-5xl">
            You are in a safe space.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#5a5a5a] sm:text-xl">
            How can we support you today?
          </p>
        </section>

        {/* Main action cards */}
        <section
          className="mb-16 grid gap-6 sm:mb-20 md:grid-cols-2 md:gap-8"
          aria-labelledby="actions-heading"
        >
          <h2 id="actions-heading" className="sr-only">
            Main actions
          </h2>

          <article className="group flex flex-col rounded-[22px] border border-[#ebe6e1] bg-[#f5f3f0] p-8 shadow-[0_4px_24px_-4px_rgba(80,70,60,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-6px_rgba(80,70,60,0.12)] sm:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8eef9] text-[#5b7aab]">
              <IconMic className="h-7 w-7" />
            </div>
            <h3 className="font-heading mb-3 text-xl font-semibold text-[#333333]">
              Record Statement
            </h3>
            <p className="mb-8 flex-1 leading-relaxed text-[#5a5a5a]">
              Securely document your experience at your own pace. Your words are
              protected.
            </p>
            <Link
              to="/share"
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#afcbff]/90 px-5 py-3 text-sm font-medium text-[#2d3f5c] shadow-sm transition hover:bg-[#9ebef8] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a9fd4]"
            >
              Begin recording
              <span className="cta-arrow" aria-hidden>
                →
              </span>
            </Link>
          </article>

          <article
            id="resources"
            className="group flex flex-col rounded-[22px] border border-[#e5d8e8] bg-[#e9dff0] p-8 shadow-[0_4px_24px_-4px_rgba(100,80,110,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-6px_rgba(100,80,110,0.14)] sm:p-10"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#dfd0ea] text-[#6b4f7a]">
              <IconSupport className="h-7 w-7" />
            </div>
            <h3 className="font-heading mb-3 text-xl font-semibold text-[#333333]">
              Support Hub
            </h3>
            <p className="mb-8 flex-1 leading-relaxed text-[#5a5a5a]">
              Explore support, resources, and recovery tools designed for your
              journey.
            </p>
            <a
              href="#feature-grid"
              className="inline-flex items-center gap-2 self-start rounded-full bg-white/70 px-5 py-3 text-sm font-medium text-[#4a3f55] shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b89bc9]"
            >
              Browse resources
              <span className="cta-arrow" aria-hidden>
                →
              </span>
            </a>
          </article>
        </section>

        {/* Trust strip */}
        <section
          className="animate-delay-200 animate-fade-in-up mb-20 rounded-[20px] border border-[#e5e3e0] bg-[#f0eeeb] px-6 py-10 text-center shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] sm:px-12"
          aria-labelledby="trust-heading"
        >
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#dfe8f5] text-[#4a6a8c]">
            <IconShieldLock className="h-6 w-6" />
          </div>
          <h2
            id="trust-heading"
            className="font-heading mb-3 text-xl font-semibold text-[#333333] sm:text-2xl"
          >
            Your data is private and under your control.
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-[#5a5a5a]">
            We use end-to-end encryption to ensure only you can access your
            statements and records.
          </p>
        </section>

        {/* Feature grid */}
        <section
          id="feature-grid"
          className="animate-delay-300 animate-fade-in-up mb-20"
          aria-labelledby="features-heading"
        >
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-[18px] border border-[#ebe8e4] bg-[#faf8f5] p-7 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] transition hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8eef4] text-[#5a6d82]">
                <IconScale className="h-5 w-5" />
              </div>
              <h3 className="font-heading mb-2 text-lg font-semibold text-[#333333]">
                Legal Compliance
              </h3>
              <p className="text-sm leading-relaxed text-[#5a5a5a]">
                Designed to meet international privacy standards for sensitive
                documentation.
              </p>
            </article>

            <article className="rounded-[18px] border border-[#ebe8e4] bg-[#faf8f5] p-7 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] transition hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#ebe4f0] text-[#6b5a78]">
                <IconEyeOff className="h-5 w-5" />
              </div>
              <h3 className="font-heading mb-2 text-lg font-semibold text-[#333333]">
                Discreet Mode
              </h3>
              <p className="text-sm leading-relaxed text-[#5a5a5a]">
                Optional interface masking to protect your privacy while using the
                app in public.
              </p>
            </article>

            <article className="rounded-[18px] border border-[#ebe8e4] bg-[#faf8f5] p-7 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] transition hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#e0edf0] text-[#4a6b70]">
                <IconUsers className="h-5 w-5" />
              </div>
              <h3 className="font-heading mb-2 text-lg font-semibold text-[#333333]">
                Human Support
              </h3>
              <p className="text-sm leading-relaxed text-[#5a5a5a]">
                Connect with trauma-informed professionals if you need
                immediate assistance.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e4df] bg-[#f5f2ef]/80 py-10 text-center">
        <p className="mb-4 text-sm leading-relaxed text-[#7a7570]">
          Your safety is our priority. This connection is encrypted and private.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <a
            href="#"
            className="text-[#8a8580] underline decoration-[#d4cfc8] underline-offset-4 transition hover:text-[#5a5652]"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-[#8a8580] underline decoration-[#d4cfc8] underline-offset-4 transition hover:text-[#5a5652]"
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  )
}
