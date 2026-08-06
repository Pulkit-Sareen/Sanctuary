const BAR_COUNT = 24

export function Waveform() {
  return (
    <div
      className="flex h-16 items-end justify-center gap-[3px] px-4"
      role="img"
      aria-label="Recording activity indicator"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-[#a8dadc]/90"
          style={{
            height: `${22 + (i % 5) * 10}%`,
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  )
}
