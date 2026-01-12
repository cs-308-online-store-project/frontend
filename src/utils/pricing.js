export const parsePrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const getPricingInfo = (product = {}) => {
  const basePrice = parsePrice(product.price);
  const listPrice = parsePrice(product.list_price ?? product.listPrice);
  const discountedPrice = parsePrice(
    product.discounted_price ?? product.discountedPrice
  );
  const discountActive =
    product.discount_active === true ||
    product.discount_active === 1 ||
    product.discountActive === true ||
    product.discountActive === 1;

  let effectivePrice = basePrice ?? listPrice ?? discountedPrice ?? 0;
  let hasDiscount = false;

  if (
    discountActive &&
    discountedPrice !== null &&
    (listPrice === null || discountedPrice < listPrice)
  ) {
    effectivePrice = discountedPrice;
    hasDiscount = true;
  } else if (
    discountedPrice !== null &&
    listPrice !== null &&
    discountedPrice < listPrice
  ) {
    effectivePrice = discountedPrice;
    hasDiscount = true;
  } else if (basePrice !== null) {
    effectivePrice = basePrice;
  } else if (listPrice !== null) {
    effectivePrice = listPrice;
  }

  const displayListPrice =
    listPrice !== null ? listPrice : basePrice !== null ? basePrice : null;

  return {
    effectivePrice,
    listPrice: displayListPrice,
    hasDiscount,
  };
};