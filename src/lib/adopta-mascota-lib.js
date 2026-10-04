/**
 * adopta-mascotas-lib
 * Librería de utilidades (sin interfaz) para un proyecto de adopción de mascotas.
 *
 * No arma HTML ni impone estilos: solo da las funciones de lógica
 * (buscar, filtrar, guardar solicitudes) para que cada quien construya
 * su propia interfaz encima.
 *
 * Uso básico:
 *   import { AdoptionTools } from 'adopta-mascotas-lib/src/index.js';
 *
 *   const gestor = new AdoptionTools({
 *     pets: [...],
 *     categories: [...],
 *     storagePrefix: 'app-del-otro-equipo'
 *   });
 *
 *   const resultados = gestor.searchPets('firulais');
 *   const perros = gestor.filterByCategory('Perros');
 *   gestor.saveAdoptionRequest({ mascotaId: 1, nombreAdoptante: 'Ana', ... });
 */

export class AdoptionTools {
  /**
   * @param {Object} config
   * @param {Array}  config.pets        Lista de mascotas disponibles para adopción.
   *   Cada mascota, por ejemplo: { id, nombre, especie, raza, edad, categoria, foto, descripcion }
   * @param {Array}  config.categories  Lista de categorías, ej: ['Perros','Gatos','Otros']
   * @param {string} config.storagePrefix  Prefijo para guardar datos en localStorage
   *   y así no chocar con otros proyectos que usen la misma librería.
   */
  constructor(config = {}) {
    this.pets = config.pets || [];
    this.categories = config.categories || [];
    this.storagePrefix = config.storagePrefix || 'adopta-mascotas';
  }

  // ---------- datos de mascotas ----------

  /** Devuelve todas las mascotas cargadas. */
  getPets() {
    return this.pets;
  }

  /** Reemplaza la lista de mascotas (útil si llega de una API). */
  setPets(pets) {
    this.pets = pets || [];
  }

  /** Devuelve la lista de categorías configuradas. */
  getCategories() {
    return this.categories;
  }

  /** Busca una mascota por su id. */
  getPetById(id) {
    return this.pets.find(p => String(p.id) === String(id));
  }

  /** Busca mascotas cuyo nombre o raza contenga el texto dado (no distingue mayúsculas). */
  searchPets(term = '') {
    const t = term.trim().toLowerCase();
    if (!t) return this.pets;
    return this.pets.filter(p =>
      (p.nombre || '').toLowerCase().includes(t) ||
      (p.raza || '').toLowerCase().includes(t)
    );
  }

  /** Filtra mascotas por categoría. Pasa null/undefined o 'Todas' para no filtrar. */
  filterByCategory(categoria) {
    if (!categoria || categoria === 'Todas') return this.pets;
    return this.pets.filter(p => p.categoria === categoria);
  }

  /** Combina búsqueda por texto y filtro por categoría a la vez. */
  searchAndFilter(term = '', categoria = 'Todas') {
    const porCategoria = this.filterByCategory(categoria);
    const t = term.trim().toLowerCase();
    if (!t) return porCategoria;
    return porCategoria.filter(p =>
      (p.nombre || '').toLowerCase().includes(t) ||
      (p.raza || '').toLowerCase().includes(t)
    );
  }

  // ---------- solicitudes de adopción ----------

  /**
   * Guarda una solicitud de adopción en localStorage.
   * @param {Object} request  Ej: { mascotaId, nombreAdoptante, telefono, correo, mensaje }
   * @returns {Object} la solicitud guardada, con fecha agregada
   */
  saveAdoptionRequest(request) {
    const entry = { ...request, fecha: new Date().toISOString() };
    const current = this.getAdoptionRequests();
    current.push(entry);
    localStorage.setItem(this._storageKey(), JSON.stringify(current));
    return entry;
  }

  /** Devuelve todas las solicitudes de adopción guardadas hasta ahora. */
  getAdoptionRequests() {
    const raw = localStorage.getItem(this._storageKey());
    return raw ? JSON.parse(raw) : [];
  }

  /** Actualiza una solicitud por su identificador y devuelve la versión guardada. */
  updateAdoptionRequest(id, updates) {
    const current = this.getAdoptionRequests();
    const index = current.findIndex(request => String(request.solicitudId) === String(id));
    if (index === -1) return null;

    current[index] = { ...current[index], ...updates };
    localStorage.setItem(this._storageKey(), JSON.stringify(current));
    return current[index];
  }

  /** Elimina todas las solicitudes guardadas (útil para pruebas). */
  clearAdoptionRequests() {
    localStorage.removeItem(this._storageKey());
  }

  // ---------- interno ----------

  _storageKey() {
    return `${this.storagePrefix}-adoptions`;
  }
}
