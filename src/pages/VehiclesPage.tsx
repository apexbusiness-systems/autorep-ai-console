import { useState, useMemo, useDeferredValue } from "react";
import { getVehicleImage } from "@/data/vehicle-images";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Car, DollarSign, Send, Plus, History,
  ArrowLeftRight, ChevronRight, Link2, Calculator,
  CheckCircle, X, FileText,
} from "lucide-react";
import { useVehicles, useQuotes, useLeads } from "@/hooks/use-store";

const calculatePayment = (principal: number, rate: number, months: number) => {
  if (rate === 0) return principal / months;
  const r = rate / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

const VehiclesPage = () => {
  const vehicles = useVehicles();
  const quotes = useQuotes();
  const leads = useLeads();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [bodyFilter, setBodyFilter] = useState('All');
  const [budgetFilter, setBudgetFilter] = useState('Any');
  const [statusFilter, setStatusFilter] = useState('All');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderVehicleId, setBuilderVehicleId] = useState<string | null>(null);
  const [downPayment, setDownPayment] = useState(0);
  const [tradeIn, setTradeIn] = useState(0);
  const [term, setTerm] = useState(72);
  const [rate, setRate] = useState(5.99);

  // ⚡ Bolt Performance Optimization: Single-Pass Filtering
  // Defers expensive list filtering from blocking the main thread during rapid typing
  // and replaces multiple chained `.filter()` calls with a single-pass filter.
  // Expected impact: Eliminates O(N) recalculations, reduces redundant traversals and intermediate memory allocations
  const filtered = useMemo(() => {
    const q = deferredSearchQuery ? deferredSearchQuery.toLowerCase() : null;
    let min = 0, max = 999999;
    if (budgetFilter !== 'Any') {
      const ranges: Record<string, [number, number]> = { 'Under $25K': [0, 25000], '$25K–$35K': [25000, 35000], '$35K–$50K': [35000, 50000], '$50K+': [50000, 999999] };
      [min, max] = ranges[budgetFilter] || [0, 999999];
    }
    const lowerStatusFilter = statusFilter.toLowerCase();

    return vehicles.filter(v => {
      if (q && !`${v.year} ${v.make} ${v.model} ${v.trim} ${v.stock}`.toLowerCase().includes(q)) return false;
      if (bodyFilter !== 'All' && v.body !== bodyFilter) return false;
      if (statusFilter !== 'All' && v.status !== lowerStatusFilter) return false;
      if (budgetFilter !== 'Any' && (v.price < min || v.price > max)) return false;
      return true;
    });
  }, [vehicles, deferredSearchQuery, bodyFilter, budgetFilter, statusFilter]);

  const builderVehicle = builderVehicleId ? vehicles.find(v => v.id === builderVehicleId) : null;
  const builderPrincipal = builderVehicle ? builderVehicle.price - downPayment - tradeIn : 0;
  const builderTaxes = builderPrincipal > 0 ? builderPrincipal * 0.13 : 0;
  const builderFees = 499;
  const builderTotal = builderPrincipal + builderTaxes + builderFees;
  const builderMonthly = builderTotal > 0 ? calculatePayment(builderTotal, rate, term) : 0;
  const builderBiweekly = builderMonthly / 2.17;

  // ⚡ Bolt Performance Optimization: Memoized array filter operation
  // Prevents O(N) recalculation on every render (e.g. fast-typing in search input)
  const compareVehicles = useMemo(() => vehicles.filter(v => compareIds.includes(v.id)), [vehicles, compareIds]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  // ⚡ Bolt Performance Optimization: Extract available vehicles into useMemo
  // Prevents recalculating the filtered list on every render
  const availableVehicles = useMemo(() => vehicles.filter(v => v.status === 'available'), [vehicles]);

  return (
    <AppLayout>
      <PageHeader
        title="Vehicles & Quotes"
        subtitle="Inventory search, quote builder, and scenario comparison"
        actions={
          <div className="flex gap-2">
            {compareIds.length >= 2 && (
              <Button variant="secondary" size="sm" onClick={() => setCompareIds([])}>
                <X className="w-4 h-4 mr-1" /> Clear Compare
              </Button>
            )}
            <Button variant="gold" size="sm" onClick={() => setShowBuilder(!showBuilder)}>
              <Plus className="w-4 h-4 mr-1" /> {showBuilder ? 'Close Builder' : 'New Quote'}
            </Button>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-[200px] flex items-center bg-secondary rounded-lg px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" placeholder="Search by make, model, stock #…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <select className="bg-secondary text-sm text-foreground rounded-lg px-3 py-2.5 border border-border outline-none shrink-0 w-auto" value={bodyFilter} onChange={e => setBodyFilter(e.target.value)}>
            <option>All</option><option>SUV</option><option>Truck</option><option>Sedan</option>
          </select>
          <select className="bg-secondary text-sm text-foreground rounded-lg px-3 py-2.5 border border-border outline-none shrink-0 w-auto" value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)}>
            <option>Any</option><option>Under $25K</option><option>$25K–$35K</option><option>$35K–$50K</option><option>$50K+</option>
          </select>
          <select className="bg-secondary text-sm text-foreground rounded-lg px-3 py-2.5 border border-border outline-none shrink-0 w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>All</option><option>Available</option><option>Hold</option><option>Incoming</option>
          </select>
        </div>

        {/* Compare bar */}
        {compareIds.length >= 2 && (
          <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-gold" /> Vehicle Comparison</h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareVehicles.length}, 1fr)` }}>
              {compareVehicles.map(v => (
                <div key={v.id} className="p-3 rounded-lg bg-card border border-border space-y-2">
                  <p className="text-sm font-semibold text-foreground">{v.year} {v.make} {v.model} {v.trim}</p>
                  <div className="space-y-1">
                    <CompareRow label="Price" value={`$${v.price.toLocaleString()}`} />
                    <CompareRow label="Payment" value={`$${v.estimatedPayment || '—'}/mo`} />
                    <CompareRow label="Mileage" value={v.mileage} />
                    <CompareRow label="Body" value={v.body} />
                    <CompareRow label="Color" value={v.exteriorColor || '—'} />
                    <CompareRow label="Days on Lot" value={String(v.daysOnLot || '—')} />
                    <CompareRow label="Features" value={v.features.slice(0, 3).join(', ')} />
                  </div>
                  <Button variant="gold-outline" size="sm" className="text-xs w-full" onClick={() => { setBuilderVehicleId(v.id); setShowBuilder(true); }}>
                    <DollarSign className="w-3 h-3 mr-1" /> Build Quote
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote Builder */}
        {showBuilder && (
          <div className="rounded-lg border border-gold/20 bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Calculator className="w-4 h-4 text-gold" /> Quote Builder</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-medium text-muted-foreground">Vehicle</label>
                <select className="w-full bg-secondary rounded-md px-3 py-2 text-sm text-foreground border border-border outline-none focus:border-gold/40" value={builderVehicleId || ''} onChange={e => setBuilderVehicleId(e.target.value)}>
                  <option value="">Select a vehicle</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} {v.trim} — ${v.price.toLocaleString()}</option>
                  ))}
                </select>
                <label className="text-[11px] font-medium text-muted-foreground">Down Payment ($)</label>
                <input type="number" className="w-full bg-secondary rounded-md px-3 py-2 text-sm text-foreground border border-border outline-none focus:border-gold/40" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} />
                <label className="text-[11px] font-medium text-muted-foreground">Trade-In Value ($)</label>
                <input type="number" className="w-full bg-secondary rounded-md px-3 py-2 text-sm text-foreground border border-border outline-none focus:border-gold/40" value={tradeIn} onChange={e => setTradeIn(Number(e.target.value))} />
                <label className="text-[11px] font-medium text-muted-foreground">Term (months)</label>
                <div className="flex gap-2">
                  {[36, 48, 60, 72, 84].map(t => (
                    <button key={t} onClick={() => setTerm(t)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${term === t ? 'bg-gold text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{t}</button>
                  ))}
                </div>
                <label className="text-[11px] font-medium text-muted-foreground">Interest Rate (%)</label>
                <input type="number" step="0.1" className="w-full bg-secondary rounded-md px-3 py-2 text-sm text-foreground border border-border outline-none focus:border-gold/40" value={rate} onChange={e => setRate(Number(e.target.value))} />
              </div>

              {builderVehicle && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                    <p className="text-sm font-semibold text-foreground">{builderVehicle.year} {builderVehicle.make} {builderVehicle.model} {builderVehicle.trim}</p>
                    <div className="space-y-1.5">
                      <QuoteRow label="Selling Price" value={`$${builderVehicle.price.toLocaleString()}`} />
                      <QuoteRow label="Down Payment" value={`-$${downPayment.toLocaleString()}`} />
                      <QuoteRow label="Trade-In" value={`-$${tradeIn.toLocaleString()}`} />
                      <div className="border-t border-border pt-1.5">
                        <QuoteRow label="Principal" value={`$${Math.max(0, builderPrincipal).toLocaleString()}`} />
                      </div>
                      <QuoteRow label="Taxes (13% HST)" value={`$${Math.round(builderTaxes).toLocaleString()}`} />
                      <QuoteRow label="Dealer Fees" value={`$${builderFees}`} />
                      <div className="border-t border-border pt-1.5">
                        <QuoteRow label="Total Financed" value={`$${Math.round(builderTotal).toLocaleString()}`} bold />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gold/5 border border-gold/15 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-foreground">Monthly Payment</span>
                      <span className="text-lg font-bold text-gold">${Math.round(builderMonthly).toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Bi-weekly</span>
                      <span className="text-sm font-medium text-foreground">${Math.round(builderBiweekly)}/bi-wk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{term} months @ {rate}%</span>
                      <span className="text-xs text-muted-foreground">Total: ${Math.round(builderMonthly * term).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>Rate disclaimer and fee schedule will be included</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="gold" size="sm" className="flex-1 text-xs"><Send className="w-3 h-3 mr-1" /> Send Quote</Button>
                    <Button variant="secondary" size="sm" className="flex-1 text-xs"><FileText className="w-3 h-3 mr-1" /> Save Draft</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="inventory">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0">
            <TabsTrigger value="inventory" className="text-xs">Inventory ({filtered.length})</TabsTrigger>
            <TabsTrigger value="quotes" className="text-xs">Recent Quotes ({quotes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-4">
            <div className="grid gap-3">
              {filtered.map((v) => (
                <div key={v.id} className={`flex items-center justify-between p-4 rounded-lg bg-card border hover-lift smooth-transition ${compareIds.includes(v.id) ? 'border-gold/40 bg-gold/5' : 'border-border hover:border-gold/20'}`}>
                  <div className="flex items-center gap-4">
                    {getVehicleImage(v.id) ? (
                      <img src={getVehicleImage(v.id)} alt={`${v.year} ${v.make} ${v.model}`} className="w-20 h-14 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="w-20 h-14 rounded-lg bg-secondary flex items-center justify-center">
                        <Car className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{v.year} {v.make} {v.model} {v.trim}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{v.body}</span>
                        <span className="text-xs text-muted-foreground">{v.mileage}</span>
                        <span className="text-xs text-muted-foreground">Stock #{v.stock}</span>
                        {v.daysOnLot !== undefined && <span className="text-xs text-muted-foreground">{v.daysOnLot}d on lot</span>}
                      </div>
                      {v.features.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {v.features.slice(0, 3).map(f => (
                            <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gold">${v.price.toLocaleString()}</p>
                      {v.estimatedPayment && <p className="text-xs text-muted-foreground">Est. ${v.estimatedPayment}/mo</p>}
                    </div>
                    <StatusBadge status={v.status === 'available' ? 'active' : v.status === 'hold' ? 'pending' : 'idle'} label={v.status.charAt(0).toUpperCase() + v.status.slice(1)} />
                    <div className="flex gap-1">
                      <Button variant="gold-outline" size="sm" className="text-xs" onClick={() => { setBuilderVehicleId(v.id); setShowBuilder(true); }}><DollarSign className="w-3 h-3 mr-1" /> Quote</Button>
                      <Button variant="secondary" size="sm" className="text-xs"><Send className="w-3 h-3 mr-1" /> Send</Button>
                      <Button variant={compareIds.includes(v.id) ? 'gold' : 'secondary'} size="sm" className="text-xs" onClick={() => toggleCompare(v.id)}><ArrowLeftRight className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quotes" className="mt-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Quote #</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Customer</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Vehicles</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Date</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Rev</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => {
                    const lead = leads.find(l => l.id === q.leadId);
                    return (
                      <tr key={q.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gold">{q.quoteNumber}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{lead?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{q.scenarios.map(s => s.vehicleSummary).join(' vs ')}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-1"><History className="w-3 h-3" /> v{q.revision}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={q.status === 'sent' ? 'active' : q.status === 'viewed' ? 'warm' : q.status === 'accepted' ? 'connected' : 'pending'} label={q.status.charAt(0).toUpperCase() + q.status.slice(1)} />
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" className="text-xs">Open <ChevronRight className="w-3 h-3 ml-1" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border flex items-center gap-3">
              <Link2 className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground">All quotes are linked to their respective lead, vehicle, and conversation records for full traceability.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const CompareRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-[11px] text-foreground font-medium">{value}</span>
  </div>
);

const QuoteRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between">
    <span className={`text-xs ${bold ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{label}</span>
    <span className={`text-xs ${bold ? 'text-gold font-semibold' : 'text-foreground'}`}>{value}</span>
  </div>
);

export default VehiclesPage;
