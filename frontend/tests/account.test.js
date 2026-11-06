import test from 'node:test';
import assert from 'node:assert/strict';
import { createPage, settle, click } from './browser-fixture.js';

test('account modules load orders, wallet, favorites and save profile', async () => {
  let saved;
  const page = createPage('account.html', {
    '/api/orders?page=0': { content: [], page: 0, totalElements: 0, totalPages: 0 },
    '/api/account/wallet': { balance: 50000, transactions: [] },
    '/api/account/favorites': [{ id: 1, name: 'Burger', price: 25000 }],
    '/api/account/favorites/1': null,
    '/api/account/profile': (options) => { saved = JSON.parse(options.body); return saved; },
  });
  try {
    await import('../public/js/pages/account.js');
    await settle();
    assert.match(document.querySelector('#customerOrders').textContent, /chưa có đơn/);
    assert.match(document.querySelector('#walletBalance').textContent, /50/);
    assert.match(document.querySelector('#favoriteProducts').textContent, /Burger/);
    const form = document.querySelector('#profileForm');
    form.elements.fullName.value = 'Khách thử nghiệm';
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    assert.equal(saved.fullName, 'Khách thử nghiệm');
    assert.match(document.querySelector('#accountToast').textContent, /Đã lưu/);
    click('#refreshOrders');
    await settle();
    assert.equal(page.calls.filter(call => call.url === '/api/orders?page=0').length, 2);
    click('[data-remove-favorite="1"]');
    await settle();
    assert.equal(page.calls.find(call => call.method === 'DELETE').headers.get('X-XSRF-TOKEN'), 'test-csrf');
  } finally { page.close(); }
});
