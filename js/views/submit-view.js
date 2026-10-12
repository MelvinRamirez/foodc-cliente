import { messages } from '../messages.js';
import { canSubmit } from '../actions.js';
import { el, mount } from './dom.js';

function errorMessage(error) {
  if (!error) return null;
  if (error.code === 'LOCK_TIMEOUT') return messages.submit.lockTimeout;
  if (error.code === 'OFFLINE') return messages.submit.offline;
  if (Array.isArray(error.fields) && error.fields.includes('table')) return messages.submit.fieldTable;
  if (Array.isArray(error.fields) && error.fields.includes('items')) return messages.submit.fieldItems;
  if (Array.isArray(error.fields) && error.fields.includes('notes')) return messages.submit.fieldNotes;
  return messages.submit.genericError;
}

function render(slice) {
  const fragment = document.createDocumentFragment();
  const inProgress = slice.submission.status === 'sending' || slice.submission.status === 'slow';

  if (slice.submission.status === 'ambiguous') {
    fragment.appendChild(
      el('div', { class: 'submit-ambiguous', role: 'alert' }, [
        el('p', {}, [messages.submit.ambiguousWarning]),
        el(
          'button',
          { type: 'button', class: 'submit-ambiguous__ack', 'data-action': 'acknowledge-ambiguous' },
          [messages.submit.ambiguousAck],
        ),
      ]),
    );
  }

  const label =
    slice.submission.status === 'slow'
      ? messages.submit.slow
      : inProgress
        ? messages.submit.sending
        : messages.submit.action;

  fragment.appendChild(
    el(
      'button',
      {
        type: 'button',
        class: 'submit-button',
        'data-action': 'submit-order',
        disabled: !canSubmit(slice) || inProgress,
      },
      [label],
    ),
  );

  if (slice.submission.status === 'error') {
    const message = errorMessage(slice.submission.error);
    if (message) fragment.appendChild(el('p', { class: 'submit-error', role: 'alert' }, [message]));
  }

  return fragment;
}

/**
 * Monta el botón "Enviar Pedido", guiado íntegramente por `canSubmit` y
 * `submission.status`, y el aviso de falla ambigua con "Ya confirmé,
 * volver a enviar" (`diner-order-submission`).
 *
 * @param {HTMLElement} root
 * @param {import('../store.js').createStore<any>} store
 * @param {{ submitOrder: () => void, acknowledgeAmbiguous: () => void }} handlers
 * @returns {() => void} unmount
 */
export function mountSubmitView(root, store, handlers) {
  return mount(
    root,
    store,
    (state) => ({
      cart: state.cart,
      table: state.table,
      submission: state.submission,
      ambiguousPending: state.ambiguousPending,
      lastReceipt: state.lastReceipt,
    }),
    render,
    (action) => {
      if (action === 'submit-order') handlers.submitOrder();
      else if (action === 'acknowledge-ambiguous') handlers.acknowledgeAmbiguous();
    },
  );
}
