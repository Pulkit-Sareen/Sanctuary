import { useState } from 'react'
import { GradientWave } from '../components/ui/gradient-wave'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Book,
  EyeOff,
  // Flower2,
  Heart,
  Menu,
  Mic,
  Scale,
  Shield,
  // Sparkles,
} from 'lucide-react'
import { EmergencyExit } from '../components/EmergencyExit'

// const particles = Array.from({ length: 18 }, (_, index) => ({
//   id: index,
//   left: `${(index * 23 + 7) % 100}%`,
//   size: `${(index % 4) + 2}px`,
//   duration: `${24 + (index % 6) * 3}s`,
//   delay: `${(index % 7) * 1.2}s`,
// }))

// const decorations = [
//   { id: 'flower-left', Icon: Flower2, left: '7%', top: '20%', size: 46, delay: 0, duration: 28 },
//   { id: 'sparkle-top', Icon: Sparkles, left: '22%', top: '14%', size: 28, delay: 1.5, duration: 24 },
//   { id: 'flower-right', Icon: Flower2, left: '87%', top: '26%', size: 52, delay: 2, duration: 32 },
//   { id: 'sparkle-mid', Icon: Sparkles, left: '78%', top: '53%', size: 24, delay: 0.8, duration: 26 },
//   { id: 'flower-low', Icon: Flower2, left: '12%', top: '68%', size: 38, delay: 3, duration: 30 },
// ]

const headerBackground =
  'linear-gradient(135deg, rgba(246,241,232,0.74) 0%, rgba(246,241,232,0.56) 48%, rgba(246,241,232,0.42) 100%), linear-gradient(135deg, #5D765F 0%, #4B6650 35%, #314535 70%, #202D23 100%)'

// const Particles = () => (
//   <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
//     {particles.map((particle) => (
//       <div
//         key={particle.id}
//         className="particle"
//         style={{
//           left: particle.left,
//           width: particle.size,
//           height: particle.size,
//           animationDuration: particle.duration,
//           animationDelay: particle.delay,
//           opacity: 0.16,
//           backgroundColor: '#F6F1E8',
//         }}
//       />
//     ))}
//   </div>
// )

// const DecorativeElements = () => (
//   <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
//     {decorations.map(({ id, Icon, left, top, size, delay, duration }) => (
//       <motion.div
//         key={id}
//         className="absolute text-[#F6F1E8]"
//         style={{ left, top, opacity: 0.16 }}
//         animate={{
//           y: [0, -16, 0],
//           rotate: [-3, 4, -3],
//           scale: [1, 1.04, 1],
//         }}
//         transition={{
//           duration,
//           delay,
//           repeat: Infinity,
//           ease: 'easeInOut',
//         }}
//       >
//         <Icon style={{ width: size, height: size }} strokeWidth={1.6} />
//       </motion.div>
//     ))}
//   </div>
// )

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 60, damping: 20 },
  },
}

const primaryCardClass =
  'w-full min-h-[370px] rounded-[40px] bg-[rgba(246,241,232,0.90)] p-9 text-left shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-[18px] border border-white/25 transition-all duration-300 md:w-[460px] md:min-h-[390px] md:p-12'
const featureCardClass =
  'bg-[rgba(246,241,232,0.90)] backdrop-blur-[18px] border border-white/25 shadow-[0_12px_30px_rgba(0,0,0,0.08)] rounded-[32px] min-h-[230px] p-[34px] flex flex-col justify-center transition-all duration-300 hover:bg-[#F8F4EC]'

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative min-h-svh overflow-x-hidden font-sans text-[#111111] antialiased">

      <GradientWave
  // colors={['#31483A', '#4E6852', '#7D9B81', '#F7F2E9']}
  className="opacity-50"
  darkenTop
  shadowPower={5}
/>
      <div className="sanctuary-ambient" aria-hidden="true" />
      {/* <div className="noise-overlay" aria-hidden="true" /> */}
      {/* <Particles /> */}
      {/* <DecorativeElements /> */}

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="fixed left-1/2 top-7 z-[1000] grid h-[76px] w-[92%] max-w-[1440px] -translate-x-1/2 grid-cols-[minmax(48px,1fr)_auto_minmax(160px,1fr)] items-center gap-2 rounded-[36px] border border-white/[0.08] px-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-[20px] sm:grid-cols-[minmax(200px,1fr)_auto_minmax(200px,1fr)] sm:gap-3 sm:px-6 md:px-16 2xl:px-20"
        style={{
          background: headerBackground,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="relative flex justify-start">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/12 text-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.05] hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8]"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <Menu className="h-7 w-7" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 top-[60px] z-[1001] flex w-[220px] flex-col overflow-hidden rounded-[24px] border border-black/5 bg-[#F6F1E8]/95 py-3 shadow-[0_18px_45px_rgba(24,38,28,0.18)] backdrop-blur-3xl"
              >
                <Link
                  to="/"
                  className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <a
                  href="#resources"
                  className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                  onClick={() => setMenuOpen(false)}
                >
                  Resources
                </a>
                <Link
                  to="/legal"
                  className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                  onClick={() => setMenuOpen(false)}
                >
                  Legal Rights
                </Link>
                <div className="mx-4 my-1 h-[1px] bg-black/10" />
                <a
                  href="#support"
                  className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                  onClick={() => setMenuOpen(false)}
                >
                  Support
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="font-hero hidden justify-self-center text-[20px] font-[800] tracking-normal text-[#111111] sm:block">
          Sanctuary
        </div>

        <div className="flex justify-end">
          <EmergencyExit />
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center px-5 pb-24 sm:px-8 lg:px-16">
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mt-40 flex w-full flex-col items-center text-center md:mt-44"
        >
          <h1 className="font-hero m-0 max-w-[900px] text-[42px] font-[800] leading-[1.05] tracking-normal text-[#111111] drop-shadow-[0_1px_16px_rgba(246,241,232,0.25)] md:text-[56px] lg:text-[68px]">
            Breathe. You are safe.
          </h1>
          <p className="mt-5 mb-16 max-w-[720px] text-[18px] font-normal leading-[1.75] text-[#2F2F2F]">
            Record your experience securely, access trusted resources, and stay in control of your
            information&mdash;all in one protected space.
          </p>
        </motion.section>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex w-full flex-col items-center">
          <section id="resources" className="flex w-full flex-col items-center justify-center gap-8 md:flex-row">
            <motion.button
              type="button"
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate('/write')}
              className={`${primaryCardClass} group cursor-pointer hover:bg-[#F8F4EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6F1E8]`}
            >
              <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#DDE7DD] text-[#2E4A38]">
                <Mic className="h-[34px] w-[34px]" strokeWidth={2.2} />
              </div>
              <h2 className="mb-5 text-[32px] font-[700] leading-tight text-[#111111]">Record Statement</h2>
              <p className="mb-auto text-[18px] font-normal leading-[1.7] text-[#404040] md:pr-8">
                Securely document your experience at your own pace. Your words are protected.
              </p>
              <div className="mt-8 inline-flex items-center text-[20px] font-[600] text-[#111111] transition-opacity group-hover:opacity-75">
                Begin recording
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-[6px]" />
              </div>
            </motion.button>

            <motion.article
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              className={`${primaryCardClass} hover:bg-[#F8F4EC]`}
            >
              <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#DDE7DD] text-[#2E4A38]">
                <Book className="h-[34px] w-[34px]" strokeWidth={2.2} />
              </div>
              <h2 className="mb-5 text-[32px] font-[700] leading-tight text-[#111111]">Resources</h2>
              <p className="mb-auto text-[18px] font-normal leading-[1.7] text-[#404040] md:pr-8">
                Explore support, information, and recovery tools designed for your journey.
              </p>
              <div className="mt-8 inline-flex items-center text-[20px] font-[600] text-[#111111]">
                Browse resources
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </motion.article>
          </section>

          <motion.section variants={itemVariants} className="mt-20 flex w-full justify-center">
            <div className="flex min-h-[80px] w-full max-w-[900px] flex-col items-center justify-center gap-6 rounded-[34px] border border-white/25 bg-[rgba(246,241,232,0.90)] px-8 py-5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-[18px] md:flex-row md:rounded-full md:px-10 md:text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DDE7DD] text-[#2E4A38]">
                <Shield className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <p className="m-0 text-[16px] font-medium leading-relaxed text-[#1E1E1E]">
                <strong className="font-[700] text-[#111111]">Your data is private and under your control.</strong>
                <br />
                <span className="text-[#444444]">
                  We use end-to-end encryption to ensure only you can access your statements and records.
                </span>
              </p>
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="mt-20 grid w-full grid-cols-1 gap-8 md:grid-cols-3"
            id="support"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate('/legal')}
              className={`${featureCardClass} cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6F1E8]`}
            >
              <div className="mb-5 flex items-center gap-4 text-[#2E4A38]">
                <Scale className="h-7 w-7" strokeWidth={2.2} />
                <h3 className="m-0 text-[21px] font-[700] text-[#111111]">Legal Compliance</h3>
              </div>
              <p className="m-0 text-[17px] leading-[1.65] text-[#404040]">
                Designed to meet international privacy standards for sensitive documentation.
              </p>
            </motion.button>

            <motion.article whileHover={{ scale: 1.01 }} className={featureCardClass}>
              <div className="mb-5 flex items-center gap-4 text-[#2E4A38]">
                <EyeOff className="h-7 w-7" strokeWidth={2.2} />
                <h3 className="m-0 text-[21px] font-[700] text-[#111111]">Discreet Mode</h3>
              </div>
              <p className="m-0 text-[17px] leading-[1.65] text-[#404040]">
                Optional interface masking to protect your privacy while using the app in public.
              </p>
            </motion.article>

            <motion.article whileHover={{ scale: 1.01 }} className={featureCardClass}>
              <div className="mb-5 flex items-center gap-4 text-[#2E4A38]">
                <Heart className="h-7 w-7" strokeWidth={2.2} />
                <h3 className="m-0 text-[21px] font-[700] text-[#111111]">Human Support</h3>
              </div>
              <p className="m-0 text-[17px] leading-[1.65] text-[#404040]">
                Connect with trauma-informed professionals if you need immediate assistance.
              </p>
            </motion.article>
          </motion.section>
        </motion.div>
      </main>

      <footer className="relative z-10 mt-auto flex w-full flex-col items-center pb-12 pt-16">
        <p className="mb-6 text-center text-[14px] font-medium leading-relaxed text-[#1E1E1E]">
          Your safety is our priority. This connection is encrypted and private.
        </p>
        <div className="flex gap-8">
          <a href="#" className="text-[14px] font-[600] text-[#444444] transition-colors hover:text-[#111111]">
            Privacy Policy
          </a>
          <a href="#" className="text-[14px] font-[600] text-[#444444] transition-colors hover:text-[#111111]">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  )
}
