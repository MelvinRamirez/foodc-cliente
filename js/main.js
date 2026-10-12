import { API_URL, ORDER_TIMEOUT_MS, MENU_TIMEOUT_MS, STORAGE_KEY, TABLE_SESSION_KEY } from './config.js';
import { createStore } from './store.js';
import { initialState, actions } from './actions.js';
import { createApiClient } from './api.js';
import { loadPersisted, attachPersistence } from './persistence.js';
import { resolveTable } from './table.js';
import { formatTableLabel } from './format.js';
import { select } from './store.js';
import * as effects from './effects.js';
import { mountMenuView } from './views/menu-view.js';
import { mountTableModal } from './views/table-modal.js';
import { mountCartView } from './views/cart-view.js';
import { mountSubmitView } from './views/submit-view.js';
import { mountReceiptView } from './views/receipt-view.js';

/**
 * Lee `localStorage`/`sessionStorage` de forma defensiva: algunos modos de
 * navegación privada lanzan al acceder a estos objetos globales, no solo al
 * leer/escribir una clave.
 * @returns {{ localStorage: Storage|null, sessionStorage: Storage|null }}
 */
function getBrowserStorages() {
  let local = null;
  let session = null;
  try {
    local = window.localStorage;
  } catch {
    local = null;
  }
  try {
    session = window.sessionStorage;
  } catch {
    session = null;
  }
  return { localStorage: local, sessionStorage: session };
}

function dispatch(store, actionName, payload) {
  store.setState((state) => actions[actionName](state, payload));
}

function main() {
  const { localStorage: localStorageRef, sessionStorage: sessionStorageRef } = getBrowserStorages();

  const hydrated = loadPersisted(localStorageRef, STORAGE_KEY);
  const table = resolveTable({
    search: window.location.search,
    sessionValue: sessionStorageRef ? sessionStorageRef.getItem(TABLE_SESSION_KEY) : null,
  });

  const store = createStore(initialState(hydrated, table));
  attachPersistence(store, localStorageRef, STORAGE_KEY);

  const api = createApiClient({
    baseUrl: API_URL,
    orderTimeoutMs: ORDER_TIMEOUT_MS,
    menuTimeoutMs: MENU_TIMEOUT_MS,
  });

  const ctx = {
    store,
    api,
    now: () => new Date().toISOString(),
    isOnline: () => navigator.onLine,
    setTimer: (fn, ms) => window.setTimeout(fn, ms),
    clearTimer: (id) => window.clearTimeout(id),
    sessionStorage: sessionStorageRef,
  };

  const handlers = {
    loadMenu: () => effects.loadMenu(ctx),
    addItem: (menuItem) => dispatch(store, 'addItem', menuItem),
    increment: (itemId) => dispatch(store, 'increment', itemId),
    decrement: (itemId) => dispatch(store, 'decrement', itemId),
    removeItem: (itemId) => dispatch(store, 'removeItem', itemId),
    setNotes: (text) => dispatch(store, 'setNotes', text),
    dismissCartNotice: () => dispatch(store, 'dismissCartNotice'),
    submitOrder: () => effects.submitOrder(ctx),
    acknowledgeAmbiguous: () => effects.acknowledgeAmbiguous(ctx),
    startNewOrder: () => effects.startNewOrder(ctx),
    setTableManually: (value) => effects.setTableManually(ctx, value),
  };

  const tableLabelRoot = document.getElementById('table-label');
  function renderTableLabel(table) {
    tableLabelRoot.textContent = table.value === null ? '' : formatTableLabel(table.value);
  }
  renderTableLabel(store.getState().table);
  select(store, (state) => state.table, renderTableLabel);

  const menuRoot = document.getElementById('menu-root');
  const tableModalRoot = document.getElementById('table-modal-root');
  const cartRoot = document.getElementById('cart-root');
  const submitRoot = document.getElementById('submit-root');
  const receiptRoot = document.getElementById('receipt-root');

  mountTableModal(tableModalRoot, store, handlers);
  mountMenuView(menuRoot, store, handlers);
  mountCartView(cartRoot, store, handlers);
  mountSubmitView(submitRoot, store, handlers);
  mountReceiptView(receiptRoot, store, handlers);

  effects.loadMenu(ctx);

  // Reintenta cargar el menú al volver la conexión, solo si el menú está
  // actualmente en error (evita refetches innecesarios en reconexiones
  // intermitentes mientras todo funciona).
  window.addEventListener('online', () => {
    if (store.getState().menu.status === 'error') {
      effects.loadMenu(ctx);
    }
  });

  // Registra el service worker del app shell (diner-pwa-shell). Sin recarga
  // automática al actualizar: una recarga forzada interrumpiría un pedido en
  // curso (design.md, Architecture Decision 6).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' });
  }
}

main();
