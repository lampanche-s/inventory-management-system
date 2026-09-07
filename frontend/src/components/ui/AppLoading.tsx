import { LoaderCircle } from 'lucide-react'

export function AppLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f7f9fc]"
      aria-label="Loading"
      aria-busy="true"
    >
      <LoaderCircle
        size={30}
        strokeWidth={2}
        className="animate-spin text-nexus-bright"
      />
    </main>
  )
}
