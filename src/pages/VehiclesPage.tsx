import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Car, DollarSign, Send, Plus, History,
  ArrowLeftRight, ChevronRight, Link2
} from "lucide-react";

const inventory = [
  { stock: "T-4892", year: 2024, make: "Toyota", model: "RAV4", trim: "XLE", body: "SUV", price: 33450, payment: 489, mileage: "New", status: "Available" },
  { stock: "H-3201", year: 2023, make: "Honda", model: "CR-V", trim: "EX", body: "SUV", price: 29900, payment: 435, mileage: "12,400 mi", status: "Available" },
  { stock: "HY-1055", year: 2024, make: "Hyundai", model: "Tucson", trim: "SEL", body: "SUV", price: 31200, payment: 455, mileage: "New", status: "Available" },
  { stock: "F-7834", year: 2023, make: "Ford", model: "F-150", trim: "XLT", body: "Truck", price: 42900, payment: 625, mileage: "8,200 mi", status: "Hold" },
  { stock: "C-2190", year: 2024, make: "Chevrolet", model: "Equinox", trim: "LT", body: "SUV", price: 28500, payment: 415, mileage: "New", status: "Available" },
];

const quoteHistory = [
  { id: "Q-1001", customer: "Sarah Mitchell", vehicles: "RAV4 XLE vs CR-V EX", date: "Today, 2:30 PM", status: "Sent", revision: 1 },
  { id: "Q-0998", customer: "James Cooper", vehicles: "F-150 XLT", date: "Today, 11:15 AM", status: "Draft", revision: 2 },
  { id: "Q-0995", customer: "Jennifer Wu", vehicles: "Equinox LT", date: "Yesterday", status: "Viewed", revision: 1 },
];

const VehiclesPage = () => (
  <AppLayout>
    <PageHeader
      title="Vehicles & Quotes"
      subtitle="Inventory search, quote builder, and scenario comparison"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Plus className="w-4 h-4 mr-1" /> New Quote</Button>
        </div>
      }
    />
    <div className="p-6 space-y-6">
      {/* Search Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center bg-secondary rounded-lg px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" placeholder="Search by make, model, stock #…" />
        </div>
        <select className="bg-secondary text-sm text-foreground rounded-lg px-3 py-2.5 border border-border outline-none">
          <option>All Body Styles</option><option>SUV</option><option>Truck</option><option>Sedan</option>
        </select>
        <select className="bg-secondary text-sm text-foreground rounded-lg px-3 py-2.5 border border-border outline-none">
          <option>Budget: Any</option><option>Under $25K</option><option>$25K–$35K</option><option>$35K–$50K</option><option>$50K+</option>
        </select>
        <select className="bg-secondary text-sm text-foreground rounded-lg px-3 py-2.5 border border-border outline-none">
          <option>Payment: Any</option><option>Under $400/mo</option><option>$400–$500/mo</option><option>$500+/mo</option>
        </select>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0">
          <TabsTrigger value="inventory" className="text-xs">Inventory ({inventory.length})</TabsTrigger>
          <TabsTrigger value="quotes" className="text-xs">Recent Quotes ({quoteHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <div className="grid gap-3">
            {inventory.map((v) => (
              <div key={v.stock} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-gold/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Car className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{v.year} {v.make} {v.model} {v.trim}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{v.body}</span>
                      <span className="text-xs text-muted-foreground">{v.mileage}</span>
                      <span className="text-xs text-muted-foreground">Stock #{v.stock}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gold">${v.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Est. ${v.payment}/mo</p>
                  </div>
                  <StatusBadge status={v.status === "Available" ? "active" : "pending"} label={v.status} />
                  <div className="flex gap-1">
                    <Button variant="gold-outline" size="sm" className="text-xs"><DollarSign className="w-3 h-3 mr-1" /> Quote</Button>
                    <Button variant="secondary" size="sm" className="text-xs"><Send className="w-3 h-3 mr-1" /> Send</Button>
                    <Button variant="secondary" size="sm" className="text-xs"><ArrowLeftRight className="w-3 h-3" /></Button>
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
                {quoteHistory.map((q) => (
                  <tr key={q.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gold">{q.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{q.customer}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{q.vehicles}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{q.date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-1"><History className="w-3 h-3" /> v{q.revision}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status === "Sent" ? "active" : q.status === "Viewed" ? "warm" : "pending"} label={q.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-xs">Open <ChevronRight className="w-3 h-3 ml-1" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quote-Lead Linkage */}
          <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border flex items-center gap-3">
            <Link2 className="w-4 h-4 text-gold" />
            <span className="text-xs text-muted-foreground">All quotes are linked to their respective lead and vehicle unit records for full traceability.</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </AppLayout>
);

export default VehiclesPage;
