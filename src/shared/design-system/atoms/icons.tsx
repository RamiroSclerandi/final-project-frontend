import type { ReactNode } from 'react'

interface IconProps {
  className?: string
}

interface IconFrameProps extends IconProps {
  children: ReactNode
}

function IconFrame({ className = 'h-4 w-4', children }: IconFrameProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

/** Fleet: a grid of four squares. */
export function FleetIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </IconFrame>
  )
}

/** Alerts: a triangle with an exclamation mark. */
export function AlertsIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M8 2 14.5 13.5h-13Z" />
      <path d="M8 6.5v3" />
      <path d="M8 11.5v.01" />
    </IconFrame>
  )
}

/** Admin: a terminal box with a prompt. */
export function AdminIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" />
      <path d="m4.5 6 2 2-2 2" />
      <path d="M8.5 10.5h3" />
    </IconFrame>
  )
}

/** Brand mark: a telemetry waveform. */
export function TelemetryIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M1 8h3l2-5 4 10 2-5h3" />
    </IconFrame>
  )
}

/** Settings: a gear. */
export function GearIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
    </IconFrame>
  )
}

/** Navigation: an arrow pointing right. */
export function ArrowRightIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M2.5 8h11" />
      <path d="m9.5 4 4 4-4 4" />
    </IconFrame>
  )
}

/** Pending: a clock face. */
export function ClockIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.5V8l2.5 1.5" />
    </IconFrame>
  )
}

/** Unset: a circle with a dash. */
export function UnsetIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5 8h6" />
    </IconFrame>
  )
}
