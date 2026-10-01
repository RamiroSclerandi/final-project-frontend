import { Link } from 'react-router-dom'

import { Value } from '../../../shared/design-system/atoms/Value'
import {
  QualityMark,
  type Quality,
} from '../../../shared/design-system/atoms/QualityMark'
import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { unitLabel } from '../../../shared/lib/unitLabel'
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

// The seeded `sensor_types.name` values (#412). Anything unseeded falls back
// to the raw channel name in `channelLabel` below rather than crashing.
// `satisfies` (not an explicit `Record<string, ...>` annotation) keeps the
// literal key union so `keyof typeof CHANNEL_LABEL_KEYS` narrows to those 14
// keys instead of widening to `string`.
const CHANNEL_LABEL_KEYS = {
  temperature: 'node.channel.temperature',
  pressure: 'node.channel.pressure',
  humidity: 'node.channel.humidity',
  voltage: 'node.channel.voltage',
  current: 'node.channel.current',
  power: 'node.channel.power',
  illuminance: 'node.channel.illuminance',
  co2: 'node.channel.co2',
  soil_moisture: 'node.channel.soilMoisture',
  frequency: 'node.channel.frequency',
  reactive_power: 'node.channel.reactivePower',
  apparent_power: 'node.channel.apparentPower',
  power_factor: 'node.channel.powerFactor',
  active_energy: 'node.channel.activeEnergy',
} satisfies Record<string, TranslationKey>

// `in` also matches inherited Object.prototype keys (e.g. a tag of literally
// "constructor"), which would then resolve to Object's own constructor
// function instead of falling back. `Object.hasOwn` is the correct
// own-property check.
function isNamedPhaseTag(tag: string): tag is keyof typeof PHASE_LABEL_KEYS {
  return Object.hasOwn(PHASE_LABEL_KEYS, tag)
}

function isKnownChannel(
  channel: string,
): channel is keyof typeof CHANNEL_LABEL_KEYS {
  return Object.hasOwn(CHANNEL_LABEL_KEYS, channel)
}

/**
 * A magnitude's translated display name (debt fix: the caption used to
 * render the raw snake_case `sensor_types.name` straight from the backend).
 * Falls back to the raw channel string for anything unseeded so an unknown
 * future magnitude never crashes the page.
 */
function channelLabel(
  channel: string,
  t: (key: TranslationKey) => string,
): string {
  return isKnownChannel(channel) ? t(CHANNEL_LABEL_KEYS[channel]) : channel
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
        {[channelLabel(group.channel, t), unitLabel(group.unit)]
          .filter(Boolean)
          .join(' · ')}
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
