import type { Dictionary } from '../dictionary'

/**
 * Spanish dictionary (D9). Typed against `Dictionary` so a missing or extra
 * key is a compile error; `dictionaries.parity.test.ts` is the runtime
 * regression guard for the same invariant.
 */
export const es: Dictionary = {
  shell: {
    brand: 'Fleet Monitor',
    skipToContent: 'Saltar al contenido',
    nav: {
      label: 'Navegación principal',
      fleet: 'Flota',
      alerts: 'Alertas',
      admin: 'Administración',
    },
    locale: {
      label: 'Idioma',
      es: 'Español',
      en: 'English',
    },
    theme: {
      toggle: 'Cambiar tema',
    },
    tenant: {
      label: 'Cliente',
    },
    logout: 'Cerrar sesión',
  },
  status: {
    online: 'En línea',
    stale: 'Sin datos recientes',
    offline: 'Desconectado',
    unknown: 'Desconocido',
  },
  quality: {
    ok: 'OK',
    outOfRange: 'Fuera de rango',
    suspect: 'Sospechoso',
    provisional: 'Provisional',
  },
  common: {
    notAvailable: 'No disponible',
    retry: 'Reintentar',
    dismiss: 'Descartar',
    viewCrashedTitle: 'No se pudo cargar esta vista',
    viewCrashedBody: 'Reintentá o volvé a la flota desde el menú.',
  },
  connection: {
    connecting: 'Conectando…',
    live: 'En vivo',
    reconnecting: 'Reconectando…',
    down: 'Desconectado',
  },
  fleet: {
    title: 'Flota',
    kpi: {
      nodes: { one: '{count} nodo', other: '{count} nodos' },
      online: 'En línea',
      offline: 'Desconectado',
      qualityAlerts: 'Alertas de calidad de datos',
    },
    column: {
      node: 'Nodo',
      location: 'Ubicación',
      status: 'Estado',
      headline: 'Último valor',
      lastSeen: 'Visto por última vez',
      trend: 'Últimos 60 min',
      alerts: 'Calidad de datos',
    },
    filter: {
      all: 'Todos',
      online: 'En línea',
      offline: 'Desconectado',
      withAlerts: 'Con alertas',
      search: 'Buscar nodos',
    },
    empty: {
      title: 'Aún no hay nodos',
      body: 'Aprovisionar un dispositivo para verlo aquí.',
    },
    filteredEmpty: {
      title: 'Ningún nodo coincide con los filtros',
      body: 'Probar con otro estado o término de búsqueda.',
    },
    error: {
      title: 'Flota no disponible',
      body: 'No se pudo cargar la flota. Reintentar.',
    },
  },
  auth: {
    login: {
      email: 'Correo electrónico',
      password: 'Contraseña',
      submit: 'Iniciar sesión',
    },
  },
  node: {
    header: {
      configure: 'Configurar',
      firmware: 'Firmware: {version}',
      transport: 'Transporte: {transport}',
      rssi: 'Señal: {rssi} dBm',
      lastSeenLabel: 'Visto por última vez:',
    },
    phase: {
      l1: 'L1',
      l2: 'L2',
      l3: 'L3',
      total: 'Total',
      value: 'Valor',
    },
    channel: {
      temperature: 'Temperatura',
      pressure: 'Presión',
      humidity: 'Humedad',
      voltage: 'Voltaje',
      current: 'Corriente',
      power: 'Potencia',
      illuminance: 'Iluminancia',
      co2: 'CO2',
      soilMoisture: 'Humedad del suelo',
      frequency: 'Frecuencia',
      reactivePower: 'Potencia reactiva',
      apparentPower: 'Potencia aparente',
      powerFactor: 'Factor de potencia',
      activeEnergy: 'Energía activa',
    },
    config: {
      title: 'Configurar {name}',
    },
    notFound: {
      title: 'Nodo no encontrado',
      body: 'Este nodo no existe o ya no está disponible.',
      backLink: 'Volver a la flota',
    },
    empty: {
      title: 'Aún no hay lecturas',
      body: 'Este nodo todavía no reportó datos de sensores.',
    },
    error: {
      title: 'Nodo no disponible',
      body: 'No se pudo cargar este nodo. Reintentar.',
    },
  },
  reserved: {
    alerts: {
      title: 'Alertas',
      description: 'La función de alertas aún no está disponible.',
    },
    adminClients: {
      title: 'Clientes',
      description: 'La gestión de clientes aún no está disponible.',
    },
    adminUsers: {
      title: 'Usuarios',
      description: 'La gestión de usuarios aún no está disponible.',
    },
  },
  admin: {
    title: 'Administración',
    tabs: {
      label: 'Secciones de administración',
      unassigned: 'Dispositivos sin asignar',
      clients: 'Clientes',
      users: 'Usuarios',
    },
    unassigned: {
      column: {
        device: 'Dispositivo',
        mac: 'Dirección MAC',
        transport: 'Transporte',
        provisioned: 'Aprovisionado',
        lastSeen: 'Visto por última vez',
      },
      provisioned: {
        yes: 'Sí',
        no: 'No',
      },
      empty: {
        title: 'Todos los dispositivos están asignados',
        body: 'Todo dispositivo que reportó ya tiene un propietario.',
      },
      error: {
        title: 'Dispositivos sin asignar no disponibles',
        body: 'No se pudo cargar la lista de dispositivos. Reintentar.',
      },
    },
  },
  chart: {
    loading: 'Cargando gráfico…',
    empty: 'No hay datos para este rango.',
    markedPoint: 'punto de datos marcado ({reasons})',
    meanOf: 'media de {count} muestras',
    marker: {
      outOfRange: 'fuera de rango',
      suspect: 'sospechoso',
      clockUnsynced: 'reloj desincronizado',
      partial: 'parcial',
    },
  },
  sensor: {
    breadcrumb: {
      label: 'Ruta de navegación',
    },
    header: {
      unknownLabel: 'Sensor',
    },
    range: {
      label: 'Rango',
      from: 'Desde',
      to: 'Hasta',
      live: 'Ahora (en vivo)',
      preset: {
        minutes5: '5 min',
        minutes15: '15 min',
        minutes30: '30 min',
        hours1: '1 hora',
        hours6: '6 horas',
        hours24: '24 horas',
        days15: '15 días',
        days30: '30 días',
        days90: '90 días',
        days180: '180 días',
        days365: '1 año',
      },
    },
    granularity: {
      label: 'Granularidad',
      auto: 'Automático ({resolved})',
      raw: 'Sin procesar',
      minute: 'Por minuto',
      hourly: 'Por hora',
      daily: 'Diario',
    },
    export: {
      action: 'Exportar CSV',
      inProgress: 'Exportando…',
    },
    degraded: {
      aggregationStale:
        'Los datos agregados están desactualizados; podrían faltar los puntos más recientes.',
      newestPointPartial:
        'El punto más reciente es provisional y podría cambiar.',
    },
  },
  config: {
    requested: 'Solicitado {seconds} s · {relative}',
    notConfigured: 'Sin configurar',
    samplingIntervalLabel: 'Intervalo de muestreo (segundos)',
    rangeError: 'Ingresar un valor entre {min} y {max} segundos.',
    apply: 'Aplicar',
    save: 'Guardar',
    error: {
      invalidInterval:
        'Intervalo inválido. Ingresá un valor entre 1 y 300 segundos.',
      notDelivered:
        'El intervalo se guardó, pero el equipo no fue notificado. Aplicalo de nuevo para reintentar.',
      generic:
        'No se pudo actualizar el intervalo de muestreo. Intentá de nuevo.',
    },
    device: {
      name: 'Nombre',
      location: 'Ubicación',
      transport: 'Transporte',
      provisioned: 'Aprovisionado',
    },
    sensor: {
      label: 'Etiqueta',
      pin: 'Pin',
    },
  },
}
