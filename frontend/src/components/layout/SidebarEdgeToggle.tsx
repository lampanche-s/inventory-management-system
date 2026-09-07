import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

type SidebarEdgeToggleProps = {
  open: boolean
  onToggle: () => void
}

export function SidebarEdgeToggle({
  open,
  onToggle,
}: SidebarEdgeToggleProps) {
  const label = open ? 'Hide tabs' : 'Show tabs'
  const Icon = open ? PanelLeftClose : PanelLeftOpen

  return (
    <div
      className={[
        'fixed top-[84px] z-40 hidden transition-[left] duration-200 ease-out motion-reduce:transition-none lg:block',
        open ? 'left-72' : 'left-0',
      ].join(' ')}
    >
      <div className="group relative">
        <div className="w-10 overflow-hidden">
          <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            className={[
              'flex h-9 w-9 -translate-x-[14px] items-center justify-center rounded-r-md border border-nexus-border bg-white text-nexus-bright',
              'transition-[transform,background-color,border-color] duration-[180ms]',
              'ease-[cubic-bezier(0.22,1,0.36,1)]',
              'group-hover:translate-x-0 group-hover:border-[#9fc2f8] group-hover:bg-[#f3f7ff]',
              'focus-visible:translate-x-0 focus-visible:border-nexus-bright focus-visible:outline-none',
            ].join(' ')}
          >
            <Icon size={17} strokeWidth={2} />
          </button>
        </div>

        <span
          role="tooltip"
          className={[
            'pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 whitespace-nowrap',
            'rounded-md border border-nexus-border bg-white px-2.5 py-1.5',
            'text-xs font-medium text-nexus-navy',
            'opacity-0 translate-x-1 transition-[opacity,transform] duration-120 ease-out',
            'group-hover:translate-x-0 group-hover:opacity-100',
          ].join(' ')}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
