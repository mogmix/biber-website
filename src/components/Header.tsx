export default function Header() {
  return (
    <header
      className="w-full py-4 px-4 sm:px-6 flex items-center gap-3"
      style={{ backgroundColor: 'var(--brand-primary)' }}
    >
      <img
        src="/vereinslogo.svg"
        alt="Vereinslogo"
        className="h-10 w-auto object-contain"
      />
      <div>
        <h1 className="text-white font-bold text-lg sm:text-xl leading-tight">
          Biberkarte Deutschland
        </h1>
        <p className="text-white/70 text-xs sm:text-sm">
          Sichtungsmeldungen des Vereins
        </p>
      </div>
    </header>
  )
}
