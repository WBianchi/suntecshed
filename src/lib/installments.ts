// ============================================
// Parcelamento no cartão — com juros desde a 1ª parcela (taxa inicial 5%
// a.m., +2% por parcela adicional, até 12x, parcela mínima R$5). Cálculo
// pela Tabela Price (juros compostos / amortização francesa), igual o
// Pagar.me usa de verdade.
// ============================================

export const MAX_INSTALLMENTS = 12;
export const MIN_INSTALLMENT_AMOUNT = 5;
export const INITIAL_INTEREST_RATE = 5; // % a.m., já na 1ª parcela
export const INCREMENTAL_INTEREST_RATE = 2; // % adicional por parcela além da 1ª

export interface InstallmentOption {
  n: number;
  installmentValue: number;
  total: number;
  hasInterest: boolean;
}

function monthlyRate(n: number): number {
  const stepsAboveFirst = n - 1;
  return (INITIAL_INTEREST_RATE + INCREMENTAL_INTEREST_RATE * stepsAboveFirst) / 100;
}

export function calculateInstallment(value: number, n: number): InstallmentOption {
  const i = monthlyRate(n);

  if (i === 0) {
    return { n, installmentValue: value / n, total: value, hasInterest: false };
  }

  const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  const installmentValue = value * factor;
  return { n, installmentValue, total: installmentValue * n, hasInterest: true };
}

export function maxInstallmentsFor(value: number): number {
  const byMinAmount = Math.max(1, Math.floor(value / MIN_INSTALLMENT_AMOUNT));
  return Math.min(MAX_INSTALLMENTS, byMinAmount);
}

export function getInstallmentOptions(value: number): InstallmentOption[] {
  const max = maxInstallmentsFor(value);
  return Array.from({ length: max }, (_, idx) => calculateInstallment(value, idx + 1));
}

// Usado nas vitrines/carrinho pra anunciar "ou em até Nx de R$Y" — o maior
// parcelamento disponível pro valor (sempre com juros a partir de 2x aqui).
export function bestInstallmentPitch(value: number): InstallmentOption {
  const max = maxInstallmentsFor(value);
  return calculateInstallment(value, max);
}
