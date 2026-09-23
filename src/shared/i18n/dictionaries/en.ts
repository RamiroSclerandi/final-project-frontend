/**
 * Canonical English dictionary (D9). A plain object, not `as const`, so leaf
 * values stay typed as `string` and `Dictionary` (in `../dictionary.ts`)
 * derives its shape from this file.
 *
 * Per the tasks cross-PR invariant, a key is added in the same task as the
 * component that first consumes it -- these sections were added in PR-2 by
 * `StatusChip` (status.*) and `LocaleToggle`/`ThemeToggle` (shell.*).
 */
export const en = {
  shell: {
    brand: 'Fleet Monitor',
    skipToContent: 'Skip to content',
    nav: {
      label: 'Main navigation',
      fleet: 'Fleet',
      alerts: 'Alerts',
      admin: 'Admin',
    },
    locale: {
      label: 'Language',
      es: 'Español',
      en: 'English',
    },
    theme: {
      toggle: 'Toggle theme',
    },
    tenant: {
      label: 'Tenant',
    },
    logout: 'Log out',
  },
  status: {
    online: 'Online',
    offline: 'Offline',
    unknown: 'Unknown',
  },
  quality: {
    ok: 'OK',
    outOfRange: 'Out of range',
    suspect: 'Suspect',
    provisional: 'Provisional',
  },
  common: {
    notAvailable: 'Not available',
    retry: 'Retry',
    dismiss: 'Dismiss',
  },
  connection: {
    connecting: 'Connecting…',
    live: 'Live',
    reconnecting: 'Reconnecting…',
    down: 'Disconnected',
  },
  fleet: {
    title: 'Fleet',
    kpi: {
      nodes: { one: '{count} node', other: '{count} nodes' },
      online: 'Online',
      offline: 'Offline',
      qualityAlerts: 'Data-quality alerts',
    },
    column: {
      node: 'Node',
      location: 'Location',
      status: 'Status',
      headline: 'Latest value',
      lastSeen: 'Last seen',
      trend: 'Last 60 min',
      alerts: 'Data quality',
    },
    filter: {
      all: 'All',
      online: 'Online',
      offline: 'Offline',
      withAlerts: 'With alerts',
      search: 'Search nodes',
    },
    empty: {
      title: 'No nodes yet',
      body: 'Provision a device to see it here.',
    },
    filteredEmpty: {
      title: 'No nodes match the filters',
      body: 'Try a different status or search term.',
    },
    error: {
      title: 'Fleet unavailable',
      body: 'The fleet list could not be loaded. Try again.',
    },
  },
  auth: {
    login: {
      email: 'Email',
      password: 'Password',
      submit: 'Log in',
    },
  },
  node: {
    header: {
      configure: 'Configure',
      firmware: 'Firmware: {version}',
      transport: 'Transport: {transport}',
      rssi: 'Signal: {rssi} dBm',
      lastSeenLabel: 'Last seen:',
    },
    phase: {
      l1: 'L1',
      l2: 'L2',
      l3: 'L3',
      total: 'Total',
      value: 'Value',
    },
    channel: {
      temperature: 'Temperature',
      pressure: 'Pressure',
      humidity: 'Humidity',
      voltage: 'Voltage',
      current: 'Current',
      power: 'Power',
      illuminance: 'Illuminance',
      co2: 'CO2',
      soilMoisture: 'Soil moisture',
      frequency: 'Frequency',
      reactivePower: 'Reactive power',
      apparentPower: 'Apparent power',
      powerFactor: 'Power factor',
      activeEnergy: 'Active energy',
    },
    config: {
      title: 'Configure {name}',
    },
    notFound: {
      title: 'Node not found',
      body: 'This node does not exist or is no longer available.',
      backLink: 'Back to fleet',
    },
    empty: {
      title: 'No readings yet',
      body: 'This node has not reported any sensor data yet.',
    },
    error: {
      title: 'Node unavailable',
      body: 'This node could not be loaded. Try again.',
    },
  },
  reserved: {
    alerts: {
      title: 'Alerts',
      description: 'Alerting is not available yet.',
    },
    admin: {
      title: 'Admin',
      description: 'The admin area is not available yet.',
    },
    comingSoon: {
      title: 'Coming soon',
      description: 'This view is not available yet.',
    },
  },
  config: {
    requested: 'Requested {seconds} s · {relative}',
    notConfigured: 'Not configured',
    samplingIntervalLabel: 'Sampling interval (seconds)',
    rangeError: 'Enter a value between {min} and {max} seconds.',
    apply: 'Apply',
    save: 'Save',
    device: {
      name: 'Name',
      location: 'Location',
      transport: 'Transport',
      provisioned: 'Provisioned',
    },
    sensor: {
      label: 'Label',
      pin: 'Pin',
    },
  },
}
