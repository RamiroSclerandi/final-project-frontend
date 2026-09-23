import { Link } from 'react-router-dom'

import { Value } from '../../../shared/design-system/atoms/Value'
import {
  QualityMark,
  type Quality,
} from '../../../shared/design-system/atoms/QualityMark'
import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { SensorChannelGroup } from '../domain/nodeReading'

export interface SensorGroupProps {
  group: SensorChannelGroup
  nodeId: string
}

const PHASE_LABEL_KEYS: Record<'l1' | 'l2' | 'l3' | 'total', TranslationKey> = {
  l1: 'node.phase.l1',
  l2: 'node.phase.l2',
  l3: 'node.phase.l3',
  total: 'node.phase.total',
}

const QUALITY_KEYS: Record<Quality, TranslationKey> = {
  ok: 'quality.ok',
  out_of_range: 'quality.outOfRange',
  suspect: 'quality.suspect',
  provisional: 'quality.provisional',
}

function isNamedPhaseTag(tag: string): tag is keyof typeof PHASE_LABEL_KEYS {
  return tag in PHASE_LABEL_KEYS
}

/**
 * A phase's visible name. The header and the stacked-row caption both read it,
 * so a cell can never end up labelled differently from its own column.
 */
function phaseLabel(
  phase: SensorChannelGroup['phases'][number],
  t: (key: TranslationKey) => string,
): string {
  return isNamedPhaseTag(phase.tag)
    ? t(PHASE_LABEL_KEYS[phase.tag])
    : (phase.label ?? t('node.phase.value'))
}

const KNOWN_QUALITIES: readonly Quality[] = [
  'ok',
  'out_of_range',
  'suspect',
  'provisional',
]

/** An unrecognised raw quality string defaults to `ok`, same as telemetry's own `normalizeQuality`. */
function toQuality(value: string): Quality {
  return (KNOWN_QUALITIES as readonly string[]).includes(value)
    ? (value as Quality)
    : 'ok'
}

/**
 * One magnitude's sensors as phase columns (REQ-NODE-2, #412): L1/L2/L3/Total
 * when the magnitude has all four, or a single unlabeled column for a
 * magnitude with only one, untagged sensor (REQ-NODE-3).
 */
export function SensorGroup({ group, nodeId }: SensorGroupProps) {
  const { t } = useTranslation()

  return (
    <table role="table" className="table-stack min-w-0 w-full tabular-nums">
      <caption className="text-left text-sm text-text-muted">
        {group.channel} · {group.unit}
      </caption>
      <thead>
        <tr role="row">
          {group.phases.map((phase) => (
            <th key={phase.sensorId} role="columnheader" scope="col">
              {phaseLabel(phase, t)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr role="row">
          {group.phases.map((phase) => (
            <td
              key={phase.sensorId}
              role="cell"
              data-label={phaseLabel(phase, t)}
            >
              <Link
                to={`/nodes/${nodeId}/sensors/${phase.sensorId}`}
                className="inline-flex min-h-11 flex-col gap-1 text-accent"
              >
                <Value value={phase.value} unit={group.unit} />
                <QualityMark
                  quality={toQuality(phase.quality)}
                  label={t(QUALITY_KEYS[toQuality(phase.quality)])}
                />
              </Link>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}
