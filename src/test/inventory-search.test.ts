import { describe, it, expect, vi, afterEach } from "vitest";
import { inventorySearch } from "@/services/inventory-search";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Inventory Search Service", () => {
  describe("Marketcheck (demo mode)", () => {
    it("returns demo listings when not configured", async () => {
      const results = await inventorySearch.search({});
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("id");
      expect(results[0]).toHaveProperty("make");
      expect(results[0]).toHaveProperty("price");
    });

    it("filters by make", async () => {
      const results = await inventorySearch.search({ make: "Toyota" });
      expect(results.every(r => r.make === "Toyota")).toBe(true);
    });

    it("filters by model", async () => {
      const results = await inventorySearch.search({ model: "RAV4" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.model.includes("RAV4"))).toBe(true);
    });

    it("filters by price range", async () => {
      const results = await inventorySearch.search({ priceMin: 30000, priceMax: 40000 });
      expect(results.every(r => r.price >= 30000 && r.price <= 40000)).toBe(true);
    });

    it("filters by body type", async () => {
      const results = await inventorySearch.search({ bodyType: "SUV" });
      expect(results.every(r => r.body.toLowerCase() === "suv")).toBe(true);
    });

    it("filters by condition", async () => {
      const newResults = await inventorySearch.search({ condition: "new" });
      expect(newResults.every(r => r.condition === "new")).toBe(true);

      const usedResults = await inventorySearch.search({ condition: "used" });
      expect(usedResults.every(r => r.condition === "used")).toBe(true);
    });

    it("returns all when condition is 'all'", async () => {
      const all = await inventorySearch.search({ condition: "all" });
      const noFilter = await inventorySearch.search({});
      expect(all.length).toBe(noFilter.length);
    });

    it("returns results with correct structure", async () => {
      const results = await inventorySearch.search({});
      const listing = results[0];
      expect(listing.source).toBe("marketcheck");
      expect(typeof listing.year).toBe("number");
      expect(typeof listing.price).toBe("number");
      expect(Array.isArray(listing.features)).toBe(true);
    });

    it("returns empty array for non-matching make", async () => {
      const results = await inventorySearch.search({ make: "Lamborghini" });
      expect(results).toHaveLength(0);
    });
  });

  describe("CarQuery (demo fallback)", () => {
    it("returns demo makes list", async () => {
      const makes = await inventorySearch.getMakes();
      expect(makes.length).toBeGreaterThan(0);
      expect(makes.find(m => m.make_display === "Toyota")).toBeTruthy();
      expect(makes.find(m => m.make_display === "Honda")).toBeTruthy();
      expect(makes.find(m => m.make_display === "Ford")).toBeTruthy();
    }, 15000);

    it("returns models for a make (may be empty in demo)", async () => {
      const models = await inventorySearch.getModels("toyota");
      expect(Array.isArray(models)).toBe(true);
    }, 15000);
  });

  describe("NHTSA VIN Decode", () => {
    it("returns decode result structure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          Results: [
            { VariableId: 143, Value: "0" },
            { VariableId: 29, Value: "2018" },
            { VariableId: 26, Value: "TOYOTA" },
            { VariableId: 28, Value: "Corolla" },
          ],
        }),
      } as Response);

      const result = await inventorySearch.decodeVIN("2T1BURHE0JC001234");
      expect(result).toMatchObject({
        vin: "2T1BURHE0JC001234",
        valid: true,
        year: 2018,
        make: "TOYOTA",
        model: "Corolla",
      });
    });


    it("rejects malformed VIN locally without network call", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await inventorySearch.decodeVIN("INVALID");

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        vin: "INVALID",
        valid: false,
        errorCode: "INVALID_FORMAT",
      });
    });

    it("normalizes VIN before API decode", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          Results: [{ VariableId: 143, Value: "0" }],
        }),
      } as Response);

      const result = await inventorySearch.decodeVIN(" 2t1burhe0jc001234 ");
      expect(result.vin).toBe("2T1BURHE0JC001234");
      expect(result.valid).toBe(true);
    });
  });
});
