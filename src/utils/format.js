function formatMoney(v) {
  const n = Number(v || 0);
  return n.toFixed(2).replace('.', ',');
}
module.exports = { formatMoney };
