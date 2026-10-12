# API (kila kitu kiko kwenye server/routes.js)

Auth: `POST /api/login {pin}` -> `{token,user}`; tuma `Authorization: Bearer <token>` (saa 24).

| Njia | Nani | Maelezo |
|---|---|---|
| GET /api/setup, POST /api/setup | umma (mara moja) | tengeneza Admin wa kwanza (PIN tarakimu 6–8) |
| POST /api/login | umma | PIN -> token (rate-limit 8/dak 10/IP) |
| GET /api/me, POST /api/me/pin | wote | wasifu, badilisha PIN yangu |
| GET /api/state?eid= | wote | matukio niliyopangiwa + wageni/scans za tukio; admin: users, orders, settings |
| POST/PUT/DELETE /api/events[/:id] | admin | matukio |
| POST /api/events/:id/guests, /import | admin | ongeza wageni / orodha |
| DELETE /api/guests/:id, POST /api/guests/:id/sent | admin | |
| POST /api/scan, /api/scan/batch | admin, staff | `{eid, code|gid, at?}` -> `{res: ok/dup/invalid/other, guest, stats}` |
| POST /api/events/:id/walkin | admin, staff | mgeni wa ziada + ingia |
| POST /api/users, /:id/reset-pin; PUT/DELETE /api/users/:id | admin pekee | PIN inatolewa na mfumo mara moja |
| POST /api/orders | umma (10/saa/IP) | agizo -> `{ref}` |
| GET /api/orders/:ref/status | umma | hali + maelekezo ya malipo (yakitumwa) |
| PATCH /api/orders/:id, POST /api/orders/:id/create-event | admin | kiasi, hali, tengeneza tukio + PIN ya mteja |
| PUT /api/settings, GET /api/backup | admin | maelekezo ya malipo, backup JSON |
| GET /api/invite/:code | umma | data ya mwaliko (bila namba ya simu) |
