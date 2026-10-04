import { firebaseConfig as defaultFirebaseConfig } from '../../config/firebase.config.js';
import { validateFirebaseConfig } from '../infrastructure/firebase/validate-config.js';
import { createRemoteStack } from '../infrastructure/firebase/stack.js';
import { userMessage } from '../shared/errors.js';
import { createLocalServices } from './local-services.js';

export function selectBackend({ firebaseConfig, storage, backendKey }) {
  if (storage?.getItem?.(backendKey) === 'local') return { mode: 'local', notice: null };
  if (!firebaseConfig || firebaseConfig.enabled !== true) return { mode: 'local', notice: null };
  try {
    validateFirebaseConfig(firebaseConfig);
    return { mode: 'firebase', notice: null };
  } catch (error) {
    return {
      mode: 'local',
      notice: userMessage(error, 'La configuración de Firebase no es válida.')
    };
  }
}

export async function resolveServices({
  window,
  localStorage,
  sessionStorage,
  config,
  firebaseConfig = defaultFirebaseConfig
}) {
  const decision = selectBackend({
    firebaseConfig,
    storage: localStorage,
    backendKey: config.keys.backend
  });
  if (decision.mode === 'local') {
    return { ...createLocalServices({ window, localStorage, sessionStorage, config }), notice: decision.notice };
  }

  try {
    return await createRemoteStack({ window, localStorage, config, firebaseConfig });
  } catch (error) {
    return {
      ...createLocalServices({ window, localStorage, sessionStorage, config }),
      notice: userMessage(error, 'No hay conexión con Firebase. Seguimos guardando los datos en este navegador.')
    };
  }
}
