import { messages } from '../messages.js';
import { formatMoney } from '../format.js';
import { el, mount } from './dom.js';

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.category || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function findMenuItem(items, itemId) {
  return items.find((item) => item.item_id === itemId) || null;
}

function imageBox(item) {
  const useRemote = typeof item.image_url === 'string' && item.image_url.startsWith('https:');
  const img = el('img', {
    class: 'menu-item__img',
    loading: 'lazy',
    alt: messages.image.alt,
    width: 96,
    height: 96,
    src: useRemote ? item.image_url : './img/placeholder-dish.svg',
  });
  let swapped = false;
  img.addEventListener('error', () => {
    if (swapped) return;
    swapped = true;
    img.src = './img/placeholder-dish.svg';
  });
  return el('div', { class: 'menu-item__image-box' }, [img]);
}

function renderItem(item) {
  return el('li', { class: 'menu-item' }, [
    imageBox(item),
    el('div', { class: 'menu-item__body' }, [
      el('p', { class: 'menu-item__name' }, [item.name]),
      el('p', { class: 'menu-item__description' }, [item.description || '']),
      el('p', { class: 'menu-item__price' }, [formatMoney(item.price)]),
      el(
        'button',
        {
          type: 'button',
          class: 'menu-item__add',
          'data-action': 'add-item',
          'data-item-id': item.item_id,
        },
        ['Agregar'],
      ),
    ]),
  ]);
}

function renderLoading() {
  return el('p', { class: 'menu-status menu-status--loading' }, [messages.menu.loading]);
}

function renderEmpty() {
  return el('p', { class: 'menu-status menu-status--empty' }, [messages.menu.empty]);
}

function renderError(menuState) {
  const text = menuState.error && menuState.error.offline ? messages.menu.offline : messages.menu.error;
  return el('div', { class: 'menu-status menu-status--error' }, [
    el('p', {}, [text]),
    el('button', { type: 'button', class: 'menu-status__retry', 'data-action': 'retry-menu' }, [
      messages.menu.retry,
    ]),
  ]);
}

function renderReady(menuState) {
  const fragment = document.createDocumentFragment();
  for (const [category, items] of groupByCategory(menuState.items)) {
    fragment.appendChild(
      el('section', { class: 'menu-category' }, [
        el('h2', { class: 'menu-category__title' }, [category || 'Otros']),
        el('ul', { class: 'menu-list' }, items.map(renderItem)),
      ]),
    );
  }
  return fragment;
}

function render(menuState) {
  const fragment = document.createDocumentFragment();
  if (menuState.status === 'loading') {
    fragment.appendChild(renderLoading());
  } else if (menuState.status === 'error') {
    fragment.appendChild(renderError(menuState));
  } else if (menuState.status === 'empty') {
    fragment.appendChild(renderEmpty());
  } else {
    fragment.appendChild(renderReady(menuState));
  }
  return fragment;
}

/**
 * Monta la vista del menú: estados loading/empty/error/ready, agrupado por
 * categoría, con "Reintentar" y agregar-al-carrito (`diner-menu`).
 *
 * @param {HTMLElement} root
 * @param {import('../store.js').createStore<any>} store
 * @param {{ loadMenu: () => void, addItem: (menuItem: any) => void }} handlers
 * @returns {() => void} unmount
 */
export function mountMenuView(root, store, handlers) {
  return mount(
    root,
    store,
    (state) => state.menu,
    render,
    (action, dataset) => {
      if (action === 'retry-menu') {
        handlers.loadMenu();
      } else if (action === 'add-item') {
        const item = findMenuItem(store.getState().menu.items, dataset.itemId);
        if (item) handlers.addItem(item);
      }
    },
  );
}
