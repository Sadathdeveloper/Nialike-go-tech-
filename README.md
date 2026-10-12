# Nialike Go Tech – Frontend + Backend

Frontend yako ipo kama ilivyo (root), na **backend halisi** imeongezwa kwenye folda `backend/`. Hakuna dependencies za kusakinisha – inahitaji **Node.js 22.13+** (`node -v`).

```
index.html portal.html invite.html check.html   kurasa
css/  js/  assets/                              muundo, logic, kadi 7, icons
js/store.js                                     mteja wa API (zamani localStorage, sasa seva)
manifest.webmanifest  sw.js  .htaccess          PWA / HTTPS
docs/API.md                                     orodha ya endpoints
backend/
  index.js      server (API + inatoa kurasa za root; folda za siri zimezuiwa)
  db.js         SQLite: users, events, guests, scans, orders, settings, audit
  auth.js       PIN (HMAC), token, rate-limit
  routes.js     API zote + ruhusa kwa role
  test/         vipimo 31 (npm test)
  data/         database (ngt.db, .secret) – BACKUP folda hii
package.json  .env.example
```

## Kuanza
```bash
npm start            # http://localhost:3000   (portal: /portal.html)
npm test             # (hiari) vipimo 49
```
1. Fungua `/portal.html` → tengeneza **Admin** (jina + PIN tarakimu 6–8). Hakuna demo/PIN za mfano.
2. **Admin pekee** anatengeneza PIN za Msimamizi wa Mlango na Mteja (Watumiaji). PIN inaonekana mara moja; "PIN mpya" inapatikana kila wakati.

## Mtiririko
1. Mteja anajaza fomu → anapata **namba ya agizo NGT-XXXXXX** (nakili/shiriki WhatsApp). Anaweza kuifuatilia kwenye "Fuatilia Agizo".
2. Admin (Maagizo): anaweka kiasi → "Tuma maelekezo ya malipo" (WhatsApp). Namba ya malipo unaiweka **Mipangilio → Maelekezo ya malipo** (au kwa kila agizo).
3. Malipo yakifika: "Imelipwa" → "Tengeneza tukio + PIN" (wageni wa fomu wanaingizwa, mteja anapewa PIN).
4. Admin anabofya **🚀 Tuma kwa wote** – mfumo unatuma mialiko wenyewe (WhatsApp, na SMS ikishindwa), unajaribu tena ukikosea, na unaonyesha hali (imetumwa / imefika / imesomwa / imeshindwa). Pia kadi ya PNG yenye QR, links CSV, na njia ya mkono (foleni ya WhatsApp) kama mbadala.
5. Siku ya sherehe: msimamizi anaingia kwa PIN → kamera inawaka → kijani/nyekundu + sauti; au code fupi / jina / mgeni mpya. Offline: scans zinahifadhiwa na kutumwa mtandao ukirudi. Mteja anaona dashboard live.

## Mabadiliko kutoka toleo la demo
- localStorage imeondolewa kwenye data; kila kitu kiko kwenye database ya seva. Kifaa kinahifadhi token tu (na foleni ya scans za offline).
- **Sync/Pack/"Futa data yote"** hazihitajiki tena (seva ndiyo chanzo cha ukweli, simu zote zinaona data ileile). Zimebadilishwa na **Backup** (Mipangilio) na "Futa tukio".
- PIN sasa tarakimu 6–8 na zinatolewa na mfumo (admin pekee).
- Mpya: Mipangilio (maelekezo ya malipo, badilisha PIN, backup), hali za agizo, kuzima/kuwezesha mtumiaji, kupanga matukio ya mtumiaji, kuhariri/kufuta tukio.

## Kutuma mialiko automatic (kuweka mara moja)
Mfumo unatumia **WhatsApp Business Cloud API (Meta)**; mgeni anapokea ujumbe wenye link ya mwaliko (kadi + QR + code). Kwa wasio na WhatsApp au ikishindwa, **SMS (Beem Africa)** inatumika kama mbadala.
1. **Meta**: developers.facebook.com → tengeneza App (Business) → ongeza bidhaa **WhatsApp** → ongeza namba yako ya biashara. Chukua **Phone Number ID** (`WA_PHONE_ID`) na **token ya kudumu** ya System User (`WA_TOKEN`).
2. **Template** (WhatsApp Manager → Message templates): jina `mwaliko`, category *Utility*, lugha *Swahili (sw)*, mwili wenye vigezo 5 kwa mpangilio huu:
   `Habari {{1}}, umealikwa kwenye {{2}} tarehe {{3}}, mahali: {{4}}. Fungua mwaliko wako wenye QR ya kuingia hapa: {{5}}`
   ({{1}} jina la mgeni, {{2}} tukio, {{3}} tarehe na saa, {{4}} mahali, {{5}} link). Subiri iidhinishwe (dakika hadi saa 24). Ujumbe wa kwanza kwa mgeni **lazima** utumie template iliyoidhinishwa.
3. **.env**: jaza `PUBLIC_URL` (https ya tovuti yako), `WA_TOKEN`, `WA_PHONE_ID`, `WA_TEMPLATE=mwaliko`, `WA_LANG=sw`. Anzisha upya seva. Portal → Mipangilio itaonyesha "imewekwa ✓".
4. **Webhook (hali ya delivered/read)**: Meta → WhatsApp → Configuration → Callback URL `https://domain-yako/api/webhooks/whatsapp`, Verify token = `WA_VERIFY_TOKEN` (chagua mwenyewe), subscribe field `messages`; weka `WA_APP_SECRET` (App Secret) ili saini ikaguliwe.
5. **SMS (hiari)**: jaza `BEEM_API_KEY`, `BEEM_SECRET`, `SMS_SENDER` (sender ID iliyosajiliwa).
6. Portal → tukio → **🚀 Tuma kwa wote**. Gharama za ujumbe zinalipwa kwa Meta/Beem kulingana na bei zao.
*Imejaribiwa dhidi ya seva bandia za WhatsApp/SMS (muundo wa ombi, retry, fallback, webhook). Jaribu kwanza kwa wageni 2–3 wa kweli kabla ya tukio kubwa; Meta/Beem wanaweza kubadilisha masharti yao.*

## Kuweka mtandaoni
- **VPS**: Node 22+, `npm i -g pm2`, `pm2 start "npm start" --name ngt`, Nginx/Caddy yenye **HTTPS**, `.env` → `TRUST_PROXY=1`.
- **cPanel**: "Setup Node.js App" (Node 22+), application root = folda hii, startup file = `backend/index.js`.
- Tovuti ikiwa kwenye hosting nyingine (static) na API kwenye domain tofauti: `js/config.js` → `API:'https://api.domain.tz'` na `.env` → `CORS_ORIGIN=https://domain-ya-tovuti`.
- HTTPS ni lazima (kamera, PWA, usalama). **Backup** `backend/data/` mara kwa mara; usipoteze `.secret`.
- Baada ya kubadilisha faili za frontend, ongeza namba ya `ngt-v6` ndani ya `sw.js`.

## Mapungufu
Kamera ya QR: Chrome/Edge ya Android (iPhone: code fupi/jina). Kutuma automatic kunahitaji akaunti ya WhatsApp Business API (na template iliyoidhinishwa) – bila hiyo kuna njia ya mkono. Malipo yanathibitishwa na admin kwa mkono. Kuingia ni kwa PIN pekee.
