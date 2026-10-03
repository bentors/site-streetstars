export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-white/40 text-xs uppercase tracking-widest">
        Verificando acesso...
      </p>
    </div>
  )
}