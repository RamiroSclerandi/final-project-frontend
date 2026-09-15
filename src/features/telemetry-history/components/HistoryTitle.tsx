export interface HistoryTitleReading {
  deviceName: string
  sensorLabel: string | null
  channel: string
}

export interface HistoryTitleProps {
  reading?: HistoryTitleReading
}

/** Device name + sensor label (fallback: channel) instead of the raw sensor UUID. */
export function HistoryTitle({ reading }: HistoryTitleProps) {
  if (!reading) {
    return <h1 className="text-xl font-semibold">Sensor history</h1>
  }
  return (
    <h1 className="text-xl font-semibold">
      {reading.deviceName} — {reading.sensorLabel ?? reading.channel} history
    </h1>
  )
}
