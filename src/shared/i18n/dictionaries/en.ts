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
    stale: 'No recent data',
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
    viewCrashedTitle: 'This view failed to load',
    viewCrashedBody: 'Retry, or go back to the fleet from the menu.',
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
    adminClients: {
      title: 'Clients',
      description: 'Client management is not available yet.',
    },
    adminUsers: {
      title: 'Users',
      description: 'User management is not available yet.',
    },
  },
  admin: {
    title: 'Admin',
    tabs: {
      label: 'Admin sections',
      unassigned: 'Unassigned devices',
      clients: 'Clients',
      users: 'Users',
    },
    unassigned: {
      column: {
        device: 'Device',
        mac: 'MAC address',
        transport: 'Transport',
        provisioned: 'Provisioned',
        lastSeen: 'Last seen',
      },
      provisioned: {
        yes: 'Yes',
        no: 'No',
      },
      empty: {
        title: 'Every device is assigned',
        body: 'Every device that has reported in already has an owner.',
      },
      error: {
        title: 'Unassigned devices unavailable',
        body: 'The device list could not be loaded. Try again.',
      },
    },
  },
  chart: {
    loading: 'Loading chart…',
    empty: 'No data for this range.',
    markedPoint: 'marked data point ({reasons})',
    meanOf: 'mean of {count} samples',
    marker: {
      outOfRange: 'out of range',
      suspect: 'suspect',
      clockUnsynced: 'clock unsynced',
      partial: 'partial',
    },
  },
  sensor: {
    breadcrumb: {
      label: 'Breadcrumb',
    },
    header: {
      unknownLabel: 'Sensor',
    },
    range: {
      label: 'Range',
      from: 'From',
      to: 'To',
      preset: {
        hour: '1 hour',
        day: '24 hours',
        week: '7 days',
        month: '30 days',
        quarter: '90 days',
        year: '1 year',
      },
    },
    granularity: {
      label: 'Granularity',
      auto: 'Auto ({resolved})',
      raw: 'Raw',
      hourly: 'Hourly',
      daily: 'Daily',
    },
    export: {
      action: 'Export CSV',
      inProgress: 'Exporting…',
    },
    degraded: {
      aggregationStale:
        'Aggregated data is behind; newest points may be missing.',
      newestPointPartial:
        'The newest point is provisional and may still change.',
    },
  },
  config: {
    requested: 'Requested {seconds} s · {relative}',
    notConfigured: 'Not configured',
    samplingIntervalLabel: 'Sampling interval (seconds)',
    rangeError: 'Enter a value between {min} and {max} seconds.',
    apply: 'Apply',
    save: 'Save',
    error: {
      invalidInterval:
        'Invalid interval. Enter a value between 1 and 300 seconds.',
      notDelivered:
        'Interval saved, but the device was not notified. Apply it again to retry.',
      generic: 'Could not update the sampling interval. Try again.',
    },
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
