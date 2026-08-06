import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Clipboard,
  Copy,
  ExternalLink,
  Gavel,
  HeartHandshake,
  MapPin,
  Menu,
  Pencil,
  PhoneCall,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { EmergencyExit } from '../components/EmergencyExit'
import { GradientWave } from '../components/ui/gradient-wave'
import {
  supportDataByPinCode,
  supportPlaceholders,
  type LegalAidResource,
  type MentalHealthResource,
  type NgoResource,
  type SupportLocationData,
} from '../data/supportData'

const headerBackground =
  'linear-gradient(135deg, rgba(246,241,232,0.74) 0%, rgba(246,241,232,0.56) 48%, rgba(246,241,232,0.42) 100%), linear-gradient(135deg, #5D765F 0%, #4B6650 35%, #314535 70%, #202D23 100%)'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
}

const cardClass =
  'rounded-[32px] border border-white/25 bg-[rgba(246,241,232,0.92)] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-[18px] md:p-7'
const fieldClass =
  'h-[52px] rounded-full border border-black/10 bg-[#F8F4EC] px-5 text-[15px] font-[600] text-[#111111] outline-none transition-all placeholder:text-[#777777] focus:border-[#5E7C63] focus:ring-2 focus:ring-[#DDE7DD]'
const primaryButtonClass =
  'inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#2F4737,#24382C)] px-6 text-[15px] font-[800] text-white shadow-[0_10px_26px_rgba(30,45,34,0.22)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#24382C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100'
const softButtonClass =
  'inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-black/5 bg-[#E9F0E7] px-4 text-[13px] font-[800] text-[#1E1E1E] shadow-[0_8px_20px_rgba(28,43,32,0.08)] transition-all duration-300 hover:bg-[#DDE7DD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7C63]'

type TrustedContact = {
  id: string
  name: string
  relationship: string
  phone: string
}

type TrustedContactForm = {
  name: string
  relationship: string
  phone: string
}

const trustedContactsStorageKey = 'sanctuary-human-support-trusted-contacts'
const safetyPlanStorageKey = 'sanctuary-human-support-safety-plan'

const safetyPlanItems = [
  { id: 'trusted-contact', label: 'Trusted contact saved' },
  { id: 'emergency-numbers', label: 'Emergency numbers noted' },
  { id: 'safe-location', label: 'Safe location identified' },
  { id: 'documents', label: 'Important documents secured' },
  { id: 'evidence', label: 'Evidence backed up' },
  { id: 'emergency-bag', label: 'Emergency bag prepared' },
]

const isTrustedContact = (value: unknown): value is TrustedContact => {
  if (!value || typeof value !== 'object') return false

  const contact = value as Record<string, unknown>

  return (
    typeof contact.id === 'string' &&
    typeof contact.name === 'string' &&
    typeof contact.relationship === 'string' &&
    typeof contact.phone === 'string'
  )
}

const readTrustedContacts = () => {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(trustedContactsStorageKey)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isTrustedContact).slice(0, 5) : []
  } catch {
    return []
  }
}

const readSafetyPlan = () => {
  const fallback = Object.fromEntries(safetyPlanItems.map((item) => [item.id, false])) as Record<string, boolean>

  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(safetyPlanStorageKey)
    if (!stored) return fallback

    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return fallback

    return safetyPlanItems.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = Boolean((parsed as Record<string, unknown>)[item.id])
      return acc
    }, fallback)
  } catch {
    return fallback
  }
}

function HumanSupportHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
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
              <Link
                to="/#resources"
                className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                to="/legal"
                className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                Legal Rights
              </Link>
              <div className="mx-4 my-1 h-[1px] bg-black/10" />
              <Link
                to="/support"
                className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                Support
              </Link>
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
  )
}

function SectionShell({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof PhoneCall
  children: ReactNode
}) {
  return (
    <motion.section variants={itemVariants} className={cardClass}>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DDE7DD] text-[#2E4A38]">
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h2 className="font-hero m-0 text-[25px] font-[800] leading-tight text-[#111111]">{title}</h2>
      </div>
      {children}
    </motion.section>
  )
}

function PlaceholderList({ items, unavailable }: { items: string[]; unavailable: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {(unavailable ? ['Support information for this location is currently unavailable.'] : items).map((item) => (
        <div
          key={item}
          className="rounded-[24px] border border-black/5 bg-[#F8F4EC]/88 p-5 text-[15px] font-[600] leading-relaxed text-[#4A4A4A] shadow-[0_8px_22px_rgba(28,43,32,0.07)]"
        >
          {item}
        </div>
      ))}
    </div>
  )
}

function EmergencyContacts({
  data,
  unavailable,
  onCopy,
  copiedKey,
}: {
  data?: SupportLocationData
  unavailable: boolean
  onCopy: (value: string, key: string) => void
  copiedKey: string | null
}) {
  return (
    <SectionShell title="Emergency Contacts" icon={PhoneCall}>
      {!data ? (
        <PlaceholderList items={supportPlaceholders.emergencyContacts} unavailable={unavailable} />
      ) : (
        <div className="grid gap-4">
          {data.emergencyContacts.map((contact) => {
            const key = `${contact.label}-${contact.number}`
            const copied = copiedKey === key

            return (
              <motion.article
                key={key}
                variants={itemVariants}
                className="rounded-[24px] border border-black/5 bg-[#F8F4EC] p-5 shadow-[0_8px_22px_rgba(28,43,32,0.07)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <PhoneCall className="mt-1 h-5 w-5 shrink-0 text-[#2E4A38]" strokeWidth={2.3} />
                    <div>
                      <h3 className="m-0 text-[17px] font-[800] text-[#111111]">{contact.label}</h3>
                      <a
                        href={`tel:${contact.number.replace(/[^\d+]/g, '')}`}
                        className="mt-1 inline-block text-[22px] font-[800] text-[#2E4A38] hover:opacity-75"
                      >
                        {contact.number}
                      </a>
                      <p className="m-0 mt-1 text-[14px] leading-relaxed text-[#555555]">{contact.note}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => onCopy(contact.number, key)} className={softButtonClass}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </SectionShell>
  )
}

function NgoCard({ ngo }: { ngo: NgoResource }) {
  return (
    <motion.article
      variants={itemVariants}
      className="rounded-[24px] border border-black/5 bg-[#F8F4EC] p-5 shadow-[0_8px_22px_rgba(28,43,32,0.07)]"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="m-0 text-[18px] font-[800] leading-snug text-[#111111]">{ngo.name}</h3>
          <p className="m-0 mt-2 text-[14px] font-[600] leading-relaxed text-[#555555]">{ngo.categories.join(' / ')}</p>
        </div>
        <div className="grid gap-2 text-[14px] leading-relaxed text-[#444444]">
          <span>{ngo.address}</span>
          <span>{ngo.distance}</span>
          <span>{ngo.workingHours}</span>
          <span className="font-[800] text-[#2E4A38]">{ngo.contactNumber}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {ngo.website ? (
            <a href={ngo.website} target="_blank" rel="noreferrer" className={softButtonClass}>
              <ExternalLink className="h-4 w-4" />
              Website
            </a>
          ) : null}
          <a href={ngo.mapUrl} target="_blank" rel="noreferrer" className={primaryButtonClass}>
            <MapPin className="h-4 w-4" />
            Navigate
          </a>
        </div>
      </div>
    </motion.article>
  )
}

function NearbyNgos({ data, unavailable }: { data?: SupportLocationData; unavailable: boolean }) {
  return (
    <SectionShell title="Nearby NGOs" icon={HeartHandshake}>
      {!data ? (
        <PlaceholderList items={supportPlaceholders.ngos} unavailable={unavailable} />
      ) : (
        <div className="grid gap-4">
          {data.ngos.map((ngo) => (
            <NgoCard key={ngo.name} ngo={ngo} />
          ))}
        </div>
      )}
    </SectionShell>
  )
}

function MentalHealthCard({ resource }: { resource: MentalHealthResource }) {
  return (
    <motion.article
      variants={itemVariants}
      className="rounded-[24px] border border-black/5 bg-[#F8F4EC] p-5 shadow-[0_8px_22px_rgba(28,43,32,0.07)]"
    >
      <h3 className="m-0 text-[18px] font-[800] leading-snug text-[#111111]">{resource.name}</h3>
      <p className="m-0 mt-2 text-[15px] font-[600] leading-relaxed text-[#2E4A38]">{resource.specialization}</p>
      <div className="mt-4 grid gap-2 text-[14px] leading-relaxed text-[#444444]">
        {resource.rating ? <span>Rating: {resource.rating}</span> : null}
        <span>{resource.contact}</span>
        <span>{resource.address}</span>
      </div>
      <button type="button" className={`${softButtonClass} mt-5`}>
        Book Appointment
      </button>
    </motion.article>
  )
}

function MentalHealth({ data, unavailable }: { data?: SupportLocationData; unavailable: boolean }) {
  return (
    <SectionShell title="Mental Health" icon={ShieldCheck}>
      {!data ? (
        <PlaceholderList items={supportPlaceholders.mentalHealth} unavailable={unavailable} />
      ) : (
        <div className="grid gap-4">
          {data.mentalHealth.map((resource) => (
            <MentalHealthCard key={resource.name} resource={resource} />
          ))}
        </div>
      )}
    </SectionShell>
  )
}

function LegalAidCard({ resource }: { resource: LegalAidResource }) {
  return (
    <motion.article
      variants={itemVariants}
      className="rounded-[24px] border border-black/5 bg-[#F8F4EC] p-5 shadow-[0_8px_22px_rgba(28,43,32,0.07)]"
    >
      <h3 className="m-0 text-[18px] font-[800] leading-snug text-[#111111]">{resource.name}</h3>
      <div className="mt-4 grid gap-2 text-[14px] leading-relaxed text-[#444444]">
        <span>{resource.address}</span>
        <span className="font-[800] text-[#2E4A38]">{resource.phone}</span>
        <span>{resource.officeHours}</span>
      </div>
      <a href={resource.website} target="_blank" rel="noreferrer" className={`${softButtonClass} mt-5`}>
        <ExternalLink className="h-4 w-4" />
        Website
      </a>
    </motion.article>
  )
}

function LegalAid({ data, unavailable }: { data?: SupportLocationData; unavailable: boolean }) {
  return (
    <SectionShell title="Legal Aid" icon={Gavel}>
      {!data ? (
        <PlaceholderList items={supportPlaceholders.legalAid} unavailable={unavailable} />
      ) : (
        <div className="grid gap-4">
          {data.legalAid.map((resource) => (
            <LegalAidCard key={resource.name} resource={resource} />
          ))}
        </div>
      )}
    </SectionShell>
  )
}

function TrustedContacts() {
  const [contacts, setContacts] = useState<TrustedContact[]>(readTrustedContacts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TrustedContactForm>({ name: '', relationship: '', phone: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    window.localStorage.setItem(trustedContactsStorageKey, JSON.stringify(contacts))
  }, [contacts])

  const isEditing = editingId !== null
  const hasReachedLimit = contacts.length >= 5 && !isEditing

  const resetForm = () => {
    setEditingId(null)
    setForm({ name: '', relationship: '', phone: '' })
    setError('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextForm = {
      name: form.name.trim(),
      relationship: form.relationship.trim(),
      phone: form.phone.trim(),
    }

    if (!nextForm.name || !nextForm.relationship || !nextForm.phone) {
      setError('Please complete all contact fields.')
      return
    }

    if (!/^[+\d][\d\s()-]{6,17}$/.test(nextForm.phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    if (hasReachedLimit) {
      setError('You can save up to 5 trusted contacts.')
      return
    }

    if (isEditing) {
      setContacts((current) =>
        current.map((contact) => (contact.id === editingId ? { ...contact, ...nextForm } : contact)),
      )
    } else {
      setContacts((current) => [{ id: window.crypto.randomUUID(), ...nextForm }, ...current].slice(0, 5))
    }

    resetForm()
  }

  const handleEdit = (contact: TrustedContact) => {
    setEditingId(contact.id)
    setForm({ name: contact.name, relationship: contact.relationship, phone: contact.phone })
    setError('')
  }

  const handleDelete = (id: string) => {
    setContacts((current) => current.filter((contact) => contact.id !== id))
    if (editingId === id) resetForm()
  }

  return (
    <SectionShell title="Trusted Contacts" icon={UserRound}>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className={fieldClass}
          placeholder="Name"
        />
        <input
          value={form.relationship}
          onChange={(event) => setForm((current) => ({ ...current, relationship: event.target.value }))}
          className={fieldClass}
          placeholder="Relationship"
        />
        <input
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          className={fieldClass}
          inputMode="tel"
          placeholder="Phone Number"
        />
        {error ? <p className="m-0 text-[14px] font-[700] text-[#7A2E2E]">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={hasReachedLimit} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            {isEditing ? 'Save Contact' : 'Add Contact'}
          </button>
          {isEditing ? (
            <button type="button" onClick={resetForm} className={softButtonClass}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {contacts.length === 0 ? (
          <div className="rounded-[24px] border border-black/5 bg-[#F8F4EC]/88 p-5 text-[15px] font-[600] leading-relaxed text-[#4A4A4A]">
            Save up to 5 people you can reach quickly in an emergency.
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-[24px] border border-black/5 bg-[#F8F4EC] p-5 shadow-[0_8px_22px_rgba(28,43,32,0.07)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="m-0 text-[17px] font-[800] text-[#111111]">{contact.name}</h3>
                  <p className="m-0 mt-1 text-[14px] font-[600] text-[#555555]">{contact.relationship}</p>
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="mt-1 inline-block font-[800] text-[#2E4A38]">
                    {contact.phone}
                  </a>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(contact)} className={softButtonClass}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(contact.id)} className={softButtonClass}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionShell>
  )
}

function SafetyPlan() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(readSafetyPlan)

  useEffect(() => {
    window.localStorage.setItem(safetyPlanStorageKey, JSON.stringify(checkedItems))
  }, [checkedItems])

  const completedCount = useMemo(
    () => safetyPlanItems.filter((item) => checkedItems[item.id]).length,
    [checkedItems],
  )
  const progress = Math.round((completedCount / safetyPlanItems.length) * 100)

  return (
    <SectionShell title="Safety Plan" icon={Clipboard}>
      <div className="mb-6 rounded-[24px] border border-[#AFC5B2] bg-[#E9F0E7] p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[15px] font-[800] text-[#111111]">Progress</span>
          <span className="text-[15px] font-[800] text-[#2E4A38]">{progress}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#C9D8CA]">
          <motion.div
            className="h-full rounded-full bg-[#2E4A38]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="grid gap-3">
        {safetyPlanItems.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-black/5 bg-[#F8F4EC] p-4 text-[15px] font-[700] leading-relaxed text-[#222222] shadow-[0_8px_22px_rgba(28,43,32,0.06)]"
          >
            <input
              type="checkbox"
              checked={Boolean(checkedItems[item.id])}
              onChange={(event) =>
                setCheckedItems((current) => ({
                  ...current,
                  [item.id]: event.target.checked,
                }))
              }
              className="h-5 w-5 accent-[#2E4A38]"
            />
            {item.label}
          </label>
        ))}
      </div>
    </SectionShell>
  )
}

export function HumanSupportPage() {
  const [pinCode, setPinCode] = useState('')
  const [selectedPinCode, setSelectedPinCode] = useState<string | null>(null)
  const [pinError, setPinError] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const selectedData = selectedPinCode ? supportDataByPinCode[selectedPinCode] : undefined
  const unavailable = Boolean(selectedPinCode && !selectedData && !pinError)

  const handleCopy = async (value: string, key: string) => {
    try {
      await window.navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1600)
    } catch {
      setCopiedKey(null)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!/^[1-9]\d{5}$/.test(pinCode)) {
      setPinError('Please enter a valid 6-digit PIN Code.')
      setSelectedPinCode(null)
      return
    }

    setPinError('')
    setSelectedPinCode(pinCode)
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden font-sans text-[#111111] antialiased">
      <GradientWave className="opacity-50" darkenTop shadowPower={5} />
      <div className="sanctuary-ambient" aria-hidden="true" />
      <HumanSupportHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-5 pb-24 pt-40 sm:px-8 lg:px-12">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-10">
          <motion.section variants={itemVariants} className="mx-auto max-w-[880px] text-center">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[rgba(246,241,232,0.82)] px-5 py-3 text-[14px] font-[800] text-[#111111] shadow-[0_8px_22px_rgba(0,0,0,0.08)] backdrop-blur-[16px] transition-opacity hover:opacity-75"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="font-hero m-0 text-[42px] font-[800] leading-[1.06] text-[#111111] drop-shadow-[0_1px_16px_rgba(246,241,232,0.25)] md:text-[58px]">
              Human Support
            </h1>
            <p className="mx-auto mt-5 max-w-[780px] text-[18px] font-normal leading-[1.75] text-[#2F2F2F]">
              Find trusted support services based on your location. Access emergency contacts, nearby organizations,
              legal assistance, and mental health resources whenever you need them.
            </p>
          </motion.section>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="sticky top-[112px] z-40 mx-auto w-full max-w-[980px] rounded-[32px] border border-white/25 bg-[rgba(246,241,232,0.94)] p-5 shadow-[0_16px_45px_rgba(24,38,28,0.16)] backdrop-blur-[20px] md:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <label className="flex flex-1 flex-col gap-2">
                <span className="text-[14px] font-[800] text-[#111111]">PIN Code Input</span>
                <input
                  value={pinCode}
                  onChange={(event) => {
                    setPinCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    if (pinError) setPinError('')
                  }}
                  className={fieldClass}
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Enter your PIN Code"
                />
              </label>
              <button type="submit" className={primaryButtonClass}>
                <MapPin className="h-4 w-4" />
                Find Support
              </button>
            </div>
            <AnimatePresence mode="wait">
              {pinError ? (
                <motion.p
                  key="pin-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="m-0 mt-3 text-[14px] font-[800] text-[#7A2E2E]"
                >
                  {pinError}
                </motion.p>
              ) : selectedData ? (
                <motion.p
                  key="pin-loaded"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="m-0 mt-3 text-[14px] font-[800] text-[#2E4A38]"
                >
                  Showing support information for {selectedData.locationName}, {selectedData.state}.
                </motion.p>
              ) : unavailable ? (
                <motion.p
                  key="pin-unavailable"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="m-0 mt-3 text-[14px] font-[800] text-[#7A2E2E]"
                >
                  Support information for this location is currently unavailable.
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.form>

          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            <EmergencyContacts data={selectedData} unavailable={unavailable} onCopy={handleCopy} copiedKey={copiedKey} />
            <NearbyNgos data={selectedData} unavailable={unavailable} />
            <MentalHealth data={selectedData} unavailable={unavailable} />
            <LegalAid data={selectedData} unavailable={unavailable} />
            <TrustedContacts />
            <SafetyPlan />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

