import { select } from '../store.js';
import { messages } from '../messages.js';
import { formatMoney } from '../format.js';
import { totalCents } from '../cart.js';
import { NOTES_MAX } from '../config.js';
import { el } from './dom.js';

function renderNotice(cartNotice, onDismiss) {
  if (!cartNotice) return null;
  const items = [];
  for (const removed of cartNotice.removed) {
    items.push(el('li', {}, [messages.cart.itemRemoved(removed.name)]));
  }
  for (const changed of cartNotice.priceChanged) {
    items.push(
      el('li', {}, [
        messages.cart.priceChanged(changed.name, formatMoney(changed.from), formatMoney(changed.to)),
      ]),
    );
  }
  return el('div', { class: 'cart-notice', role: 'status' }, [
    el('ul', { class: 'cart-notice__list' }, items),
    el(
      'button',
      { type: 'button', class: 'cart-notice__dismiss min-h-11 min-w-11', onclick: onDismiss },
      [messages.cart.noticeDismiss],
    ),
  ]);
}

function renderLine(line, handlers) {
  return el('li', { class: 'cart-line' }, [
    el('span', { class: 'cart-line__name' }, [line.name]),
    el('div', { class: 'cart-line__controls' }, [
      el(
        'button',
        {
          type: 'button',
          class: 'cart-line__btn min-h-11 min-w-11',
          'aria-label': 'Quitar una unidad',
          onclick: () => handlers.decrement(line.item_id),
        },
        ['-'],
      ),
      el('span', { class: 'cart-line__qty' }, [String(line.quantity)]),
      el(
        'button',
        {
          type: 'button',
          class: 'cart-line__btn min-h-11 min-w-11',
          'aria-label': 'Agregar una unidad',
          onclick: () => handlers.increment(line.item_id),
        },
        ['+'],
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'cart-line__remove min-h-11 min-w-11',
          onclick: () => handlers.removeItem(line.item_id),
        },
        ['Quitar'],
      ),
    ]),
    el('span', { class: 'cart-line__price' }, [formatMoney((line.unit_price * line.quantity * 100) / 100)]),
  ]);
}

function renderItemsRegion(cart, cartNotice, handlers) {
  const fragment = document.createDocumentFragment();
  const notice = renderNotice(cartNotice, () => handlers.dismissCartNotice());
  if (notice) fragment.appendChild(notice);

  if (cart.lines.length === 0) {
    fragment.appendChild(el('p', { class: 'cart-empty' }, [messages.cart.empty]));
    return fragment;
  }

  fragment.appendChild(el('ul', { class: 'cart-list' }, cart.lines.map((line) => renderLine(line, handlers))));
  fragment.appendChild(
    el('p', { class: 'cart-total' }, [`${messages.cart.total}: ${formatMoney(totalCents(cart) / 100)}`]),
  );
  return fragment;
}

/**
 * Monta el carrito: líneas con controles +/-/quitar (tap target >=44x44px
 * vía CSS), total auto-calculado, aviso de reconciliación descartable, y el
 * textarea de notas con contador en vivo.
 *
 * La textarea es deliberadamente NO CONTROLADA (design.md, Decisión 1/9):
 * se crea una sola vez al montar y nunca se reescribe su `.value` desde el
 * estado, para no perder la posición del cursor en cada tecla. El contador
 * se actualiza directamente en el DOM en el handler de `input`, y el valor
 * se despacha al store para persistencia/validación, pero sin que ese
 * despacho vuelva a tocar el nodo del textarea.
 *
 * @param {HTMLElement} root
 * @param {import('../store.js').createStore<any>} store
 * @param {{
 *   increment: (itemId: string) => void,
 *   decrement: (itemId: string) => void,
 *   removeItem: (itemId: string) => void,
 *   dismissCartNotice: () => void,
 *   setNotes: (text: string) => void,
 * }} handlers
 * @returns {() => void} unmount
 */
export function mountCartView(root, store, handlers) {
  const itemsRegion = el('div', { class: 'cart-items' });

  const initialNotes = store.getState().cart.notes;
  const textarea = el('textarea', {
    class: 'cart-notes',
    maxlength: NOTES_MAX,
    'aria-label': messages.cart.notesLabel,
  });
  textarea.value = initialNotes;
  const counter = el('span', { class: 'cart-notes__counter' }, [
    messages.cart.notesCounter(Array.from(initialNotes).length, NOTES_MAX),
  ]);
  const notesField = el('div', { class: 'cart-notes-field' }, [
    el('label', { class: 'cart-notes__label' }, [messages.cart.notesLabel]),
    textarea,
    counter,
  ]);

  function renderNow() {
    const { cart, cartNotice } = store.getState();
    itemsRegion.replaceChildren(renderItemsRegion(cart, cartNotice, handlers));
  }

  function handleNotesInput() {
    counter.textContent = messages.cart.notesCounter(Array.from(textarea.value).length, NOTES_MAX);
    handlers.setNotes(textarea.value);
  }

  renderNow();
  root.appendChild(itemsRegion);
  root.appendChild(notesField);
  textarea.addEventListener('input', handleNotesInput);

  const unsubCart = select(store, (state) => state.cart, renderNow);
  const unsubNotice = select(store, (state) => state.cartNotice, renderNow);

  return function unmount() {
    unsubCart();
    unsubNotice();
    textarea.removeEventListener('input', handleNotesInput);
    root.removeChild(itemsRegion);
    root.removeChild(notesField);
  };
}
