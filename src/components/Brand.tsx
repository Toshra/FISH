import { Link } from 'react-router'

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Grow and Build home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" role="img">
          <path d="M6 23c7-9 18-10 27-3l6-5v15l-6-5c-9 7-20 6-27-2Z" />
          <circle cx="29" cy="21" r="1.8" />
          <path className="brand-leaf" d="M18 15c0-6 4-9 9-10 0 6-3 10-9 10Z" />
        </svg>
      </span>
      <span>Grow <b>&amp;</b> Build</span>
    </Link>
  )
}
