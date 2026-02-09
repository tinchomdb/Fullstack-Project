import { BreakpointSize, BREAKPOINT } from '../../core/services/breakpoint.service';

export type CardVariant = 'horizontal' | 'vertical';

export const CARD_VARIANT = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
} as const;

/**
 * Compute card variants for a product featured grid based on count and breakpoint.
 */
export function getProductCardVariants(count: number, breakpoint: BreakpointSize): CardVariant[] {
  const variants: CardVariant[] = new Array(count).fill(CARD_VARIANT.VERTICAL);

  if (breakpoint === BREAKPOINT.XS) {
    return variants;
  }

  if (count === 1) {
    if (
      breakpoint === BREAKPOINT.MD ||
      breakpoint === BREAKPOINT.LG ||
      breakpoint === BREAKPOINT.XL
    ) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 2) {
    if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
      variants[1] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 3) {
    if (
      breakpoint === BREAKPOINT.SM ||
      breakpoint === BREAKPOINT.MD ||
      breakpoint === BREAKPOINT.LG ||
      breakpoint === BREAKPOINT.XL
    ) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
    }
    if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
      variants[1] = CARD_VARIANT.HORIZONTAL;
      variants[2] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 4) {
    if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
      variants[1] = CARD_VARIANT.HORIZONTAL;
      variants[2] = CARD_VARIANT.HORIZONTAL;
      variants[3] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 5) {
    if (
      breakpoint === BREAKPOINT.MD ||
      breakpoint === BREAKPOINT.LG ||
      breakpoint === BREAKPOINT.XL
    ) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
      variants[1] = CARD_VARIANT.HORIZONTAL;
      variants[2] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count >= 6) {
    if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
      variants[1] = CARD_VARIANT.HORIZONTAL;
      variants[2] = CARD_VARIANT.HORIZONTAL;
    }
  }

  return variants;
}

/**
 * Compute card variants for a category featured grid based on count and breakpoint.
 */
export function getCategoryCardVariants(count: number, breakpoint: BreakpointSize): CardVariant[] {
  const variants: CardVariant[] = new Array(count).fill(CARD_VARIANT.VERTICAL);

  if (breakpoint === BREAKPOINT.XS || breakpoint === BREAKPOINT.SM) {
    return variants;
  }

  if (count === 1) {
    if (
      breakpoint === BREAKPOINT.MD ||
      breakpoint === BREAKPOINT.LG ||
      breakpoint === BREAKPOINT.XL
    ) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 2) {
    if (
      breakpoint === BREAKPOINT.MD ||
      breakpoint === BREAKPOINT.LG ||
      breakpoint === BREAKPOINT.XL
    ) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
      variants[1] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 3) {
    if (breakpoint === BREAKPOINT.MD) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
    } else if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 4) {
    if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
      variants[1] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count === 5) {
    if (
      breakpoint === BREAKPOINT.MD ||
      breakpoint === BREAKPOINT.LG ||
      breakpoint === BREAKPOINT.XL
    ) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
      variants[1] = CARD_VARIANT.HORIZONTAL;
      variants[4] = CARD_VARIANT.HORIZONTAL;
    }
  } else if (count >= 6) {
    if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
      variants[0] = CARD_VARIANT.HORIZONTAL;
      variants[1] = CARD_VARIANT.HORIZONTAL;
    }
  }

  return variants;
}
