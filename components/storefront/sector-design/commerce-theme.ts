import type { StorefrontTheme } from "@/lib/storefront/themes";
import type { DesignId } from "@/lib/storefront/sector-design/config";
import s from "./commerce.module.css";

/** Shared purchase surfaces follow the selected storefront without duplicating order logic. */
export function electronicsCommerceTheme(base: StorefrontTheme, designId?: DesignId): StorefrontTheme {
  if (!designId) return base;
  return {
    ...base,
    commerceDesign: designId,
    isDark: designId === "electronics-akim" || base.isDark,
    text: s.text, textMuted: s.muted, textTertiary: s.muted,
    surface: s.surface, surfaceMuted: s.soft, panelSurface: s.surface,
    border: s.border, elevation1: s.elevation, elevation2: s.elevation,
    surfaceRing: s.ring, emptyImage: s.photo, productThumbSurface: s.photo,
    primaryButton: s.primary, stickyCartButton: s.primary, checkoutButton: s.primary,
    stickyCart: s.sticky, stickyCartText: s.text,
    productPrice: s.price, productPriceOriginal: s.originalPrice,
    stockBadgeIn: s.badge, addedVariantBadge: s.badge, variantBadge: s.badge,
    quantityStepper: s.stepper, quantityStepperButton: s.stepperButton, quantityInput: s.quantity,
    formField: s.field, activeTileBg: s.active, activeTileText: s.activeText,
    categoryNavChip: active => active ? s.active : s.soft,
    modalOverlay: s.overlay, modalPanel: s.modal,
    modalHeaderBorder: s.modalHeader, modalTitle: s.modalTitle,
    modalCloseButton: s.close, modalFooterBorder: s.modalFooter, modalHandle: s.handle,
    modalSurface: s.soft, modalTabChip: active => active ? s.active : s.soft,
    cartDrawerOverlay: s.cartOverlay, cartDrawerPanel: s.cartPanel,
    cartDrawerHeaderBorder: s.cartHeader, cartDrawerTitle: s.cartTitle,
    cartDrawerMuted: s.muted, cartDrawerCloseButton: s.close,
    cartDrawerItem: s.cartItem, cartDrawerSummary: s.summary,
    cartDrawerScroll: s.cartScroll, cartDrawerFooter: s.cartFooter,
    cartDrawerHandle: s.handle, cartSummaryMuted: s.muted,
    cartPaymentCashActive: s.active, cartPaymentCardActive: s.active,
    cartPaymentInactive: s.payment, cartInstallmentActive: s.active,
  };
}
export function commerceRootClass(id: DesignId, dark: boolean) {
  return [s.root, s[id.replace(/^(electronics|food|textile|hardware)-/, "")], dark && s.night].filter(Boolean).join(" ");
}
