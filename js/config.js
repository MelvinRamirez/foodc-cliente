// Configuración global del cliente. Ninguna de estas constantes es
// configurable por el llamador en tiempo de ejecución: son el contrato
// con el backend documentado en openspec/specs/{order-api,menu-api,api-transport}.

export const API_URL = 'https://script.google.com/macros/s/AKfycbzN9m1QXFS0IW7ervb4zbhK8AYJiHLXahur4QUPC-BPJYZrwaeAxwyJ3QY8nVRRpFqH/exec';

export const ORDER_TIMEOUT_MS = 35000;
export const MENU_TIMEOUT_MS = 15000;
export const SLOW_NOTICE_MS = 10000;

export const NOTES_MAX = 250; // code points, igual que el servidor (customer_notes)
export const TABLE_MAX = 20; // normalizeTableNumber_ en Code.gs
export const QTY_MAX = 99; // validateCreateOrder_
export const LINES_MAX = 50; // validateCreateOrder_

export const STORAGE_KEY = 'foodc.cliente.v1';
export const TABLE_SESSION_KEY = 'foodc.cliente.table';

// Provisorio: ver design.md "Open Questions" (moneda a confirmar con producto).
export const CURRENCY_SYMBOL = '$';
