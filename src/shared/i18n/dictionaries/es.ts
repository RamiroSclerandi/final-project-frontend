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
    offline: 'Desconectado',
    unknown: 'Desconocido',
  },
  common: {
    notAvailable: 'No disponible',
    retry: 'Reintentar',
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
  reserved: {
    alerts: {
      title: 'Alertas',
      description: 'La función de alertas aún no está disponible.',
    },
    admin: {
      title: 'Administración',
      description: 'El área de administración aún no está disponible.',
    },
    comingSoon: {
      title: 'Próximamente',
      description: 'Esta vista aún no está disponible.',
    },
  },
}
