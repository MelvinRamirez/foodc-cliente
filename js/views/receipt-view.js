import { messages } from '../messages.js';
import { formatMoney, formatTableLabel } from '../format.js';
import { el, mount } from './dom.js';

function renderReceiptLine(item) {
  const label = item.name ? `${item.name} x${item.quantity}` : `${item.item_id} x${item.quantity}`;
  return el('li', { class: 'receipt__item' }, [label]);
}

function render(slice) {
  const fragment = document.createDocumentFragment();
  const receipt = slice.lastReceipt;
  if (!receipt) return fragment;

  fragment.appendChild(
    el('div', { class: 'receipt' }, [
      el('h2', { class: 'receipt__title' }, [messages.receipt.title]),
      el('p', { class: 'receipt__order-id' }, [`${messages.receipt.orderId}: ${receipt.order_id}`]),
      el('p', { class: 'receipt__table' }, [
        `${messages.receipt.table}: ${formatTableLabel(slice.table.value)}`,
      ]),
      el('p', { class: 'receipt__timestamp' }, [
        `${messages.receipt.timestamp}: ${receipt.created_at ?? ''}`,
      ]),
      el('ul', { class: 'receipt__items' }, (receipt.items || []).map(renderReceiptLine)),
      el('p', { class: 'receipt__total' }, [
        // El total SIEMPRE viene del servidor, nunca se recalcula en el cliente.
        `${messages.receipt.total}: ${formatMoney(receipt.total_amount)}`,
      ]),
      el(
        'button',
        { type: 'button', class: 'receipt__new-order', 'data-action': 'new-order' },
        [messages.receipt.newOrder],
      ),
    ]),
  );
  return fragment;
}

/**
 * Muestra el recibo de `lastReceipt` (`order_id`/`total_amount` tal cual
 * los devuelve el servidor) y sobrevive a un reload hasta "Nuevo pedido"
 * (`diner-order-submission`).
 *
 * @param {HTMLElement} root
 * @param {import('../store.js').createStore<any>} store
 * @param {{ startNewOrder: () => void }} handlers
 * @returns {() => void} unmount
 */
export function mountReceiptView(root, store, handlers) {
  return mount(
    root,
    store,
    (state) => ({ lastReceipt: state.lastReceipt, table: state.table }),
    render,
    (action) => {
      if (action === 'new-order') handlers.startNewOrder();
    },
  );
}
