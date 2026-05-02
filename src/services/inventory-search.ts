/**
 * Consolidated Inventory Search Service
 * Aggregates vehicle listings from multiple sources into one unified interface.
 *
 * Integrations:
 * - Marketcheck API (listings from 25K+ dealers, US/CA)
 * - CarQuery API (make/model/trim reference data, free, no key)
 * - NHTSA vPIC API (VIN decoding, vehicle specs, trade-in identification)
 */

export interface InventorySearchFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  exteriorColor?: string;
  radius?: number; // km
  postalCode?: string;
  condition?: 'new' | 'used' | 'all';
  sortBy?: 'price_asc' | 'price_desc' | 'mileage_asc' | 'year_desc' | 'distance';
  page?: number;
  pageSize?: number;
}

export interface InventoryListing {
  id: string;
  source: 'marketcheck' | 'local' | 'vauto' | 'manual';
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body: string;
  mileage: number;
  price: number;
  msrp?: number;
  exteriorColor?: string;
  interiorColor?: string;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  engine?: string;
  photoUrl?: string;
  dealerName?: string;
  dealerCity?: string;
  dealerProvince?: string;
  distance?: number;
  daysOnMarket?: number;
  condition: 'new' | 'used';
  features: string[];
  url?: string;
}

export interface VINDecodeResult {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  body?: string;
  engine?: string;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  doors?: number;
  plantCountry?: string;
  errorCode?: string;
  errorText?: string;
  valid: boolean;
}

export interface CarQueryMake {
  make_id: string;
  make_display: string;
  make_country: string;
}

export interface CarQueryModel {
  model_name: string;
  model_make_id: string;
  model_trim?: string;
  model_year?: number;
  model_body?: string;
  model_engine_fuel?: string;
  model_transmission_type?: string;
  model_drive?: string;
  model_seats?: number;
}

// ─── Marketcheck API ────────────────────────────────────────────────────────

class MarketCheckService {
  private apiKey: string = '';
  private baseUrl = 'https://mc-api.marketcheck.com/v2';

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchListings(filters: InventorySearchFilters): Promise<InventoryListing[]> {
    if (!this.isConfigured()) {
      return this.getDemoListings(filters);
    }

    const params = new URLSearchParams({
      api_key: this.apiKey,
      country: 'CA',
      ...(filters.make && { make: filters.make }),
      ...(filters.model && { model: filters.model }),
      ...(filters.yearMin && { year_range: `${filters.yearMin}-${filters.yearMax || 2026}` }),
      ...(filters.priceMin && { price_range: `${filters.priceMin}-${filters.priceMax || 999999}` }),
      ...(filters.mileageMax && { miles_range: `0-${filters.mileageMax}` }),
      ...(filters.bodyType && { body_type: filters.bodyType }),
      ...(filters.radius && { radius: String(filters.radius) }),
      ...(filters.postalCode && { zip: filters.postalCode }),
      ...(filters.sortBy && { sort_by: filters.sortBy.replace('_asc', '|asc').replace('_desc', '|desc') }),
      rows: String(filters.pageSize || 20),
      start: String(((filters.page || 1) - 1) * (filters.pageSize || 20)),
    });

    try {
      const response = await fetch(`${this.baseUrl}/search/car/active?${params}`);
      if (!response.ok) throw new Error(`Marketcheck API error: ${response.status}`);
      const data = await response.json();

      return (data.listings || []).map((l: Record<string, unknown>) => ({
        id: `mc-${l.id}`,
        source: 'marketcheck' as const,
        vin: l.vin as string,
        year: l.year as number,
        make: l.make as string,
        model: l.model as string,
        trim: (l.trim as string) || '',
        body: (l.body_type as string) || '',
        mileage: l.miles as number || 0,
        price: l.price as number || 0,
        msrp: l.msrp as number,
        exteriorColor: l.exterior_color as string,
        interiorColor: l.interior_color as string,
        fuelType: l.fuel_type as string,
        transmission: l.transmission as string,
        drivetrain: l.drivetrain as string,
        engine: l.engine as string,
        dealerName: (l.dealer as Record<string, unknown>)?.name as string,
        dealerCity: (l.dealer as Record<string, unknown>)?.city as string,
        dealerProvince: (l.dealer as Record<string, unknown>)?.state as string,
        distance: l.dist as number,
        daysOnMarket: l.dom as number,
        condition: (l.inventory_type === 'new' ? 'new' : 'used') as 'new' | 'used',
        features: [],
        photoUrl: (l.media as Record<string, unknown>)?.photo_links?.[0] as string,
        url: l.vdp_url as string,
      }));
    } catch (err) {
      console.warn('[Marketcheck] Search failed:', err);
      return this.getDemoListings(filters);
    }
  }

  private getDemoListings(filters: InventorySearchFilters): InventoryListing[] {
    const listings: InventoryListing[] = [
      { id: 'mc-demo-1', source: 'marketcheck', vin: '2T1BURHE0JC123456', year: 2024, make: 'Toyota', model: 'RAV4', trim: 'XLE AWD', body: 'SUV', mileage: 0, price: 38450, msrp: 39999, condition: 'new', exteriorColor: 'Lunar Rock', fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: 'AWD', dealerName: 'Metro Toyota', dealerCity: 'Toronto', dealerProvince: 'ON', distance: 5, daysOnMarket: 12, features: ['Apple CarPlay', 'Heated Seats', 'Blind Spot Monitor'] },
      { id: 'mc-demo-2', source: 'marketcheck', vin: '5J6RW2H89NL012345', year: 2023, make: 'Honda', model: 'CR-V', trim: 'EX-L', body: 'SUV', mileage: 14200, price: 35900, condition: 'used', exteriorColor: 'Crystal Black Pearl', fuelType: 'Gasoline', transmission: 'CVT', drivetrain: 'AWD', dealerName: 'City Honda', dealerCity: 'Mississauga', dealerProvince: 'ON', distance: 12, daysOnMarket: 8, features: ['Leather', 'Sunroof', 'Lane Keep Assist'] },
      { id: 'mc-demo-3', source: 'marketcheck', vin: '1FTFW1E58NF234567', year: 2024, make: 'Ford', model: 'F-150', trim: 'XLT SuperCrew', body: 'Truck', mileage: 0, price: 52900, msrp: 55200, condition: 'new', exteriorColor: 'Oxford White', fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: '4WD', dealerName: 'Suburban Ford', dealerCity: 'Brampton', dealerProvince: 'ON', distance: 18, daysOnMarket: 22, features: ['Pro Trailer Backup', 'SYNC 4', 'Tow Package'] },
      { id: 'mc-demo-4', source: 'marketcheck', vin: 'KM8R34HE5NU345678', year: 2024, make: 'Hyundai', model: 'Tucson', trim: 'Preferred AWD', body: 'SUV', mileage: 0, price: 34500, msrp: 35999, condition: 'new', exteriorColor: 'Amazon Grey', fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: 'AWD', dealerName: 'Durham Hyundai', dealerCity: 'Whitby', dealerProvince: 'ON', distance: 25, daysOnMarket: 15, features: ['SmartSense Safety', 'Wireless Charging', 'Heated Steering Wheel'] },
      { id: 'mc-demo-5', source: 'marketcheck', vin: '3CZRU5H74PM456789', year: 2023, make: 'Honda', model: 'HR-V', trim: 'Sport', body: 'SUV', mileage: 8700, price: 29900, condition: 'used', exteriorColor: 'Urban Gray Pearl', fuelType: 'Gasoline', transmission: 'CVT', drivetrain: 'FWD', dealerName: 'Oakville Honda', dealerCity: 'Oakville', dealerProvince: 'ON', distance: 22, daysOnMarket: 5, features: ['Honda Sensing', 'Sport Wheels', 'Rear Camera'] },
      { id: 'mc-demo-6', source: 'marketcheck', vin: '5YJ3E1EA1PF567890', year: 2024, make: 'Chevrolet', model: 'Equinox', trim: 'RS AWD', body: 'SUV', mileage: 3200, price: 36800, condition: 'used', exteriorColor: 'Sterling Grey', fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: 'AWD', dealerName: 'Valley Chevrolet', dealerCity: 'Hamilton', dealerProvince: 'ON', distance: 35, daysOnMarket: 18, features: ['RS Sport Package', 'Bose Audio', 'Panoramic Sunroof'] },
    ];

    // ⚡ Bolt Performance Optimization: Single-Pass Array Filtering
    // Replaced multiple chained `.filter()` calls with a single-pass filter.
    // Extracted loop-invariant values (like lowercase strings) outside the loop to minimize allocation overhead.
    // Expected impact: Eliminates redundant O(N) traversals and intermediate memory allocations during array searches.

    const filterMake = filters.make?.toLowerCase();
    const filterModel = filters.model?.toLowerCase();
    const filterBodyType = filters.bodyType?.toLowerCase();
    const filterCondition = filters.condition !== 'all' ? filters.condition : undefined;

    return listings.filter(l => {
      if (filterMake && l.make.toLowerCase() !== filterMake) return false;
      if (filterModel && !l.model.toLowerCase().includes(filterModel)) return false;
      if (filters.priceMax !== undefined && l.price > filters.priceMax) return false;
      if (filters.priceMin !== undefined && l.price < filters.priceMin) return false;
      if (filterBodyType && l.body.toLowerCase() !== filterBodyType) return false;
      if (filterCondition && l.condition !== filterCondition) return false;
      return true;
    });
  }
}

// ─── CarQuery API ───────────────────────────────────────────────────────────

class CarQueryService {
  private baseUrl = 'https://www.carqueryapi.com/api/0.3';

  async getMakes(year?: number): Promise<CarQueryMake[]> {
    try {
      const params = new URLSearchParams({ cmd: 'getMakes', ...(year && { year: String(year) }) });
      const response = await fetch(`${this.baseUrl}/?${params}`);
      if (!response.ok) throw new Error(`CarQuery API error: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.replace(/^\?\(/, '').replace(/\);?$/, ''));
      return json.Makes || [];
    } catch {
      return [
        { make_id: 'toyota', make_display: 'Toyota', make_country: 'Japan' },
        { make_id: 'honda', make_display: 'Honda', make_country: 'Japan' },
        { make_id: 'ford', make_display: 'Ford', make_country: 'United States' },
        { make_id: 'chevrolet', make_display: 'Chevrolet', make_country: 'United States' },
        { make_id: 'hyundai', make_display: 'Hyundai', make_country: 'South Korea' },
        { make_id: 'kia', make_display: 'Kia', make_country: 'South Korea' },
        { make_id: 'nissan', make_display: 'Nissan', make_country: 'Japan' },
        { make_id: 'mazda', make_display: 'Mazda', make_country: 'Japan' },
        { make_id: 'subaru', make_display: 'Subaru', make_country: 'Japan' },
        { make_id: 'volkswagen', make_display: 'Volkswagen', make_country: 'Germany' },
        { make_id: 'bmw', make_display: 'BMW', make_country: 'Germany' },
        { make_id: 'mercedes_benz', make_display: 'Mercedes-Benz', make_country: 'Germany' },
        { make_id: 'ram', make_display: 'RAM', make_country: 'United States' },
        { make_id: 'gmc', make_display: 'GMC', make_country: 'United States' },
        { make_id: 'jeep', make_display: 'Jeep', make_country: 'United States' },
      ];
    }
  }

  async getModels(make: string, year?: number): Promise<CarQueryModel[]> {
    try {
      const params = new URLSearchParams({ cmd: 'getModels', make, ...(year && { year: String(year) }) });
      const response = await fetch(`${this.baseUrl}/?${params}`);
      if (!response.ok) throw new Error(`CarQuery API error: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.replace(/^\?\(/, '').replace(/\);?$/, ''));
      return json.Models || [];
    } catch {
      return [];
    }
  }

  async getTrims(make: string, model: string, year?: number): Promise<CarQueryModel[]> {
    try {
      const params = new URLSearchParams({ cmd: 'getTrims', make, model, ...(year && { year: String(year) }) });
      const response = await fetch(`${this.baseUrl}/?${params}`);
      if (!response.ok) throw new Error(`CarQuery API error: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.replace(/^\?\(/, '').replace(/\);?$/, ''));
      return json.Trims || [];
    } catch {
      return [];
    }
  }
}

// ─── NHTSA vPIC API ─────────────────────────────────────────────────────────

class NHTSAService {
  private baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles';

  async decodeVIN(vin: string): Promise<VINDecodeResult> {
    try {
      const response = await fetch(`${this.baseUrl}/DecodeVin/${vin}?format=json`);
      if (!response.ok) throw new Error(`NHTSA API error: ${response.status}`);
      const data = await response.json();
      const results = data.Results || [];

      const getValue = (variableId: number): string => {
        const entry = results.find((r: Record<string, unknown>) => r.VariableId === variableId);
        return (entry?.Value as string) || '';
      };

      const errorCode = getValue(143);

      return {
        vin,
        year: parseInt(getValue(29)) || 0,
        make: getValue(26),
        model: getValue(28),
        trim: getValue(109),
        body: getValue(5),
        engine: `${getValue(13)} ${getValue(21)}`.trim(),
        fuelType: getValue(24),
        transmission: getValue(37),
        drivetrain: getValue(15),
        doors: parseInt(getValue(14)) || undefined,
        plantCountry: getValue(75),
        errorCode,
        errorText: errorCode !== '0' ? getValue(144) : undefined,
        valid: errorCode === '0' || errorCode === '',
      };
    } catch (err) {
      console.warn('[NHTSA] VIN decode failed:', err);
      return {
        vin,
        year: 0,
        make: '',
        model: '',
        valid: false,
        errorCode: 'NETWORK_ERROR',
        errorText: 'Failed to connect to NHTSA API',
      };
    }
  }

  async getRecalls(make: string, model: string, year: number): Promise<{ count: number; recalls: { component: string; summary: string; consequence: string }[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/GetAllMakes?format=json`);
      if (!response.ok) return { count: 0, recalls: [] };
      // Simplified - real implementation would hit recall API
      return { count: 0, recalls: [] };
    } catch {
      return { count: 0, recalls: [] };
    }
  }
}

// ─── Unified Search Service ─────────────────────────────────────────────────

class InventorySearchService {
  readonly marketcheck = new MarketCheckService();
  readonly carQuery = new CarQueryService();
  readonly nhtsa = new NHTSAService();

  configureMarketcheck(apiKey: string) {
    this.marketcheck.configure(apiKey);
  }

  async search(filters: InventorySearchFilters): Promise<InventoryListing[]> {
    return this.marketcheck.searchListings(filters);
  }

  async decodeVIN(vin: string): Promise<VINDecodeResult> {
    return this.nhtsa.decodeVIN(vin);
  }

  async getMakes(year?: number) {
    return this.carQuery.getMakes(year);
  }

  async getModels(make: string, year?: number) {
    return this.carQuery.getModels(make, year);
  }
}

export const inventorySearch = new InventorySearchService();
export default inventorySearch;
