/** Round to 2 decimal places (avoids floating-point display bugs). */
export const roundMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

/** Format number as string with exactly 2 decimal places. */
export const formatMoney = (value) => roundMoney(value).toFixed(2);

/** Format as Indian rupee, e.g. ₹123.45 */
export const formatRupee = (value) => `₹${formatMoney(value)}`;

export const calcItemUnitSaving = (item) => {
  const mrp = roundMoney(item.product_mrp || item.mrp || 0);
  const price = roundMoney(item.price || item.our_price || 0);
  return mrp > price ? roundMoney(mrp - price) : 0;
};

export const calcItemSavingTotal = (item) => {
  const qty = Number(item.quantity) || 1;
  return roundMoney(calcItemUnitSaving(item) * qty);
};

export const calcTotalSavings = (items) =>
  roundMoney(items.reduce((total, item) => total + calcItemSavingTotal(item), 0));
