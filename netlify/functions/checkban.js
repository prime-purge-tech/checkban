// Netlify Function — Proxy Baron API
// La clé ne quitte JAMAIS ce fichier. Le frontend ne voit que cette fonction.
const BARON_API_URL = 'https://baron0.com/api/check'; // ← ajuste si l'endpoint Baron exact diffère
const BARON_API_KEY = 'bk_v1_kZdauan0zFfExwvwX_tGmIKtYYtv3SuJIf9fAUuHqi8iFifkWVxnPL_lHsfEmU2z1v6FGjTwbWtlBpKN6ZYo2uAIlwkVtPClFwGOEADyHD_lZIJFFxeAmjSJCK0NUkcHmq1KdLNYtt66LvGyo43O48GJ5rQyUzhnOB1tBMTy-62fmpEU_mG83aAyE4R01L_rE8663XeMqME0BpmlAXwDtMnT22BygEnaCQH_1DjXi8cAUYW5zPehkxZ5ByoPZ1Rh_bNRmV0kqQ1ujqq7DxOR3o0yUBH59k1j_yYsYK7MtvFbNT9Bl0jluRXZQH125C8YVav5IXXdjflqBreVQA0B3_Mx0QQEd-XnzAIzzl3ucv6Lc-XidtmUUPwnb2CbPade3_F-YVeKAKNQWz7AQmpR-39EW18UTUM7yb08ncDKAaMJYEouyGYDvMkrBecRIXrlaIemyzNEAo_mDc7X76woWM89DnN4vNSwHxxQHV2G2c0EM0g8BXRcadv80aX39nB1_e5FhUTmSAU_9yWhI1Gxmace3qTVzhrotufpOmIEitp8WOr2C0YXe7gB';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (code, obj) => ({ statusCode: code, headers: CORS, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { status: 'ERROR', message: 'Method not allowed' });

  let phone = '';
  try { phone = (JSON.parse(event.body).phone || '').replace(/[^0-9]/g, ''); } catch (e) {}
  if (!phone) return json(400, { status: 'ERROR', message: 'Numéro manquant' });

  try {
    const r = await fetch(BARON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + BARON_API_KEY   // ← si Baron attend un autre header, ajuste ici
      },
      body: JSON.stringify({ key: BARON_API_KEY, number: phone, phone: '+' + phone })
    });
    const raw = await r.text();
    let d = {};
    try { d = JSON.parse(raw); } catch (e) {}

    // Normalisation → format consommé par Prime Purge
    const st = String(d.status || d.result || d.state || '').toUpperCase();
    if (st.includes('BAN') && !st.includes('UN')) return json(200, { status: 'BANNED' });
    if (st.includes('ACTIVE') || st.includes('UNBANNED') || st.includes('REGISTERED')) return json(200, { status: 'ACTIVE' });
    if (st.includes('NOT') || st.includes('UNKNOWN') || st.includes('UNREGISTERED')) return json(200, { status: 'NOT_REGISTERED' });

    // Clés épuisées ?
    if (d.error && /key|credit|quota|exhaust/i.test(JSON.stringify(d)))
      return json(200, { status: 'ERROR', message: 'Toutes les clés sont épuisées', all_keys_exhausted: true });

    return json(200, { status: 'ERROR', message: 'Réponse non reconnue', all_keys_exhausted: true });
  } catch (e) {
    return json(200, { status: 'ERROR', message: 'Impossible de contacter le service de vérification' });
  }
};