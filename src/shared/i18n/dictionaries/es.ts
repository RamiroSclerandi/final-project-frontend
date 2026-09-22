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
