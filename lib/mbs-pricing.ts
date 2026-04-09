export function calculateCommission(salePriceRands: number): {
  rate: number;
  ratePercent: string;
  commissionRands: number;
} {
  let rate: number;

  if (salePriceRands <= 2500) {
    rate = 0.10;
  } else if (salePriceRands <= 5000) {
    rate = 0.075;
  } else if (salePriceRands <= 15000) {
    rate = 0.05;
  } else if (salePriceRands <= 30000) {
    rate = 0.03;
  } else {
    rate = 0.02;
  }

  return {
    rate,
    ratePercent: `${rate * 100}%`,
    commissionRands: Math.round(salePriceRands * rate),
  };
}

export const TRANSFER_FEE_RANDS = 99;

export function formatPrice(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA")}`;
}
