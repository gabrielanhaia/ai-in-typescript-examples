// NOT A LISTING FROM THE BOOK.
//
// The formatter chapters 6 and 8 call `money.format(...)` without showing
// where it comes from. Sterling, because Braxby is in Manchester.

export const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});
