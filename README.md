# 🌴 App del viaje familiar — Puerto Plata 2027

PWA en Next.js 15 (JavaScript) + Supabase. Sin cuentas: se entra con un código familiar y cada uno elige quién es.

## Secciones

| Ruta | Qué hace |
|---|---|
| `/` | Cuenta regresiva → "Día X de N" durante el viaje → link al recuerdo al volver. Progreso de tu checklist y próximo en la agenda |
| `/info` | Vuelos, hotel, contactos, documentos (con núcleo familiar opcional) |
| `/checklist` | Lista por persona, con lista base según adulto / niño / bebé, y progreso de toda la familia |
| `/familia` | Alta de los 14, núcleos, emoji y asignación de habitaciones |
| `/excursiones` | Propuestas + "Me anoto", fecha y si es familiar o solo adultos (ya trae 4 de Puerto Plata) |
| `/fotos` | Álbum compartido por día, likes, filtro por persona, **cola offline** (si no hay wifi se suben después) |
| `/agenda` | Agenda por día del viaje (reservas, shows, punto de encuentro) |
| `/ninera` | Turnos: quiénes salen / quiénes cuidan, "me ofrezco a cuidar", resumen por adulto |
| `/gastos` | Gastos extra divididos, multi-moneda, y quién le transfiere a quién para quedar a mano |
| `/bingo` | Cartón 5×5 por persona (los chicos juegan desde el celu de los papás) y tabla |
| `/premios` | Votación secreta + revelar resultados la última noche |
| `/recuerdo` | Mensaje de cada uno para la homenajeada, top fotos por día, premios, **modo presentación** y **imprimir/PDF** |

## Puesta en marcha

1. **Supabase**: creá un proyecto → SQL Editor → pegá `supabase/schema.sql` → Run.
   Crea las tablas en el schema `viaje`, las políticas, el "en vivo" (Realtime), el bucket `viaje-fotos` y 4 excursiones de ejemplo.
   Después: Project Settings → Data API → Exposed schemas → agregá `viaje`.
   Si ya lo habías corrido antes, pegá solo `supabase/realtime.sql` para activar el en vivo.
2. **Variables**: `cp .env.example .env.local` y completá URL, anon key, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` y `FAMILY_CODE`.
   Después corré `supabase/seguridad.sql` en el SQL Editor (cierra el acceso con la anon key).
3. **Config del viaje**: editá `lib/config.js` → fechas reales, hora del vuelo, nombre del hotel, a quién va dedicado el recuerdo, checklist, bingo y premios.
4. `npm install && npm run dev` → http://localhost:3000
5. Cargá a la familia en `/familia`.
6. **Deploy**: Vercel → cargá las 5 variables de entorno → apuntá un subdominio desde Cloudflare (ej. `viaje.sebadev.com.ar`).
7. Pasá por WhatsApp el link + el código. En el celu: "Agregar a pantalla de inicio" y queda como app.

## Notas

- **Fotos**: se comprimen en el celu a 2400 px (JPEG) antes de subir, que alcanza para imprimir. Los videos van tal cual, con un límite de 50 MB por archivo (límite del plan gratis de Supabase). El plan gratis da 1 GB de storage. Para 14 personas, una semana y videos, probablemente te convenga el Pro o subir los videos a otro lado.
- **Offline**: el service worker cachea la app, los datos que ya se cargaron y las fotos vistas. Las subidas pendientes quedan en IndexedDB y se reintentan al volver la señal, al abrir la app y cada 30 s mientras el álbum esté abierto.
- **HEIC** (iPhone): Safari normalmente lo convierte a JPEG al elegir la foto. Si algún navegador no lo puede decodificar, se sube el original.
- El service worker solo se registra en producción (`npm run build && npm start` para probarlo en local).

## Seguridad

Tres capas:

1. **Código familiar**: el middleware no deja ver la app ni usar `/api/*` sin la cookie. La pantalla `/entrar` está fuera del grupo `(app)`, así que no descarga el cliente ni la clave de Supabase.
2. **Token temporal**: la anon key sola no puede leer ni escribir nada. `/api/token` (solo con la cookie) firma un JWT de 12 h con rol `authenticated` y el claim `app = 'viaje'`. Las políticas RLS exigen ese claim, así que tampoco entran usuarios de otras apps del mismo proyecto de Supabase.
3. **Fotos**: desde el celular se puede subir (solo imágenes/videos, máx. 50 MB) pero no pisar ni borrar. Borrar pasa por `/api/fotos/[id]` con la `service_role` key, de a una foto.

Variables solo de servidor (cargalas también en Vercel): `SUPABASE_JWT_SECRET` (Project Settings → JWT Keys → Legacy JWT secret) y `SUPABASE_SERVICE_ROLE_KEY`.

Límites conocidos: dentro de la familia todos pueden ver todo (incluidos los votos de premios por API; el secreto lo cuida la interfaz). El bucket sigue siendo público para ver: quien tenga la URL exacta de una foto la ve, pero las rutas llevan un id aleatorio.

## Ideas para seguir

- Notificaciones push ("¡En 30 min salimos a Cayo Arena!").
- Exportar el álbum completo en un .zip.
- Mapa del resort con los puntos de encuentro.
