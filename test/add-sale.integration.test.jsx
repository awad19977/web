import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddSaleForm } from '@/components/Dashboard/AddSaleForm';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('AddSaleForm integration', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sale: { id: 123 } }) });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.resetAllMocks();
  });

  it('posts damaged fields when provided', async () => {
    const products = [
      { id: 1, name: 'Test Product', selling_price: 10.0, current_stock: 100 },
    ];

    const onClose = vi.fn();

    // onSubmit will call fetch; simulate integration by calling fetch inside onSubmit
    const onSubmit = async (payload) => {
      await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    };

    render(
      <AddSaleForm
        products={products}
        productsLoading={false}
        productsError={false}
        onClose={onClose}
        onSubmit={onSubmit}
        loading={false}
      />
    );

    // Helper: labels are not associated with controls in markup, so find the control near the label
    const controlByLabel = (text) => {
      const matches = screen.getAllByText(new RegExp(text, 'i'));
      const label = matches.find((el) => el.tagName && el.tagName.toLowerCase() === 'label') || matches[0];
      const container = label.closest('div');
      return container ? container.querySelector('select, input, textarea') : null;
    };

    // Select product
    const productSelect = controlByLabel('Product');
    fireEvent.change(productSelect, { target: { value: String(products[0].id) } });

    // Fill quantity
    const qtyInput = controlByLabel('Quantity');
    fireEvent.change(qtyInput, { target: { value: '10' } });

    // Damaged quantity
    const damagedInput = controlByLabel('Damaged Quantity');
    fireEvent.change(damagedInput, { target: { value: '2' } });

    // Damage reason
    const reasonInput = controlByLabel('Damage Reason');
    fireEvent.change(reasonInput, { target: { value: 'Broken' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Save Sale/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Inspect payload
    const call = global.fetch.mock.calls[0];
    const body = call[1].body;
    const parsed = JSON.parse(body);

    expect(parsed).toHaveProperty('damaged_quantity', 2);
    expect(parsed).toHaveProperty('damage_reason', 'Broken');
    expect(parsed).toHaveProperty('product_id', 1);
    expect(parsed).toHaveProperty('quantity', 10);
  });
});
