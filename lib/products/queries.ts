export const productWithVariantsAndPricesSelect =
  "*, variants:product_variants(*, prices:product_variant_prices(price_list_id, price)), product_prices(price_list_id, price)";
