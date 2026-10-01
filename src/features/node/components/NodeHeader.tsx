import { Button } from '../../../shared/design-system/atoms/Button'
import { Chip } from '../../../shared/design-system/atoms/Chip'
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
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">{name}</h1>
          <p className="text-sm text-text-muted">{location ?? notAvailable}</p>
        </div>
        <Button
          variant="secondary"
          disabled={!onOpenConfig}
          onClick={onOpenConfig}
        >
          {t('node.header.configure')}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip status={status} />
        <SignalBars bars={bars} label={rssiLabel} />
        <Chip>
          {lastSeen ? (
            <span>
              {t('node.header.lastSeenLabel')} <RelativeTime iso={lastSeen} />
            </span>
          ) : (
            `${t('node.header.lastSeenLabel')} ${notAvailable}`
          )}
        </Chip>
        <Chip>
          {t('node.header.firmware', {
            version: firmwareVersion ?? notAvailable,
          })}
        </Chip>
        <Chip>{t('node.header.transport', { transport })}</Chip>
      </div>
    </header>
  )
}
