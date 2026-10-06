// Resolve o parâmetro "period" dos relatórios do admin — aceita as janelas
// relativas de sempre (7d/30d/90d/365d), um ano completo específico
// ("2023", "2024"...) ou "all" pra todo o histórico.
export function resolveReportPeriod(period: string): { since: Date; until: Date; prevSince: Date } {
  const now = new Date();

  if (period === "all") {
    const since = new Date(2000, 0, 1);
    return { since, until: now, prevSince: since };
  }

  if (/^\d{4}$/.test(period)) {
    const year = parseInt(period, 10);
    const since = new Date(year, 0, 1);
    const until = year >= now.getFullYear() ? now : new Date(year + 1, 0, 1);
    const prevSince = new Date(year - 1, 0, 1);
    return { since, until, prevSince };
  }

  let daysBack = 30;
  if (period === "7d") daysBack = 7;
  else if (period === "90d") daysBack = 90;
  else if (period === "365d") daysBack = 365;

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const prevSince = new Date();
  prevSince.setDate(prevSince.getDate() - daysBack * 2);

  return { since, until: now, prevSince };
}
