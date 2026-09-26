/**
 * Currency Conversion Logic for DemiTech Web Services
 * Detects user location and converts ZAR prices to local currency.
 */

const CONFIG = {
    baseCurrency: 'ZAR',
    apiLocation: 'https://ipapi.co/json/',
    apiRates: 'https://open.er-api.com/v6/latest/ZAR',
    cacheKey: 'demitech_currency_data',
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    currencySymbols: {
        'ZAR': 'R',
        'USD': '$',
        'GBP': '£',
        'EUR': '€',
        'AUD': 'A$',
        'CAD': 'C$',
        'INR': '₹',
        // Add more as needed or use Intl.NumberFormat
    }
};

async function getCurrencyData() {
    const cached = localStorage.getItem(CONFIG.cacheKey);
    if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < CONFIG.cacheExpiry) {
            return data;
        }
    }

    try {
        // 1. Get user location and currency
        const locResponse = await fetch(CONFIG.apiLocation);
        const locData = await locResponse.json();
        const targetCurrency = locData.currency || 'USD';
        const countryCode = locData.country_code || 'ZA';

        // 2. Get exchange rates (ZAR to target)
        const rateResponse = await fetch(CONFIG.apiRates);
        const rateData = await rateResponse.json();
        
        const result = {
            currency: targetCurrency,
            countryCode: countryCode,
            symbol: CONFIG.currencySymbols[targetCurrency] || targetCurrency + ' ',
            rate: rateData.rates[targetCurrency] || 1,
            timestamp: Date.now()
        };

        localStorage.setItem(CONFIG.cacheKey, JSON.stringify(result));
        return result;
    } catch (error) {
        console.error('Currency detection failed:', error);
        return {
            currency: 'ZAR',
            countryCode: 'ZA',
            symbol: 'R',
            rate: 1,
            timestamp: Date.now()
        };
    }
}

function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🇿🇦';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function formatPrice(amount, symbol, currency) {
    if (currency === 'ZAR') {
        return `R${amount.toLocaleString('en-ZA')}`;
    }
    
    // For other currencies, use a more standard format
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    } catch (e) {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
}

async function updatePrices() {
    const data = await getCurrencyData();
    if (!data || data.currency === 'ZAR') {
        // If it's ZAR, we don't need to do anything since the default is ZAR
        // But we might want to ensure the formatting is consistent
        // return; 
    }

    const { currency, symbol, rate, countryCode } = data;

    // Update flag
    const flagEl = document.querySelector('[data-flag]');
    if (flagEl) {
        flagEl.textContent = getFlagEmoji(countryCode);
    }

    // Update individual prices
    document.querySelectorAll('[data-price]').forEach(el => {
        const basePrice = parseFloat(el.getAttribute('data-price'));
        const converted = basePrice * rate;
        const format = el.getAttribute('data-format');
        const text = el.textContent;
        
        if (format === 'k') {
            if (converted >= 1000) {
                const kValue = converted / 1000;
                // If it's a whole number, don't show .0
                const displayValue = kValue % 1 === 0 ? kValue : kValue.toFixed(1);
                el.textContent = `${symbol}${displayValue}K`;
            } else {
                // For small numbers, just show the actual amount rounded
                el.textContent = `${symbol}${Math.round(converted)}`;
            }
        } else {
            const formatted = formatPrice(converted, symbol, currency);
            if (text.includes('Starting from')) {
                el.textContent = `Starting from ${formatted}`;
            } else {
                el.textContent = formatted;
            }
        }
    });

    // Update price ranges
    document.querySelectorAll('[data-price-min]').forEach(el => {
        const min = parseFloat(el.getAttribute('data-price-min'));
        const max = parseFloat(el.getAttribute('data-price-max'));
        const suffix = el.getAttribute('data-suffix') || '';
        
        const convMin = min * rate;
        const convMax = max * rate;
        
        const formattedMin = formatPrice(convMin, symbol, currency);
        const formattedMax = formatPrice(convMax, symbol, currency);
        
        el.textContent = `${formattedMin} – ${formattedMax}${suffix}`;
    });

    // Update select options
    document.querySelectorAll('select option[data-price-min]').forEach(opt => {
        const min = parseFloat(opt.getAttribute('data-price-min'));
        const max = parseFloat(opt.getAttribute('data-price-max'));
        const text = opt.textContent.split('(')[0].trim();
        
        const convMin = min * rate;
        const convMax = max * rate;
        
        const formattedMin = formatPrice(convMin, symbol, currency);
        const formattedMax = formatPrice(convMax, symbol, currency);
        
        opt.textContent = `${text} (${formattedMin} – ${formattedMax})`;
    });

    // Update budget options
    document.querySelectorAll('select option[data-budget-min]').forEach(opt => {
        const min = opt.getAttribute('data-budget-min');
        const max = opt.getAttribute('data-budget-max');
        
        if (min && max) {
            const convMin = parseFloat(min) * rate;
            const convMax = parseFloat(max) * rate;
            opt.textContent = `${formatPrice(convMin, symbol, currency)} – ${formatPrice(convMax, symbol, currency)}`;
        } else if (min) {
            const convMin = parseFloat(min) * rate;
            opt.textContent = `Under ${formatPrice(convMin, symbol, currency)}`;
        } else if (max) {
             const convMax = parseFloat(max) * rate;
             opt.textContent = `${formatPrice(convMax, symbol, currency)}+`;
        }
    });

    // Update location-specific text
    if (currency !== 'ZAR') {
        document.querySelectorAll('.sa-only-text').forEach(el => {
            el.textContent = el.textContent.replace(/South African/g, 'growing');
            el.textContent = el.textContent.replace(/South Africa/g, 'the world');
            el.textContent = el.textContent.replace(/Priced in rands/g, `Competitive pricing in ${currency}`);
            el.textContent = el.textContent.replace(/SA-market/g, 'Market-competitive');
            el.textContent = el.textContent.replace(/SA wide/g, 'Worldwide');
        });

        // Add a notice about ZAR payments
        const pricingSection = document.querySelector('.pricing-section');
        if (pricingSection && !document.querySelector('.currency-notice')) {
            const notice = document.createElement('div');
            notice.className = 'currency-notice';
            notice.style.cssText = 'text-align:center;padding:1rem;background:var(--bg2);color:var(--gold);font-size:0.85rem;border-radius:4px;margin-bottom:2rem;';
            notice.innerHTML = `⚠️ <strong>Note:</strong> All checkout payments are processed in <strong>South African Rand (ZAR)</strong>. Your bank will handle the conversion automatically.`;
            pricingSection.prepend(notice);
        }
    }
}

// Clear old cache that didn't have countryCode
if (!localStorage.getItem(CONFIG.cacheKey) || !JSON.parse(localStorage.getItem(CONFIG.cacheKey)).countryCode) {
    localStorage.removeItem(CONFIG.cacheKey);
}

// Run on load
window.addEventListener('DOMContentLoaded', updatePrices);
