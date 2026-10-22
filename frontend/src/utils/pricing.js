/**
 * Pricing and discount utilities
 */
export const getDiscount = (product) => {
  if (!product) return { hasDiscount: false };
  const compareAtPrice = Number(product.compareAtPrice);
  const price = Number(product.price);

  if (compareAtPrice > price && price > 0) {
    const percent = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    return {
      hasDiscount: true,
      oldPrice: compareAtPrice,
      percent,
    };
  }

  return { hasDiscount: false };
};

export default getDiscount;
