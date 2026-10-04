import { appConfig } from '../../config/app.config.js';
import { createId } from '../shared/utils/id.js';
import { createListenerGroup } from '../shared/utils/listen.js';
import { createBrowserStorage } from '../infrastructure/storage/browser-storage.js';
import { createJsonStore } from '../infrastructure/storage/json-store.js';
import { queryApp } from './dom.js';
import { createToast } from '../ui/toast.js';
import { createMotion } from '../ui/motion.js';
import { seedPets } from '../modules/catalog/seed.js';
import { createPetRepository } from '../modules/catalog/repository.js';
import { createCatalogService } from '../modules/catalog/service.js';
import { createCatalogController } from '../modules/catalog/controller.js';
import { createFavoritesRepository } from '../modules/favorites/repository.js';
import { createFavoritesService } from '../modules/favorites/service.js';
import { createAdoptionRepository } from '../modules/adoptions/repository.js';
import { createAdoptionService } from '../modules/adoptions/service.js';
import { createAdoptionController } from '../modules/adoptions/controller.js';
import { createAccountRepository, createSessionRepository } from '../modules/auth/repository.js';
import { createAuthService } from '../modules/auth/service.js';
import { createAuthController } from '../modules/auth/controller.js';
import { createCompatibilityRepository, createCompatibilityService } from '../modules/compatibility/service.js';
import { createCompatibilityController } from '../modules/compatibility/controller.js';
import { refuges } from '../modules/refuges/data.js';
import { createRefugeMapController } from '../modules/refuges/controller.js';
import { createRefugePanelController } from '../modules/refuge-panel/controller.js';
import { createThemeController } from '../modules/theme/controller.js';
import { computeImpactStats } from '../modules/stats/service.js';

export function createApp({
  document,
  window,
  localStorage,
  sessionStorage,
  config = appConfig
}) {
  const persistent = createBrowserStorage(localStorage);
  const sessions = createBrowserStorage(sessionStorage);
  const catalog = createCatalogService({
    repository: createPetRepository(createJsonStore(persistent, config.keys.pets), seedPets),
    createId: () => createId(window.crypto)
  });
  const favorites = createFavoritesService(
    createFavoritesRepository(createJsonStore(persistent, config.keys.favorites))
  );
  const adoptions = createAdoptionService(
    createAdoptionRepository(createJsonStore(persistent, config.keys.adoptions)),
    { createId: () => createId(window.crypto) }
  );
  const auth = createAuthService({
    accounts: createAccountRepository(createJsonStore(persistent, config.keys.accounts)),
    session: createSessionRepository(sessions, config.keys.session),
    crypto: window.crypto,
    password: config.password
  });
  const compatibility = createCompatibilityService(
    createCompatibilityRepository(createJsonStore(persistent, config.keys.compatibility))
  );
  const dom = queryApp(document);
  const toast = createToast(dom.authToast, window);
  const motion = createMotion({ document, window });
  const shell = createListenerGroup();

  const actions = {
    notify(message) {
      toast.show(message);
    },
    observe(root) {
      motion.observe(root);
    },
    renderPets() {
      catalogController.render();
    },
    renderRecommendations() {
      compatibilityController.renderRecommendations();
    },
    renderTracking() {
      adoptionController.renderTracking();
    },
    openAdoption(id) {
      adoptionController.openForm(id);
    },
    openDetail(id) {
      catalogController.openDetail(id);
    },
    openTracking() {
      adoptionController.openTracking();
    },
    askForAccount(message, pending) {
      authController.ask(message, pending);
    },
    afterCatalogChange() {
      catalogController.render();
      compatibilityController.renderRecommendations();
      paintStats();
    },
    afterRequestsChange() {
      paintStats();
      adoptionController.renderTracking();
      refugePanel.render();
    }
  };

  const catalogController = createCatalogController({
    document, window, dom, catalog, favorites, actions, config
  });
  const adoptionController = createAdoptionController({
    document, window, dom, catalog, adoptions, auth, actions, config
  });
  const authController = createAuthController({ document, window, dom, auth, actions });
  const compatibilityController = createCompatibilityController({
    document, dom, catalog, favorites, compatibility, actions
  });
  const refugeMap = createRefugeMapController({
    document, window, dom, refuges, mapConfig: config.map
  });
  const refugePanel = createRefugePanelController({
    document, window, dom, catalog, adoptions, actions, config
  });
  const theme = createThemeController({
    document,
    storage: persistent,
    key: config.keys.theme,
    toggle: dom.themeToggle
  });

  function paintStats() {
    const stats = computeImpactStats(catalog.getPets(), adoptions.list());
    dom.statsAvailable.textContent = String(stats.available);
    dom.statsRequests.textContent = String(stats.requests);
    dom.statsFamilies.textContent = String(stats.families);
    dom.petCount.textContent = String(stats.available);
  }

  function bindShell() {
    document.querySelectorAll('[data-open-requests]').forEach((button) => {
      shell.on(button, 'click', () => {
        if (auth.current()) adoptionController.openTracking();
        else authController.ask('Inicia sesión para consultar el estado de tus solicitudes.', { tracking: true });
      });
    });
    document.querySelectorAll('[data-open-refuge]').forEach((button) => {
      shell.on(button, 'click', () => refugePanel.open());
    });
    document.querySelectorAll('[data-close-dialog]').forEach((button) => {
      shell.on(button, 'click', () => {
        const dialogId = button.dataset.closeDialog;
        if (dialogId !== 'tracking-dialog' && dialogId !== 'refuge-dialog') return;
        document.querySelector(`#${dialogId}`)?.close();
      });
    });
  }

  function start() {
    try {
      adoptions.migrate();
    } catch {
      // Una cuota llena no debe impedir ver el catálogo.
    }
    try {
      favorites.persist();
    } catch {
      // Igual que arriba: la lista en memoria sigue usable.
    }
    theme.apply(persistent.getItem(config.keys.theme));
    bindShell();
    catalogController.bind();
    adoptionController.bind();
    authController.bind();
    compatibilityController.bind();
    refugeMap.bind();
    refugePanel.bind();
    theme.bind();
    catalogController.renderFilters();
    catalogController.render();
    compatibilityController.renderRecommendations();
    paintStats();
    refugeMap.initialize();
    motion.observe(document);
    authController.updateTrigger();
    motion.bindParallax();
  }

  function destroy() {
    shell.destroy();
    catalogController.destroy();
    adoptionController.destroy();
    authController.destroy();
    compatibilityController.destroy();
    refugeMap.destroy();
    refugePanel.destroy();
    theme.destroy();
    motion.destroy();
    toast.destroy();
  }

  return { start, destroy, catalog, favorites, adoptions, auth, compatibility };
}
