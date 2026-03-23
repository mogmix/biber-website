import { BUNDESLAENDER } from '../data/bundeslaender'

export default function GermanyMap() {
  return (
    <svg
      viewBox="0 0 500 600"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-lg mx-auto block"
      aria-label="Karte der deutschen Bundesländer"
      role="img"
    >
      {BUNDESLAENDER.map(({ code, name, d }) => (
        <path
          key={code}
          data-land={code}
          aria-label={name}
          d={d}
          style={{ fill: 'var(--color-land-default)', stroke: 'var(--color-land-stroke)', strokeWidth: 1 }}
        />
      ))}
    </svg>
  )
}
