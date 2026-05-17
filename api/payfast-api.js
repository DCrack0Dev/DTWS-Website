const crypto = require('crypto');
const axios = require('axios');

/**
 * PayFast API Proxy for Vercel
 * Handles Payouts and Refunds server-side to protect the Passphrase.
 */
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, amount, bank_details, payment_id } = req.body;
    const merchant_id = process.env.PAYFAST_MERCHANT_ID || '33697847';
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    if (!passphrase) {
        return res.status(500).json({ error: 'PayFast Passphrase not configured in environment variables.' });
    }

    try {
        let endpoint = '';
        let payload = {};

        if (action === 'payout') {
            // PayFast Ad-hoc Payout API
            endpoint = `https://api.payfast.co.za/payouts/adhoc`;
            payload = {
                merchant_id,
                amount: Math.round(amount * 100), // amount in cents
                account_holder: bank_details.account_holder,
                account_number: bank_details.account_number,
                bank_name: bank_details.bank_name,
                bank_code: bank_details.bank_code,
                account_type: bank_details.account_type || '1', // 1 for Current/Cheque
                reference: `DTWS-WITHDRAW-${Date.now()}`
            };
        } else if (action === 'refund') {
            // PayFast Refund API
            endpoint = `https://api.payfast.co.za/refunds/adhoc`;
            payload = {
                merchant_id,
                payment_id, // The PayFast payment_id from the original deposit
                amount: Math.round(amount * 100),
                reason: 'Wallet Withdrawal Request'
            };
        } else {
            return res.status(400).json({ error: 'Invalid action.' });
        }

        // Generate Signature
        const timestamp = new Date().toISOString();
        const signatureData = {
            ...payload,
            version: 'v1',
            timestamp
        };

        // Sort keys and build string
        const sortedKeys = Object.keys(signatureData).sort();
        let pfParamString = '';
        sortedKeys.forEach(key => {
            pfParamString += `${key}=${encodeURIComponent(signatureData[key]).replace(/%20/g, '+')}&`;
        });
        pfParamString += `passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;

        const signature = crypto.createHash('md5').update(pfParamString).digest('hex');

        // Call PayFast API
        const response = await axios.post(endpoint, signatureData, {
            headers: {
                'merchant-id': merchant_id,
                'version': 'v1',
                'timestamp': timestamp,
                'signature': signature
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('PayFast API Error:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            error: 'PayFast API call failed',
            details: error.response ? error.response.data : error.message
        });
    }
};
