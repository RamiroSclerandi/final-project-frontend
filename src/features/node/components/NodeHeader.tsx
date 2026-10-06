import type { ReactNode } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { GearIcon } from '../../../shared/design-system/atoms/icons'
import { RelativeTime } from '../../../shared/design-system/atoms/RelativeTime'
import { SignalBars } from '../../../shared/design-system/atoms/SignalBars'
import { StatusChip } from '../../../shared/design-system/molecules/StatusChip'
import type { NodeStatus } from '../../../shared/design-system/atoms/StatusDot'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { rssiToBars } from '../domain/rssiToBars'

export interface NodeHeaderProps {
  name: string
  location: string | null
  status: NodeStatus
  lastSeen: string | null
  firmwareVersion: string | null
  transport: string
  rssi: number | null
  /** Omitted until the configuration drawer ships; the button disables itself. */
  onOpenConfig?: () => void
}

/**
 * Node detail header (REQ-NODE-1): status (icon+text via `StatusChip`),
 * signal strength (`SignalBars`, D12 fallback to the `unknown` variant),
 * firmware version, last seen (`RelativeTime`), and transport. Status is
 * never color-only (REQ-NODE-4) -- every indicator here pairs an icon with
 * visible text.
 */
export function NodeHeader({
  name,
  location,
  status,
  lastSeen,
  firmwareVersion,
  transport,
  rssi,
  onOpenConfig,
}: NodeHeaderProps) {
  const { t } = useTranslation()
  const notAvailable = t('common.notAvailable')
  const bars = rssiToBars(rssi)
  const rssiLabel =
    rssi === null ? t('status.unknown') : t('node.header.rssi', { rssi })

  return (
    <header className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-text">{name}</h1>
          <p className="text-sm text-text-muted">{location ?? notAvailable}</p>
        </div>
        <Button
          variant="secondary"
          disabled={!onOpenConfig}
          onClick={onOpenConfig}
        >
          <span className="inline-flex items-center gap-2">
            <GearIcon />
            {t('node.header.configure')}
          </span>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-3">
        <StatusChip status={status} />
        <span className={FACT_DIVIDER}>
          <span className="font-mono text-xs tabular-nums text-text">
            <SignalBars bars={bars} label={rssiLabel} />
          </span>
        </span>
        <span className={FACT_DIVIDER}>
          {lastSeen ? (
            <Fact label={t('node.header.lastSeenLabel')}>
              <RelativeTime iso={lastSeen} />
            </Fact>
          ) : (
            <MissingFact>{`${t('node.header.lastSeenLabel')} ${notAvailable}`}</MissingFact>
          )}
        </span>
        <span className={FACT_DIVIDER}>
          {firmwareVersion ? (
            <Fact label={t('node.header.firmwareLabel')}>
              {firmwareVersion}
            </Fact>
          ) : (
            <MissingFact>
              {t('node.header.firmware', { version: notAvailable })}
            </MissingFact>
          )}
        </span>
        <span className={FACT_DIVIDER}>
          <Fact label={t('node.header.transportLabel')}>{transport}</Fact>
        </span>
      </div>
    </header>
  )
}

const FACT_DIVIDER = 'md:border-l md:border-border md:pl-4'

interface FactProps {
  label: string
  children: ReactNode
}

/** An uppercase 2xs label followed by its mono value. */
function Fact({ label, children }: FactProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-2xs font-medium tracking-label text-text-muted uppercase">
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums text-text">
        {children}
      </span>
    </span>
  )
}

/** A fact with no data keeps its single labelled "Not available" string. */
function MissingFact({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-text-muted">{children}</span>
}
