import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Lock,
  Settings,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react'
import { EmergencyExit } from '../components/EmergencyExit'

const particles = Array.from({ length: 15 }, (_, index) => ({
  id: index,
  left: `${(index * 17) % 100}%`,
  size: `${(index % 4) + 3}px`,
  duration: `${18 + (index % 5) * 3}s`,
  delay: `${(index % 6) * 1.4}s`,
}))

const Particles = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {particles.map((particle) => (
      <div
        key={particle.id}
        className="particle"
        style={{
          left: particle.left,
          width: particle.size,
          height: particle.size,
          animationDuration: particle.duration,
          animationDelay: particle.delay,
          opacity: 0.14,
          backgroundColor: '#F6F1E8',
        }}
      />
    ))}
  </div>
)

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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

const sectionClass =
  'bg-[#F6F1E8]/95 backdrop-blur-xl border border-black/5 rounded-[36px] p-8 md:p-12 shadow-[0_18px_55px_rgba(28,43,32,0.14)]'
const sectionHeadingClass =
  'font-hero text-[30px] md:text-[34px] font-[700] leading-tight text-[#111111] m-0 mb-8'
const subHeadingClass =
  'font-hero text-[21px] md:text-[22px] font-[600] leading-snug text-[#111111] mt-6 mb-3'
const bodyClass =
  'text-[17px] md:text-[18px] font-normal leading-[1.8] tracking-[0.2px] text-[#1A1A1A]'
const secondaryClass = 'text-[17px] leading-[1.75] tracking-[0.2px] text-[#404040]'

const rights = [
  {
    icon: Shield,
    title: 'Your Privacy Comes First',
    text: 'Your personal information and recorded statements belong to you. Sanctuary is designed so that you remain in control of your data at all times.',
  },
  {
    icon: Download,
    title: 'Access Your Information',
    text: 'You can review, download, or export your records whenever you choose.',
  },
  {
    icon: Trash2,
    title: 'Request Deletion',
    text: 'If you decide to leave Sanctuary, you can permanently delete your account and associated data, subject to applicable legal requirements.',
  },
  {
    icon: Settings,
    title: 'Manage Your Consent',
    text: 'You choose if, when, and with whom your information is shared. Consent can be updated or withdrawn at any time where permitted by law.',
  },
]

const protectionItems = [
  'End-to-end encryption during transmission and storage',
  'Secure authentication for account access',
  'Continuous monitoring against unauthorized access',
  'Encrypted backups where applicable',
  'Regular security reviews and updates',
]

const mayCollect = [
  'Account information, such as your name or email',
  'Audio recordings you choose to create',
  'Written notes or uploaded documents',
  'Basic device and security information',
  'Usage analytics to improve performance, where permitted',
]

const doNotCollect = [
  'Conversations outside the app',
  'Microphone recordings unless recording is started',
  'Contacts without permission',
  'Photos or files unless uploaded',
  'Location unless permission is granted',
]

const choices = [
  'View stored records',
  'Download data',
  'Delete recordings',
  'Update personal information',
  'Control sharing permissions',
  'Close account',
]

const evidenceItems = [
  'Secure timestamping',
  'Original file preservation',
  'Metadata protection',
  'Export-ready documentation',
]

const complianceBadges = [
  'GDPR Principles',
  'CCPA Principles',
  'Industry Security Best Practices',
  'Privacy by Design',
]

const faqs = [
  {
    question: 'Can Sanctuary access my recordings?',
    answer:
      'Sanctuary is designed so your recordings remain private and protected. Access is limited to you unless you choose to share a record, export it, or authorize another person or service to receive it.',
  },
  {
    question: 'Can I permanently delete my information?',
    answer:
      'Yes. You can request deletion of your account and associated records. Some information may need to be retained for a limited period where required by law, security obligations, or dispute prevention.',
  },
  {
    question: 'Can I use my recordings as legal evidence?',
    answer:
      'Your recordings may help document your experience, but admissibility depends on your jurisdiction, the circumstances of recording, and the rules of the legal process involved. Sanctuary does not provide legal advice.',
  },
  {
    question: 'Who owns my data?',
    answer:
      'You own the personal information, recordings, notes, and documents you create or upload. Sanctuary provides tools to store, protect, manage, and export that information.',
  },
  {
    question: 'Will my information be shared?',
    answer:
      'Your information is not shared without your consent except where required by applicable law, safety obligations, or necessary service operations described in the privacy policy.',
  },
]

const BulletList = ({
  items,
  icon = CheckCircle2,
}: {
  items: string[]
  icon?: typeof CheckCircle2
}) => {
  const Icon = icon

  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0 text-[#222222]">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[17px] leading-[1.75] tracking-[0.2px]">
          <Icon className="mt-[5px] h-5 w-5 shrink-0 text-[#668D6D]" strokeWidth={2.4} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

const NoticeCard = ({
  title = 'Important',
  children,
  large = false,
}: {
  title?: string
  children: ReactNode
  large?: boolean
}) => (
  <div
    className={`rounded-[28px] border border-[#D9CDB8] bg-[#F8F4EC] shadow-[0_12px_35px_rgba(60,42,18,0.12)] ${
      large ? 'p-8 md:p-10' : 'p-6 md:p-7'
    }`}
  >
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8DCC7] text-[#6A5A3D]">
        <AlertCircle className="h-6 w-6" strokeWidth={2.4} />
      </div>
      <div>
        <h3 className="font-hero m-0 mb-3 text-[22px] font-[700] leading-tight text-[#111111]">{title}</h3>
        <div className={`${bodyClass} flex flex-col gap-4`}>{children}</div>
      </div>
    </div>
  </div>
)

const FAQAccordion = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      className="overflow-hidden rounded-[28px] border border-black/5 bg-[#F8F4EC]/95 shadow-[0_12px_35px_rgba(28,43,32,0.1)]"
      whileHover={{ y: -2 }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-5 p-6 text-left md:p-8"
      >
        <span className="font-hero text-[19px] md:text-[21px] font-[700] leading-snug text-[#111111]">
          {question}
        </span>
        <ChevronDown
          className={`h-6 w-6 shrink-0 text-[#34533A] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2.4}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <p className={`${bodyClass} m-0 px-6 pb-7 pt-0 md:px-8 md:pb-8`}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function LegalCompliancePage() {
  return (
    <div className="relative min-h-svh overflow-x-hidden font-sans text-[#111111] antialiased">
      <Particles />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="fixed left-1/2 top-4 z-50 flex min-h-[72px] w-[95%] max-w-[1200px] -translate-x-1/2 items-center justify-between gap-4 rounded-b-[32px] rounded-t-[18px] border border-black/5 bg-[#F6F1E8]/95 px-5 shadow-[0_16px_45px_rgba(24,38,28,0.18)] backdrop-blur-2xl md:px-8"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-[15px] font-[700] text-[#111111] transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        <div className="font-hero text-[20px] font-[800] text-[#111111]">Sanctuary</div>

        <EmergencyExit className="h-[44px] px-5 sm:px-7" />
      </motion.header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1060px] flex-1 flex-col px-5 pb-24 pt-36 md:px-6 md:pt-40">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-16">
          <motion.section variants={itemVariants} className="text-center">
            <h1 className="font-hero m-0 mb-10 text-[42px] font-[800] leading-tight text-[#111111] md:text-[56px]">
              Legal Compliance
            </h1>
            <p className={`${secondaryClass} mx-auto max-w-[760px]`}>
              Sanctuary is built to keep sensitive documentation private, readable, and under your control. This page
              explains your rights, how your information is protected, and how records are handled.
            </p>
          </motion.section>

          <motion.section variants={itemVariants} className={sectionClass}>
            <h2 className={sectionHeadingClass}>Your Rights</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {rights.map((right) => {
                const Icon = right.icon

                return (
                  <motion.article
                    key={right.title}
                    whileHover={{ y: -4 }}
                    className="rounded-[28px] border border-black/5 bg-[#F8F4EC] p-7 shadow-[0_10px_28px_rgba(28,43,32,0.09)]"
                  >
                    <Icon className="mb-5 h-9 w-9 text-[#34533A]" strokeWidth={2.2} />
                    <h3 className={subHeadingClass}>{right.title}</h3>
                    <p className={`${bodyClass} m-0`}>{right.text}</p>
                  </motion.article>
                )
              })}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className={sectionClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className={sectionHeadingClass}>Data Protection</h2>
                <h3 className={subHeadingClass}>How We Protect Your Information</h3>
                <p className={`${bodyClass} m-0 max-w-[760px]`}>
                  We use industry-standard security practices to protect your recordings and personal information.
                </p>
              </div>
              <Lock className="hidden h-14 w-14 shrink-0 text-[#34533A] md:block" strokeWidth={2.1} />
            </div>

            <div className="mt-8">
              <BulletList items={protectionItems} />
            </div>

            <div className="mt-8 rounded-[26px] border border-[#AFC5B2] bg-[#E9F0E7] p-6 shadow-[0_10px_30px_rgba(28,43,32,0.08)]">
              <p className={`${bodyClass} m-0 font-[600]`}>
                Your information is protected using modern security standards designed to safeguard sensitive data.
              </p>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className={sectionClass}>
            <h2 className={sectionHeadingClass}>Data We Collect</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <article className="rounded-[28px] border border-black/5 bg-[#F8F4EC] p-7 shadow-[0_10px_28px_rgba(28,43,32,0.09)]">
                <h3 className={subHeadingClass}>We May Collect</h3>
                <BulletList items={mayCollect} />
              </article>

              <article className="rounded-[28px] border border-black/5 bg-[#F8F4EC] p-7 shadow-[0_10px_28px_rgba(28,43,32,0.09)]">
                <h3 className={subHeadingClass}>We Do Not Collect</h3>
                <BulletList items={doNotCollect} icon={XCircle} />
              </article>
            </div>

            <div className="mt-10">
              <h3 className={subHeadingClass}>Your Information, Your Choice</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {choices.map((choice) => (
                  <div
                    key={choice}
                    className="rounded-full border border-black/5 bg-[#E9F0E7] px-5 py-4 text-center text-[16px] font-[700] leading-snug text-[#222222] shadow-[0_8px_24px_rgba(28,43,32,0.08)]"
                  >
                    {choice}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className={sectionClass}>
            <h2 className={sectionHeadingClass}>Evidence Integrity</h2>
            <p className={`${bodyClass} m-0 mb-8`}>
              Sanctuary is designed to help preserve the structure and context of documentation you choose to create.
              Integrity controls support a clear record while keeping ownership and sharing decisions with you.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {evidenceItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[24px] border border-black/5 bg-[#F8F4EC] p-5 text-[17px] font-[700] text-[#222222] shadow-[0_8px_24px_rgba(28,43,32,0.08)]"
                >
                  <FileText className="h-5 w-5 shrink-0 text-[#34533A]" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <NoticeCard>
                <p className="m-0">
                  Sanctuary does not guarantee that any recording or document will be admissible in legal proceedings.
                  Requirements vary depending on your jurisdiction.
                </p>
              </NoticeCard>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className={sectionClass}>
            <h2 className={sectionHeadingClass}>Compliance Standards</h2>
            <div className="grid gap-5 md:grid-cols-4">
              {complianceBadges.map((badge) => (
                <div
                  key={badge}
                  className="flex min-h-[116px] items-center justify-center rounded-[26px] border border-[#AFC5B2] bg-[#E9F0E7] p-5 text-center text-[17px] font-[800] leading-snug text-[#111111] shadow-[0_10px_28px_rgba(28,43,32,0.08)]"
                >
                  {badge}
                </div>
              ))}
            </div>
          </motion.section>

          <div className="grid gap-8 md:grid-cols-2">
            <motion.section variants={itemVariants} className={sectionClass}>
              <h2 className={sectionHeadingClass}>Data Retention</h2>
              <p className={`${bodyClass} m-0`}>
                Sanctuary keeps your records for as long as your account is active or as long as needed to provide the
                service. You can delete recordings and request account deletion, subject to applicable legal, security,
                backup, and compliance requirements.
              </p>
            </motion.section>

            <motion.section variants={itemVariants} className={sectionClass}>
              <h2 className={sectionHeadingClass}>Third-Party Services</h2>
              <p className={`${bodyClass} m-0`}>
                Sanctuary may rely on carefully selected third-party providers for secure hosting, authentication,
                analytics, backups, or support operations. Providers are used only where needed and are expected to
                follow privacy and security safeguards appropriate for sensitive information.
              </p>
            </motion.section>
          </div>

          <motion.section variants={itemVariants} className={sectionClass}>
            <h2 className={sectionHeadingClass}>Frequently Asked Questions</h2>
            <div className="flex flex-col gap-4">
              {faqs.map((faq) => (
                <FAQAccordion key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <NoticeCard title="Important Notice" large>
              <p className="m-0">
                Sanctuary is designed to support documentation, recovery, and access to resources. It is not a
                substitute for legal advice, medical care, emergency services, or crisis intervention.
              </p>
              <p className="m-0">
                If you believe you are in immediate danger, contact your local emergency services or a trusted support
                organization immediately.
              </p>
            </NoticeCard>
          </motion.section>
        </motion.div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1000px] flex-col items-center gap-4 px-6 pb-12 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] font-[600] text-[#111111]">
          <Link to="/legal" className="hover:opacity-70">
            Privacy Policy
          </Link>
          <Link to="/legal" className="hover:opacity-70">
            Terms of Service
          </Link>
          <Link to="/legal" className="hover:opacity-70">
            Cookie Policy
          </Link>
          <span>Last Updated: August 3, 2026</span>
        </div>
        <p className="m-0 text-[14px] font-[500] text-[#111111]/65">Sanctuary Legal & Privacy (c) 2026</p>
      </footer>
    </div>
  )
}

