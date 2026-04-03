type Props = {
  className?: string
}

/**
 * Navigates away quickly to a neutral page. Replace defaultUrl if your org provides a safety URL.
 */
export function EmergencyExit({ className = '' }: Props) {
  const handleClick = () => {
    window.location.replace('https://www.google.com')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex min-h-11 min-w-[8.5rem] shrink-0 items-center justify-center rounded-full border border-[#c5e8ea] bg-[#d8f3f4] px-5 text-sm font-medium text-[#2d5a5c] shadow-sm transition hover:border-[#a8dadc] hover:bg-[#c8eef0] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7ab8bc] ${className}`}
    >
      Emergency Exit
    </button>
  )
}
