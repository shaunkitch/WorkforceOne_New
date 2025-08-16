// Currency and location utilities
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // Rate to USD
}

export interface CountryInfo {
  country: string;
  countryCode: string;
  currency: CurrencyInfo;
  timezone: string;
}

// Currency mapping with exchange rates (you'd typically fetch these from an API)
export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.85 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRate: 0.73 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', exchangeRate: 18.50 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', exchangeRate: 1.35 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', exchangeRate: 1.50 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', exchangeRate: 110 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', exchangeRate: 74 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', exchangeRate: 5.20 },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', exchangeRate: 20 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', exchangeRate: 1.35 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', exchangeRate: 7.80 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', exchangeRate: 6.45 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', exchangeRate: 1180 },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', exchangeRate: 8.60 },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', exchangeRate: 8.40 },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', exchangeRate: 6.30 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', exchangeRate: 0.92 },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', exchangeRate: 3.90 },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', exchangeRate: 21.50 },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', exchangeRate: 295 },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', exchangeRate: 70 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', exchangeRate: 8.50 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', exchangeRate: 3.67 },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', exchangeRate: 3.75 },
  EGP: { code: 'EGP', symbol: '£', name: 'Egyptian Pound', exchangeRate: 15.70 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', exchangeRate: 410 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', exchangeRate: 108 },
  GHS: { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', exchangeRate: 6.10 },
  MAD: { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', exchangeRate: 8.90 },
  TND: { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', exchangeRate: 2.80 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', exchangeRate: 50 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', exchangeRate: 32 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', exchangeRate: 23000 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', exchangeRate: 14200 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', exchangeRate: 4.15 },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', exchangeRate: 28 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', exchangeRate: 1.40 },
  CLP: { code: 'CLP', symbol: '$', name: 'Chilean Peso', exchangeRate: 720 },
  COP: { code: 'COP', symbol: '$', name: 'Colombian Peso', exchangeRate: 3800 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', exchangeRate: 3.60 },
  ARS: { code: 'ARS', symbol: '$', name: 'Argentine Peso', exchangeRate: 95 },
  UYU: { code: 'UYU', symbol: '$', name: 'Uruguayan Peso', exchangeRate: 43 },
  CRC: { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', exchangeRate: 620 },
  GTQ: { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', exchangeRate: 7.70 },
  BOB: { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', exchangeRate: 6.90 },
  PYG: { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', exchangeRate: 6800 },
  DOP: { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', exchangeRate: 56 },
  JMD: { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', exchangeRate: 150 },
  TTD: { code: 'TTD', symbol: 'TT$', name: 'Trinidad Dollar', exchangeRate: 6.80 },
  BBD: { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar', exchangeRate: 2 },
  XCD: { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar', exchangeRate: 2.70 },
  KYD: { code: 'KYD', symbol: 'CI$', name: 'Cayman Islands Dollar', exchangeRate: 0.83 },
  BMD: { code: 'BMD', symbol: 'BD$', name: 'Bermudian Dollar', exchangeRate: 1 },
  BZD: { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar', exchangeRate: 2 },
  HNL: { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', exchangeRate: 24 },
  NIO: { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', exchangeRate: 35 },
  PAB: { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', exchangeRate: 1 },
  SVC: { code: 'SVC', symbol: '₡', name: 'Salvadoran Colón', exchangeRate: 8.75 },
  AWG: { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin', exchangeRate: 1.80 },
  ANG: { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder', exchangeRate: 1.80 },
  SRD: { code: 'SRD', symbol: '$', name: 'Surinamese Dollar', exchangeRate: 14.30 },
  GYD: { code: 'GYD', symbol: 'G$', name: 'Guyanese Dollar', exchangeRate: 209 },
  FKP: { code: 'FKP', symbol: '£', name: 'Falkland Islands Pound', exchangeRate: 0.73 }
};

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD',
  EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', 
  BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR', IE: 'EUR', LU: 'EUR',
  GR: 'EUR', CY: 'EUR', MT: 'EUR', SI: 'EUR', SK: 'EUR', EE: 'EUR',
  LV: 'EUR', LT: 'EUR', AD: 'EUR', MC: 'EUR', SM: 'EUR', VA: 'EUR',
  ZA: 'ZAR', JP: 'JPY', IN: 'INR', BR: 'BRL', MX: 'MXN',
  SG: 'SGD', HK: 'HKD', CN: 'CNY', KR: 'KRW', TW: 'TWD',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF', PL: 'PLN',
  CZ: 'CZK', HU: 'HUF', RU: 'RUB', TR: 'TRY', AE: 'AED',
  SA: 'SAR', EG: 'EGP', NG: 'NGN', KE: 'KES', GH: 'GHS',
  MA: 'MAD', TN: 'TND', PH: 'PHP', TH: 'THB', VN: 'VND',
  ID: 'IDR', MY: 'MYR', CL: 'CLP', CO: 'COP', PE: 'PEN',
  AR: 'ARS', UY: 'UYU', CR: 'CRC', GT: 'GTQ', BO: 'BOB',
  PY: 'PYG', DO: 'DOP', JM: 'JMD', TT: 'TTD', BB: 'BBD',
  AG: 'XCD', DM: 'XCD', GD: 'XCD', KN: 'XCD', LC: 'XCD',
  VC: 'XCD', KY: 'KYD', BM: 'BMD', BZ: 'BZD', HN: 'HNL',
  NI: 'NIO', PA: 'PAB', SV: 'SVC', AW: 'AWG', CW: 'ANG',
  SX: 'ANG', SR: 'SRD', GY: 'GYD', FK: 'FKP'
};

// Get user's location and currency
export async function getUserLocationAndCurrency(): Promise<CountryInfo> {
  try {
    // Try to get location from multiple sources
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    
    const data = await response.json();
    const countryCode = data.country_code;
    const currencyCode = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
    const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
    
    return {
      country: data.country_name || 'Unknown',
      countryCode: countryCode || 'US',
      currency,
      timezone: data.timezone || 'UTC'
    };
  } catch (error) {
    // Fallback to USD if location detection fails
    return {
      country: 'United States',
      countryCode: 'US',
      currency: CURRENCIES.USD,
      timezone: 'UTC'
    };
  }
}

// Convert price from USD to target currency
export function convertPrice(priceUSD: number, targetCurrency: CurrencyInfo): number {
  const convertedPrice = priceUSD * targetCurrency.exchangeRate;
  
  // Round to appropriate decimal places based on currency
  if (targetCurrency.code === 'JPY' || targetCurrency.code === 'KRW' || 
      targetCurrency.code === 'VND' || targetCurrency.code === 'IDR') {
    return Math.round(convertedPrice); // No decimals for these currencies
  }
  
  return Math.round(convertedPrice * 100) / 100; // 2 decimal places
}

// Format price with currency symbol
export function formatPrice(price: number, currency: CurrencyInfo): string {
  const roundedPrice = convertPrice(price, currency);
  
  // Format based on currency
  if (currency.code === 'JPY' || currency.code === 'KRW' || 
      currency.code === 'VND' || currency.code === 'IDR') {
    return `${currency.symbol}${roundedPrice.toLocaleString()}`;
  }
  
  return `${currency.symbol}${roundedPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Get currency by country code
export function getCurrencyByCountry(countryCode: string): CurrencyInfo {
  const currencyCode = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
  return CURRENCIES[currencyCode] || CURRENCIES.USD;
}

// Update exchange rates (you'd call this periodically)
export async function updateExchangeRates(): Promise<void> {
  try {
    // This would typically call a real exchange rate API
    // For demo purposes, we'll use static rates
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      
      // Update rates for supported currencies
      Object.keys(CURRENCIES).forEach(code => {
        if (data.rates[code]) {
          CURRENCIES[code].exchangeRate = data.rates[code];
        }
      });
    }
  } catch (error) {
    // Silently fail and use static rates
  }
}