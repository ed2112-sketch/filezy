export function getCommissionRate(activeReferralCount: number): number {
  if (activeReferralCount >= 21) return 0.3
  if (activeReferralCount >= 6) return 0.25
  return 0.2
}

export function calculateCommission(
  grossCents: number,
  activeReferrals: number
) {
  const rate = getCommissionRate(activeReferrals)
  return {
    commissionCents: Math.floor(grossCents * rate),
    rate,
    pct: rate * 100,
  }
}
