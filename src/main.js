import { AdoptionTools } from './lib/adopta-mascota-lib.js';

const pets = [
  {
    id: 1,
    nombre: 'Milo',
    especie: 'Perro',
    raza: 'Mestizo',
    edad: '2 años',
    categoria: 'Perros',
    foto: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=900&q=85',
    descripcion: 'Un compañero alegre que convierte cualquier paseo en una aventura.'
  },
  {
    id: 2,
    nombre: 'Luna',
    especie: 'Gato',
    raza: 'Gato doméstico',
    edad: '1 año',
    categoria: 'Gatos',
    foto: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85',
    descripcion: 'Curiosa, dulce y experta en encontrar los rayitos de sol.'
  },
  {
    id: 3,
    nombre: 'Toby',
    especie: 'Perro',
    raza: 'Labrador mestizo',
    edad: '3 años',
    categoria: 'Perros',
    foto: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=85',
    descripcion: 'Tranquilo y cariñoso. Su plan favorito es estar cerca de ti.'
  },
  {
    id: 4,
    nombre: 'Nala',
    especie: 'Gato',
    raza: 'Gato doméstico',
    edad: '8 meses',
    categoria: 'Gatos',
    foto: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85',
    descripcion: 'Una pequeña exploradora que llena la casa de energía y ternura.'
  },
  {
    id: 5,
    nombre: 'Bruno',
    especie: 'Perro',
    raza: 'Border collie mestizo',
    edad: '4 años',
    categoria: 'Perros',
    foto: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=85',
    descripcion: 'Inteligente, noble y listo para ser tu compañero de equipo.'
  },
  {
    id: 6,
    nombre: 'Mora',
    especie: 'Gato',
    raza: 'Gato doméstico',
    edad: '2 años',
    categoria: 'Gatos',
    foto: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=85',
    descripcion: 'Serena y observadora; se gana tu confianza con ronroneos.'
  }
];

function readCatalogPets() {
  try {
    const saved = JSON.parse(localStorage.getItem('adopme-pets') || 'null');
    const catalog = Array.isArray(saved) ? saved : pets;
    return catalog.map((pet) => ({ ...pet, estado: pet.estado || 'Disponible' }));
  } catch {
    return pets.map((pet) => ({ ...pet, estado: 'Disponible' }));
  }
}

function createId() {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

const adoptionTools = new AdoptionTools({
  pets: readCatalogPets(),
  categories: ['Perros', 'Gatos', 'Otros'],
  storagePrefix: 'adopme'
});
const requestStatuses = ['Recibida', 'En revisión', 'Visita pendiente', 'Aprobada', 'No aprobada', 'Adopción completada'];
const petStatuses = ['Disponible', 'En proceso', 'Adoptado'];
const storedRequests = adoptionTools.getAdoptionRequests();
let requestsMigrated = false;
storedRequests.forEach((request) => {
  if (!request.solicitudId) {
    request.solicitudId = createId();
    requestsMigrated = true;
  }
  if (!request.estadoSolicitud) {
    request.estadoSolicitud = 'Recibida';
    requestsMigrated = true;
  }
});
if (requestsMigrated) localStorage.setItem('adopme-adoptions', JSON.stringify(storedRequests));

function refreshPetCount() {
  const availableCount = adoptionTools.getPets().filter((pet) => (pet.estado || 'Disponible') === 'Disponible').length;
  document.querySelector('#pet-count').textContent = String(availableCount);
}

refreshPetCount();

const petGrid = document.querySelector('#pet-grid');
const searchInput = document.querySelector('#pet-search');
const resultsCount = document.querySelector('#results-count');
const emptyState = document.querySelector('#empty-state');
const savedFilter = document.querySelector('#saved-filter');
const savedCount = document.querySelector('#saved-count');
const adoptionDialog = document.querySelector('#adoption-dialog');
const adoptionForm = document.querySelector('#adoption-form');
const dialogFormView = document.querySelector('#dialog-form-view');
const dialogSuccess = document.querySelector('#dialog-success');
const authDialog = document.querySelector('#auth-dialog');
const authTrigger = document.querySelector('#auth-trigger');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const authFeedback = document.querySelector('#auth-feedback');
const authToast = document.querySelector('#auth-toast');
const trackingDialog = document.querySelector('#tracking-dialog');
const trackingList = document.querySelector('#tracking-list');
const refugeDialog = document.querySelector('#refuge-dialog');
const managedPets = document.querySelector('#managed-pets');
const managedRequests = document.querySelector('#managed-requests');
const petCreateForm = document.querySelector('#pet-create-form');
const petFormFeedback = document.querySelector('#pet-form-feedback');
let activeCategory = 'Todas';
let showSavedOnly = false;
let savedPets = readSavedPets();
let authSession = readAuthSession();
let toastTimeout;
let applicationStep = 1;
let pendingPetId = null;
let pendingTracking = false;

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' })
  : null;

function observeReveals(root = document) {
  root.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
  });
}

function readSavedPets() {
  try {
    return JSON.parse(localStorage.getItem('adopme-favorites') || '[]');
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem('adopme-favorites', JSON.stringify(savedPets));
  savedCount.textContent = String(savedPets.length);
}

function isPetSaved(petId) {
  return savedPets.some((savedId) => String(savedId) === String(petId));
}

function persistCatalog() {
  localStorage.setItem('adopme-pets', JSON.stringify(adoptionTools.getPets()));
  refreshPetCount();
  renderPets();
}

function renderPets() {
  const matchingPets = adoptionTools.searchAndFilter(searchInput.value, activeCategory)
    .filter((pet) => pet.estado !== 'Adoptado')
    .filter((pet) => !showSavedOnly || isPetSaved(pet.id));

  const availableCount = matchingPets.filter((pet) => (pet.estado || 'Disponible') === 'Disponible').length;
  const pendingCount = matchingPets.length - availableCount;
  resultsCount.textContent = pendingCount
    ? `${availableCount} disponibles · ${pendingCount} en proceso`
    : `${availableCount} ${availableCount === 1 ? 'compañero disponible' : 'compañeros disponibles'}`;
  emptyState.hidden = matchingPets.length > 0;
  petGrid.hidden = matchingPets.length === 0;
  petGrid.innerHTML = matchingPets.map((pet, index) => {
    const isSaved = isPetSaved(pet.id);
    const status = pet.estado || 'Disponible';
    const isAvailable = status === 'Disponible';
    return `
      <article class="pet-card reveal" style="--reveal-delay:${Math.min(index, 4) * 75}ms">
        <div class="pet-photo-wrap">
          <img class="pet-photo" src="${escapeHtml(pet.foto)}" alt="${escapeHtml(pet.especie)} ${escapeHtml(pet.nombre)}, ${escapeHtml(pet.raza)}" loading="lazy" />
          <span class="pet-category">${escapeHtml(pet.especie)}</span>
          <button class="favorite-button${isSaved ? ' is-saved' : ''}" type="button" data-favorite="${escapeHtml(pet.id)}" aria-label="${isSaved ? 'Quitar' : 'Guardar'} a ${escapeHtml(pet.nombre)} ${isSaved ? 'de' : 'en'} favoritos" aria-pressed="${isSaved}"><span aria-hidden="true">${isSaved ? '♥' : '♡'}</span></button>
        </div>
        <div class="pet-card-body">
          <div class="pet-name-row"><h3>${escapeHtml(pet.nombre)}</h3><span>${escapeHtml(pet.edad)}</span></div>
          <p class="pet-breed">${escapeHtml(pet.raza)}</p>
          <span class="pet-status${isAvailable ? '' : ' is-pending'}">${escapeHtml(status)}</span>
          <p class="pet-description">${escapeHtml(pet.descripcion)}</p>
          <button class="meet-button" type="button" data-adopt="${escapeHtml(pet.id)}" ${isAvailable ? '' : 'disabled'}>${isAvailable ? 'Me gustaría conocerle' : 'En proceso de adopción'} <span aria-hidden="true">${isAvailable ? '↗' : ''}</span></button>
        </div>
      </article>`;
  }).join('');
  observeReveals(petGrid);
}

function openAdoptionForm(petId) {
  const pet = adoptionTools.getPetById(petId);
  if (!pet) return;

  if (!authSession) {
    pendingPetId = petId;
    setAuthMode('login');
    authFeedback.textContent = 'Inicia sesión o crea una cuenta para guardar y seguir tu solicitud.';
    authDialog.showModal();
    return;
  }

  document.querySelector('#selected-pet-name').textContent = pet.nombre;
  adoptionForm.reset();
  document.querySelector('#selected-pet-id').value = pet.id;
  document.querySelector('#selected-pet-name-input').value = pet.nombre;
  document.querySelector('#applicant-name').value = authSession.nombre;
  document.querySelector('#applicant-email').value = authSession.correo;
  setApplicationStep(1);
  dialogFormView.hidden = false;
  dialogSuccess.hidden = true;
  adoptionDialog.showModal();
}

function setApplicationStep(step) {
  applicationStep = step;
  document.querySelectorAll('[data-application-step]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.applicationStep) !== step;
    panel.classList.toggle('is-active', !panel.hidden);
  });
  document.querySelector('#application-step-label').textContent = `Paso ${step} de 3 · ${['Contacto', 'Tu hogar', 'Confirmación'][step - 1]}`;
  document.querySelector('#application-progress-fill').style.width = `${(step / 3) * 100}%`;
  document.querySelector('#application-back').hidden = step === 1;
  document.querySelector('#application-next').hidden = step === 3;
  document.querySelector('#application-submit').hidden = step !== 3;
}

function updateApplicationSummary() {
  const values = [
    ['Mascota', document.querySelector('#selected-pet-name-input').value],
    ['Hogar', adoptionForm.elements.tipoVivienda.value],
    ['Otras mascotas', adoptionForm.elements.otrasMascotas.value],
    ['Experiencia', adoptionForm.elements.experiencia.value]
  ];
  document.querySelector('#application-summary').innerHTML = values
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('');
}

function getRequestStatusOptions(currentStatus) {
  return requestStatuses.map((status) => `<option value="${escapeHtml(status)}" ${status === currentStatus ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('');
}

function getPetStatusOptions(currentStatus) {
  return petStatuses.map((status) => `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`).join('');
}

function renderTracking() {
  if (!authSession) {
    trackingList.innerHTML = '<p class="panel-empty">Inicia sesión para revisar tus solicitudes.</p>';
    return;
  }

  const requests = adoptionTools.getAdoptionRequests()
    .filter((request) => String(request.cuentaCorreo || '').toLowerCase() === authSession.correo.toLowerCase());

  if (requests.length === 0) {
    trackingList.innerHTML = '<p class="panel-empty">Aún no tienes solicitudes. Cuando encuentres a tu compañero, podrás seguir aquí cada paso.</p>';
    return;
  }

  const progressSteps = ['Recibida', 'En revisión', 'Visita pendiente', 'Aprobada', 'Adopción completada'];
  trackingList.innerHTML = requests.map((request) => {
    const date = new Date(request.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    const currentStatus = request.estadoSolicitud || 'Recibida';
    const currentStep = progressSteps.indexOf(currentStatus);
    const progress = currentStep < 0
      ? `<p class="tracking-outcome">${escapeHtml(currentStatus)}</p>`
      : `<ol class="status-timeline" aria-label="Progreso de la solicitud">${progressSteps.map((step, index) => `<li class="${index < currentStep ? 'is-complete' : ''} ${index === currentStep ? 'is-current' : ''}"><span class="timeline-dot"></span><span>${escapeHtml(step)}</span></li>`).join('')}</ol>`;
    return `<article class="tracking-item">
      <div class="tracking-item-heading"><div><p class="eyebrow eyebrow-dark">Solicitud del ${escapeHtml(date)}</p><h3>${escapeHtml(request.mascotaNombre || 'Mascota')}</h3></div><span class="status-chip">${escapeHtml(request.estadoSolicitud || 'Recibida')}</span></div>
      <p>${escapeHtml(request.tipoVivienda || 'Hogar por confirmar')} · ${escapeHtml(request.otrasMascotas || 'Convivencia por confirmar')}</p>
      ${progress}
      <span class="tracking-reference">Folio ${escapeHtml(request.solicitudId)}</span>
    </article>`;
  }).join('');
}

function renderManagedPets() {
  const catalog = adoptionTools.getPets();
  if (catalog.length === 0) {
    managedPets.innerHTML = '<p class="panel-empty">Aún no hay mascotas publicadas.</p>';
    return;
  }

  managedPets.innerHTML = catalog.map((pet) => `<article class="management-row">
    <img class="management-photo" src="${escapeHtml(pet.foto)}" alt="" loading="lazy" />
    <div class="management-details"><h3>${escapeHtml(pet.nombre)}</h3><p>${escapeHtml(pet.especie)} · ${escapeHtml(pet.raza)} · ${escapeHtml(pet.edad)}</p></div>
    <label class="management-state">Disponibilidad<select data-pet-status="${escapeHtml(pet.id)}">${getPetStatusOptions(pet.estado || 'Disponible')}</select></label>
    <button class="remove-pet" type="button" data-delete-pet="${escapeHtml(pet.id)}" aria-label="Eliminar a ${escapeHtml(pet.nombre)}">Eliminar</button>
  </article>`).join('');
}

function renderManagedRequests() {
  const requests = adoptionTools.getAdoptionRequests();
  document.querySelector('#panel-request-count').textContent = String(requests.length);
  if (requests.length === 0) {
    managedRequests.innerHTML = '<p class="panel-empty">Todavía no hay solicitudes por revisar.</p>';
    return;
  }

  managedRequests.innerHTML = requests.map((request) => {
    const date = new Date(request.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    const requestId = request.solicitudId || '';
    return `<article class="review-item">
      <div class="review-item-heading"><div><p class="eyebrow eyebrow-dark">${escapeHtml(date)} · ${escapeHtml(request.mascotaNombre || 'Mascota')}</p><h3>${escapeHtml(request.nombreAdoptante || 'Adoptante')}</h3></div>
        <label class="management-state">Estado<select data-request-status="${escapeHtml(requestId)}">${getRequestStatusOptions(request.estadoSolicitud || 'Recibida')}</select></label>
      </div>
      <div class="review-facts"><span>${escapeHtml(request.correo)}</span><span>${escapeHtml(request.telefono)}</span><span>${escapeHtml(request.tipoVivienda || 'Hogar sin especificar')}</span><span>Otras mascotas: ${escapeHtml(request.otrasMascotas || 'Sin especificar')}</span><span>Experiencia: ${escapeHtml(request.experiencia || 'Sin especificar')}</span></div>
      ${request.mensaje ? `<p class="review-message">${escapeHtml(request.mensaje)}</p>` : ''}
      <span class="tracking-reference">Folio ${escapeHtml(requestId)}</span>
    </article>`;
  }).join('');
}

function renderRefugePanel() {
  renderManagedPets();
  renderManagedRequests();
}

function openTracking() {
  renderTracking();
  trackingDialog.showModal();
}

function askForAccount(message, continueWithTracking = false) {
  pendingTracking = continueWithTracking;
  setAuthMode('login');
  authFeedback.textContent = message;
  authDialog.showModal();
}

function continueAfterAuthentication() {
  authDialog.close();
  const nextPetId = pendingPetId;
  const shouldShowTracking = pendingTracking;
  pendingPetId = null;
  pendingTracking = false;
  window.setTimeout(() => {
    if (nextPetId !== null) openAdoptionForm(nextPetId);
    else if (shouldShowTracking) openTracking();
  }, 0);
}

function clearPendingAuthFlow() {
  pendingPetId = null;
  pendingTracking = false;
}

function setRefugeTab(tab) {
  const showRequests = tab === 'requests';
  document.querySelectorAll('[data-refuge-tab]').forEach((button) => {
    const active = button.dataset.refugeTab === tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelector('#refuge-pets-view').hidden = showRequests;
  document.querySelector('#refuge-requests-view').hidden = !showRequests;
}

function readAuthSession() {
  try {
    return JSON.parse(sessionStorage.getItem('adopme-session') || 'null');
  } catch {
    return null;
  }
}

function getAuthAccounts() {
  try {
    return JSON.parse(localStorage.getItem('adopme-accounts') || '[]');
  } catch {
    return [];
  }
}

function updateAuthTrigger() {
  authTrigger.textContent = authSession ? 'Salir' : 'Iniciar sesión';
  authTrigger.title = authSession ? `Sesión de ${authSession.nombre}` : 'Iniciar sesión';
  authTrigger.setAttribute('aria-label', authSession ? `Cerrar sesión de ${authSession.nombre}` : 'Iniciar sesión');
}

function setAuthMode(mode) {
  const isRegistering = mode === 'register';
  loginForm.hidden = isRegistering;
  registerForm.hidden = !isRegistering;
  document.querySelector('#auth-eyebrow').textContent = isRegistering ? 'Una nueva historia' : 'Tu próxima historia';
  document.querySelector('#auth-title').textContent = isRegistering ? 'Bienvenido a casa.' : 'Qué gusto verte.';
  document.querySelector('#auth-intro').textContent = isRegistering
    ? 'Crea tu cuenta para guardar favoritos y seguir tus solicitudes.'
    : 'Entra para guardar tus favoritos y seguir tus solicitudes.';
  document.querySelector('#auth-switch-row').firstChild.textContent = isRegistering
    ? '¿Ya tienes cuenta? '
    : '¿Primera vez por aquí? ';
  document.querySelector('#auth-switch').textContent = isRegistering ? 'Inicia sesión' : 'Crea tu cuenta';
  authFeedback.textContent = '';
}

function showAuthToast(message) {
  authToast.textContent = message;
  authToast.classList.add('is-visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => authToast.classList.remove('is-visible'), 3200);
}

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, saltHex) {
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

function startAuthSession(account) {
  authSession = { nombre: account.nombre, correo: account.correo };
  sessionStorage.setItem('adopme-session', JSON.stringify(authSession));
  updateAuthTrigger();
}

authTrigger.addEventListener('click', () => {
  if (authSession) {
    sessionStorage.removeItem('adopme-session');
    authSession = null;
    updateAuthTrigger();
    showAuthToast('Has cerrado tu sesión.');
    return;
  }

  setAuthMode('login');
  authDialog.showModal();
});

document.querySelector('#auth-switch').addEventListener('click', () => {
  setAuthMode(registerForm.hidden ? 'register' : 'login');
  loginForm.reset();
  registerForm.reset();
});

document.querySelector('#auth-close').addEventListener('click', () => {
  clearPendingAuthFlow();
  authDialog.close();
});
authDialog.addEventListener('cancel', clearPendingAuthFlow);
authDialog.addEventListener('close', () => {
  if (!authSession) clearPendingAuthFlow();
});
authDialog.addEventListener('click', (event) => {
  if (event.target === authDialog) {
    clearPendingAuthFlow();
    authDialog.close();
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = loginForm.querySelector('[type="submit"]');
  const formData = new FormData(loginForm);
  const correo = String(formData.get('correo')).trim().toLowerCase();
  const password = String(formData.get('password'));
  submitButton.disabled = true;
  authFeedback.textContent = '';

  try {
    const account = getAuthAccounts().find((entry) => entry.correo === correo);
    if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
      authFeedback.textContent = 'No encontramos esa cuenta o la contraseña no coincide.';
      return;
    }

    startAuthSession(account);
    loginForm.reset();
    continueAfterAuthentication();
    showAuthToast(`Qué gusto verte, ${account.nombre.split(' ')[0]}.`);
  } catch {
    authFeedback.textContent = 'No pudimos iniciar sesión en este navegador. Inténtalo de nuevo.';
  } finally {
    submitButton.disabled = false;
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = registerForm.querySelector('[type="submit"]');
  const formData = new FormData(registerForm);
  const nombre = String(formData.get('nombre')).trim();
  const correo = String(formData.get('correo')).trim().toLowerCase();
  const password = String(formData.get('password'));
  submitButton.disabled = true;
  authFeedback.textContent = '';

  try {
    const accounts = getAuthAccounts();
    if (accounts.some((account) => account.correo === correo)) {
      authFeedback.textContent = 'Ya existe una cuenta con ese correo.';
      return;
    }

    const salt = toHex(window.crypto.getRandomValues(new Uint8Array(16)));
    const account = { nombre, correo, salt, passwordHash: await hashPassword(password, salt) };
    accounts.push(account);
    localStorage.setItem('adopme-accounts', JSON.stringify(accounts));
    startAuthSession(account);
    registerForm.reset();
    continueAfterAuthentication();
    showAuthToast(`¡Bienvenido, ${nombre.split(' ')[0]}!`);
  } catch {
    authFeedback.textContent = 'No pudimos guardar tu cuenta en este navegador. Inténtalo de nuevo.';
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector('.filter-group').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;

  activeCategory = button.dataset.category;
  document.querySelectorAll('.filter-button').forEach((filterButton) => {
    const isActive = filterButton === button;
    filterButton.classList.toggle('is-active', isActive);
    filterButton.setAttribute('aria-pressed', String(isActive));
  });
  renderPets();
});

searchInput.addEventListener('input', renderPets);

savedFilter.addEventListener('click', () => {
  showSavedOnly = !showSavedOnly;
  savedFilter.classList.toggle('is-active', showSavedOnly);
  savedFilter.setAttribute('aria-pressed', String(showSavedOnly));
  renderPets();
});

petGrid.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-favorite]');
  const adoptButton = event.target.closest('[data-adopt]');

  if (favoriteButton) {
    const petId = favoriteButton.dataset.favorite;
    savedPets = isPetSaved(petId)
      ? savedPets.filter((id) => String(id) !== String(petId))
      : [...savedPets, petId];
    saveFavorites();
    renderPets();
  }

  if (adoptButton) openAdoptionForm(adoptButton.dataset.adopt);
});

document.querySelectorAll('[data-open-requests]').forEach((button) => {
  button.addEventListener('click', () => {
    if (authSession) openTracking();
    else askForAccount('Inicia sesión para consultar el estado de tus solicitudes.', true);
  });
});

document.querySelectorAll('[data-open-refuge]').forEach((button) => {
  button.addEventListener('click', () => {
    setRefugeTab('pets');
    renderRefugePanel();
    refugeDialog.showModal();
  });
});

document.querySelector('.refuge-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-refuge-tab]');
  if (tab) setRefugeTab(tab.dataset.refugeTab);
});

petCreateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(petCreateForm);
  const foto = String(formData.get('foto')).trim();

  try {
    const imageUrl = new URL(foto);
    if (imageUrl.protocol !== 'https:') throw new Error('La foto debe usar una URL segura (https).');
    const especie = String(formData.get('especie'));
    const catalog = adoptionTools.getPets();
    catalog.unshift({
      id: createId(),
      nombre: String(formData.get('nombre')).trim(),
      especie,
      raza: String(formData.get('raza')).trim(),
      edad: String(formData.get('edad')).trim(),
      categoria: especie === 'Otro' ? 'Otros' : `${especie}s`,
      foto: imageUrl.href,
      descripcion: String(formData.get('descripcion')).trim(),
      estado: 'Disponible'
    });
    adoptionTools.setPets(catalog);
    persistCatalog();
    petCreateForm.reset();
    petFormFeedback.textContent = 'Mascota publicada en el catálogo de este navegador.';
    renderManagedPets();
  } catch (error) {
    petFormFeedback.textContent = error instanceof TypeError
      ? 'Escribe una URL válida para la foto.'
      : error.message;
  }
});

managedPets.addEventListener('change', (event) => {
  const statusSelect = event.target.closest('[data-pet-status]');
  if (!statusSelect) return;
  const pet = adoptionTools.getPetById(statusSelect.dataset.petStatus);
  if (!pet || !petStatuses.includes(statusSelect.value)) return;
  pet.estado = statusSelect.value;
  persistCatalog();
  renderManagedPets();
});

managedPets.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-delete-pet]');
  if (!removeButton) return;
  const pet = adoptionTools.getPetById(removeButton.dataset.deletePet);
  if (!pet || !window.confirm(`¿Eliminar a ${pet.nombre} del catálogo?`)) return;
  adoptionTools.setPets(adoptionTools.getPets().filter((entry) => String(entry.id) !== String(pet.id)));
  persistCatalog();
  renderManagedPets();
});

managedRequests.addEventListener('change', (event) => {
  const statusSelect = event.target.closest('[data-request-status]');
  if (!statusSelect || !requestStatuses.includes(statusSelect.value)) return;
  const updated = adoptionTools.updateAdoptionRequest(statusSelect.dataset.requestStatus, {
    estadoSolicitud: statusSelect.value,
    actualizado: new Date().toISOString()
  });
  if (updated) {
    if (updated.estadoSolicitud === 'Adopción completada') {
      const adoptedPet = adoptionTools.getPetById(updated.mascotaId);
      if (adoptedPet) {
        adoptedPet.estado = 'Adoptado';
        persistCatalog();
        renderManagedPets();
      }
    }
    renderManagedRequests();
    renderTracking();
  }
});

document.querySelector('#reset-search').addEventListener('click', () => {
  searchInput.value = '';
  activeCategory = 'Todas';
  showSavedOnly = false;
  savedFilter.classList.remove('is-active');
  savedFilter.setAttribute('aria-pressed', 'false');
  document.querySelectorAll('.filter-button').forEach((button) => {
    const isActive = button.dataset.category === 'Todas';
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  renderPets();
});

adoptionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(adoptionForm);
  const request = Object.fromEntries(formData.entries());

  try {
    adoptionTools.saveAdoptionRequest({
      ...request,
      solicitudId: createId(),
      cuentaCorreo: authSession.correo,
      estadoSolicitud: 'Recibida'
    });
    adoptionForm.reset();
    setApplicationStep(1);
    dialogFormView.hidden = true;
    dialogSuccess.hidden = false;
    renderTracking();
    renderManagedRequests();
  } catch {
    window.alert('No pudimos guardar tu solicitud. Revisa la configuración de almacenamiento de tu navegador e inténtalo de nuevo.');
  }
});

document.querySelector('#application-next').addEventListener('click', () => {
  const activeStep = document.querySelector(`[data-application-step="${applicationStep}"]`);
  const controls = [...activeStep.querySelectorAll('input, select, textarea')];
  if (!controls.every((control) => control.reportValidity())) return;
  const nextStep = applicationStep + 1;
  if (nextStep === 3) updateApplicationSummary();
  setApplicationStep(nextStep);
});

document.querySelector('#application-back').addEventListener('click', () => {
  if (applicationStep > 1) setApplicationStep(applicationStep - 1);
});

document.querySelector('#dialog-close').addEventListener('click', () => adoptionDialog.close());
document.querySelector('#success-close').addEventListener('click', () => adoptionDialog.close());
document.querySelector('#view-my-requests').addEventListener('click', () => {
  adoptionDialog.close();
  openTracking();
});
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

saveFavorites();
renderPets();
observeReveals();
updateAuthTrigger();

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const heroImage = document.querySelector('.hero-image');
  let scrollFrame = 0;

  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      const offset = Math.min(window.scrollY * 0.1, 70);
      heroImage.style.setProperty('--parallax-y', `${-offset}px`);
      scrollFrame = 0;
    });
  }, { passive: true });
}