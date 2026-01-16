export default function Overlay({ active, onClick }) {
  if (!active) return null

  return (
    <div
      onClick={onClick}
      aria-hidden="true"
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
    />
  )
}