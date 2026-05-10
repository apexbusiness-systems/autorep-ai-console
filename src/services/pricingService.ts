import type { Conversation, Lead, Message, Quote, QuoteScenario, Vehicle } from '@/types/domain';

export interface ForecastDemandInput {
  vehicle?: Vehicle | null;
  vehicles?: Vehicle[];
  leads?: Lead[];
  conversations?: Conversation[];
  quotes?: Quote[];
  messages?: Message[];
  now?: Date;
}

export interface DemandForecast {
  score: number;
  band: 'low' | 'moderate' | 'high';
  forecastUnits30d: number;
  confidence: number;
  signals: string[];
  trend: { label: string; demand: number }[];
}

export interface DynamicPriceInput extends ForecastDemandInput {
  basePrice: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface DynamicPriceSuggestion {
  suggestedPrice: number;
  delta: number;
  confidence: number;
  rationale: string;
  contributingSignals: string[];
  demand: DemandForecast;
}

export interface QuotePackageAddon {
  id: string;
  label: string;
  price: number;
  taxable?: boolean;
}

export interface QuoteCalculationInput {
  sellingPrice: number;
  downPayment?: number;
  tradeInValue?: number;
  taxRate?: number;
  taxSource?: string;
  fees?: number;
  packages?: QuotePackageAddon[];
  termMonths?: number;
  interestRate?: number;
}

export interface QuoteCalculationResult {
  taxableSubtotal: number;
  principal: number;
  packageTotal: number;
  taxes: number;
  fees: number;
  totalCost: number;
  monthlyPayment: number;
  biweeklyPayment: number;
  taxRate: number;
  taxSource: string;
  packages: QuotePackageAddon[];
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const safeNumber = (value: unknown, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

function daysBetween(now: Date, iso?: string): number {
  if (!iso) return 999;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return 999;
  return Math.max(0, (now.getTime() - time) / 86_400_000);
}

function vehicleText(vehicle?: Vehicle | null): string {
  if (!vehicle) return '';
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.body}`.toLowerCase();
}

function leadMatchesVehicle(lead: Lead, vehicle?: Vehicle | null, needles?: string[]): boolean {
  if (!vehicle) return true;
  const haystack = `${lead.vehicleInterests.join(' ')} ${lead.notes ?? ''}`.toLowerCase();
  const searchNeedles = needles || [vehicle.make, vehicle.model, vehicle.trim, vehicle.body].map(v => v.toLowerCase()).filter(Boolean);
  return searchNeedles.some(needle => haystack.includes(needle));
}

function quoteMatchesVehicle(quote: Quote, vehicle?: Vehicle | null): boolean {
  if (!vehicle) return true;
  return quote.vehicleIds.includes(vehicle.id) || quote.scenarios.some(s => s.vehicleId === vehicle.id || s.vehicleSummary.toLowerCase().includes(vehicle.model.toLowerCase()));
}

export function forecastDemand(input: ForecastDemandInput): DemandForecast {
  const now = input.now ?? new Date();
  const leads = input.leads ?? [];
  const conversations = input.conversations ?? [];
  const quotes = input.quotes ?? [];
  const messages = input.messages ?? [];
  const vehicle = input.vehicle ?? null;
  const vehicles = input.vehicles ?? (vehicle ? [vehicle] : []);

  // Pre-calculate vehicle needles
  const vehicleNeedles = vehicle ? [vehicle.make, vehicle.model, vehicle.trim, vehicle.body].map(v => v.toLowerCase()).filter(Boolean) : [];

  let matchingLeadsCount = 0;
  let recentLeadsCount = 0;
  let hotLeadsCount = 0;
  const matchingLeadIds = new Set<string>();

  for (const lead of leads) {
    if (leadMatchesVehicle(lead, vehicle, vehicleNeedles)) {
      matchingLeadsCount++;
      matchingLeadIds.add(lead.id);
      if (daysBetween(now, lead.lastActivityAt) <= 14) {
        recentLeadsCount++;
      }
      if (lead.priority === 'hot' || ['quote_sent', 'appointment_set', 'finance_intake', 'negotiation'].includes(lead.stage)) {
        hotLeadsCount++;
      }
    }
  }

  let matchingQuotesCount = 0;
  let activeQuotesCount = 0;
  for (const quote of quotes) {
    if (quoteMatchesVehicle(quote, vehicle)) {
      matchingQuotesCount++;
      if (['sent', 'viewed', 'accepted', 'revised'].includes(quote.status)) {
        activeQuotesCount++;
      }
    }
  }

  let relevantConversationsCount = 0;
  let activeConversationsCount = 0;
  const relevantConversationIds = new Set<string>();
  for (const convo of conversations) {
    if (matchingLeadIds.has(convo.leadId)) {
      relevantConversationsCount++;
      relevantConversationIds.add(convo.id);
      if (['active', 'pending', 'escalated'].includes(convo.status)) {
        activeConversationsCount++;
      }
    }
  }

  let recentCustomerMessagesCount = 0;
  for (const message of messages) {
    if (relevantConversationIds.has(message.conversationId) && message.role === 'customer' && daysBetween(now, message.timestamp) <= 14) {
      recentCustomerMessagesCount++;
    }
  }

  let availableInventory = 0;
  let totalDaysOnLot = 0;
  for (const item of vehicles) {
    if (item.status === 'available') {
      availableInventory++;
    }
    totalDaysOnLot += safeNumber(item.daysOnLot);
  }

  if (vehicles.length === 0 && vehicle?.status === 'available') {
    availableInventory = 1;
  }

  const averageDaysOnLot = vehicles.length
    ? totalDaysOnLot / vehicles.length
    : safeNumber(vehicle?.daysOnLot, 0);

  let score = 20;
  const signals: string[] = [];

  score += recentLeadsCount * 8;
  if (recentLeadsCount) signals.push(`${recentLeadsCount} recent matched lead${recentLeadsCount === 1 ? '' : 's'}`);

  score += hotLeadsCount * 10;
  if (hotLeadsCount) signals.push(`${hotLeadsCount} high-intent lead${hotLeadsCount === 1 ? '' : 's'}`);

  score += activeQuotesCount * 12;
  if (activeQuotesCount) signals.push(`${activeQuotesCount} active quote${activeQuotesCount === 1 ? '' : 's'}`);

  score += activeConversationsCount * 5;
  if (activeConversationsCount) signals.push(`${activeConversationsCount} active conversation${activeConversationsCount === 1 ? '' : 's'}`);

  score += Math.min(recentCustomerMessagesCount * 2, 16);
  if (recentCustomerMessagesCount) signals.push(`${recentCustomerMessagesCount} recent customer message${recentCustomerMessagesCount === 1 ? '' : 's'}`);

  if (availableInventory <= 1) {
    score += 8;
    signals.push('limited available inventory');
  } else if (availableInventory >= 6) {
    score -= 8;
    signals.push('inventory depth offsets demand');
  }

  if (averageDaysOnLot > 60) {
    score -= 12;
    signals.push('aging inventory pressure');
  } else if (averageDaysOnLot > 30) {
    score -= 5;
    signals.push('moderate days-on-lot pressure');
  }

  score = Math.round(clamp(score, 0, 100));
  const band = score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low';
  const forecastUnits30d = Math.max(0, Math.round((score / 25) + activeQuotesCount * 0.7 + hotLeadsCount * 0.5));
  const confidence = clamp(Math.round((45 + Math.min(matchingLeadsCount + matchingQuotesCount + relevantConversationsCount, 12) * 4) - (matchingLeadsCount === 0 ? 10 : 0)), 35, 92);

  const trend = ['Now', '+7d', '+14d', '+21d'].map((label, index) => ({
    label,
    demand: Math.round(clamp(score + (index - 1) * (recentLeadsCount + activeQuotesCount) * 2 - Math.max(averageDaysOnLot - 45, 0) / 8, 0, 100)),
  }));

  if (signals.length === 0) signals.push(vehicleText(vehicle) ? 'sparse matched demand data' : 'portfolio-level sparse demand data');

  return { score, band, forecastUnits30d, confidence, signals, trend };
}

export function calculateQuoteTotals(input: QuoteCalculationInput): QuoteCalculationResult {
  const sellingPrice = Math.max(0, safeNumber(input.sellingPrice));
  const downPayment = Math.max(0, safeNumber(input.downPayment));
  const tradeInValue = Math.max(0, safeNumber(input.tradeInValue));
  const taxRate = clamp(safeNumber(input.taxRate, 0.13), 0, 0.25);
  const fees = Math.max(0, safeNumber(input.fees, 499));
  const packages = (input.packages ?? []).filter(pkg => pkg && safeNumber(pkg.price) > 0);
  const packageTotal = packages.reduce((sum, pkg) => sum + safeNumber(pkg.price), 0);
  const taxablePackageTotal = packages.reduce((sum, pkg) => sum + (pkg.taxable === false ? 0 : safeNumber(pkg.price)), 0);
  const principal = Math.max(0, sellingPrice - downPayment - tradeInValue);
  const taxableSubtotal = Math.max(0, principal + taxablePackageTotal);
  const taxes = Math.round(taxableSubtotal * taxRate * 100) / 100;
  const totalCost = Math.round((principal + packageTotal + taxes + fees) * 100) / 100;
  const termMonths = Math.max(1, Math.round(safeNumber(input.termMonths, 72)));
  const interestRate = Math.max(0, safeNumber(input.interestRate, 5.99));
  const monthlyPayment = calculatePayment(totalCost, interestRate, termMonths);

  return {
    taxableSubtotal,
    principal,
    packageTotal,
    taxes,
    fees,
    totalCost,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    biweeklyPayment: Math.round((monthlyPayment / 2.17) * 100) / 100,
    taxRate,
    taxSource: input.taxSource || 'Configured rate',
    packages,
  };
}

export function calculatePayment(principal: number, rate: number, months: number): number {
  const safePrincipal = Math.max(0, safeNumber(principal));
  const safeMonths = Math.max(1, Math.round(safeNumber(months, 1)));
  const safeRate = Math.max(0, safeNumber(rate));
  if (safeRate === 0) return safePrincipal / safeMonths;
  const monthlyRate = safeRate / 100 / 12;
  return (safePrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -safeMonths));
}

export function suggestDynamicPrice(input: DynamicPriceInput): DynamicPriceSuggestion {
  const basePrice = Math.max(0, safeNumber(input.basePrice));
  const demand = forecastDemand(input);
  const daysOnLot = safeNumber(input.vehicle?.daysOnLot);
  const inventoryPressure = (input.vehicles ?? []).filter(vehicle => vehicle.status === 'available').length;
  let multiplier = 1;

  if (demand.band === 'high') multiplier += 0.025;
  if (demand.band === 'low') multiplier -= 0.02;
  if (daysOnLot > 60) multiplier -= 0.025;
  else if (daysOnLot > 30) multiplier -= 0.01;
  if (inventoryPressure > 5) multiplier -= 0.01;
  if (input.vehicle?.status && input.vehicle.status !== 'available') multiplier -= 0.015;

  const minPrice = input.minPrice ?? Math.round(basePrice * 0.92);
  const maxPrice = input.maxPrice ?? Math.round(basePrice * 1.05);
  const suggestedPrice = Math.round(clamp(basePrice * multiplier, minPrice, maxPrice) / 50) * 50;
  const delta = suggestedPrice - basePrice;
  const direction = delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'hold';
  const rationale = `Recommend ${direction} at $${suggestedPrice.toLocaleString()} based on ${demand.band} demand, ${demand.confidence}% demand confidence, and ${daysOnLot || 0} days on lot.`;

  return {
    suggestedPrice,
    delta,
    confidence: demand.confidence,
    rationale,
    contributingSignals: [...demand.signals, `pricing ${direction}`],
    demand,
  };
}

export function quoteScenarioFromCalculation(params: {
  id: string;
  quoteId: string;
  label: string;
  vehicleId: string;
  vehicleSummary: string;
  input: QuoteCalculationInput;
}): QuoteScenario {
  const totals = calculateQuoteTotals(params.input);
  return {
    id: params.id,
    quoteId: params.quoteId,
    label: params.label,
    vehicleId: params.vehicleId,
    vehicleSummary: params.vehicleSummary,
    sellingPrice: params.input.sellingPrice,
    downPayment: params.input.downPayment ?? 0,
    tradeInValue: params.input.tradeInValue ?? 0,
    termMonths: params.input.termMonths ?? 72,
    interestRate: params.input.interestRate ?? 5.99,
    monthlyPayment: totals.monthlyPayment,
    biweeklyPayment: totals.biweeklyPayment,
    totalCost: totals.totalCost,
    taxes: totals.taxes,
    fees: totals.fees,
    packages: totals.packages,
    taxRate: totals.taxRate,
    taxSource: totals.taxSource,
  };
}
