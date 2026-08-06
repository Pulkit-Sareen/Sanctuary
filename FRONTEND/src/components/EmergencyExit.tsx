type Props = {
  className?: string
}

export function EmergencyExit({ className = '' }: Props) {
  const handleClick = () => {
    window.location.replace('https://www.google.com')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group inline-flex h-[52px] min-w-[160px] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#2F4737,#24382C)] px-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8] sm:min-w-[200px] sm:px-8 ${className}`}
    >
      <span className="font-hero whitespace-nowrap text-[13px] font-[700] tracking-[0.06em] text-white sm:text-[16px]">
        Emergency Exit
      </span>
    </button>
  )
}

