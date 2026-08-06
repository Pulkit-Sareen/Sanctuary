import { NavLink } from 'react-router-dom'
import { IconBook, IconHome } from './Icons'

export function SanctuaryBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border border-b-0 border-[#e8e8e8] bg-white/95 py-3 shadow-[0_-8px_32px_-12px_rgba(45,45,45,0.08)] backdrop-blur-md"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-lg justify-center gap-2 px-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex min-h-12 min-w-[5rem] flex-col items-center justify-center gap-1 rounded-2xl px-6 text-sm font-medium transition-surface ${
              isActive
                ? 'bg-[#a8dadc]/25 text-[#2a5c5f]'
                : 'text-[#5a5a5a] hover:bg-[#f7f7f7] hover:text-[#2f2f2f]'
            }`
          }
        >
          <IconHome className="h-6 w-6" />
          <span>Home</span>
        </NavLink>
        <a
          href="/#resources"
          className="flex min-h-12 min-w-[5rem] flex-col items-center justify-center gap-1 rounded-2xl px-6 text-sm font-medium text-[#5a5a5a] transition-surface hover:bg-[#f7f7f7] hover:text-[#2f2f2f]"
        >
          <IconBook className="h-6 w-6" />
          <span>Resources</span>
        </a>
      </div>
    </nav>
  )
}
