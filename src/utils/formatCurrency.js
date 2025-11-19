const formatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'SDG',
  maximumFractionDigits: 2,
});

export function formatCurrency(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return formatter.format(0);
  return formatter.format(n);
}

export default formatCurrency;
