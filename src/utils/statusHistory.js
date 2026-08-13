/**
 * Pushes a new entry onto an order's statusHistory array. Centralized
 * here so every controller records history entries in exactly the same
 * shape ({ status, note, timestamp }).
 *
 * NOTE: mutates the passed-in order document's statusHistory array but
 * does not save() it — callers are expected to save the order
 * themselves (often after making other field changes in the same
 * request), keeping this a pure "append to array" helper.
 */
function pushStatusHistory(order, status, note) {
  order.statusHistory.push({
    status,
    note: note || undefined,
    timestamp: new Date(),
  });
  return order;
}

module.exports = { pushStatusHistory };
