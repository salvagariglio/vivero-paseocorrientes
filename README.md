# Vivero — catálogo multitenant con QR y etiquetas

Catálogo de plantas para viveros. Cada vivero (tenant) tiene su propio subdominio o
dominio propio, su marca, su catálogo y su panel. Nada está hardcodeado: nombre,
logo, colores, moneda, datos de contacto y hasta las medidas de las etiquetas
viven en la base de datos.

- **Next.js 15** (App Router, JSX) + **React 19**
- **Supabase** (Postgres + Auth + Storage), aislamiento por RLS
- **Tailwind v4**
- Deploy en **Vercel**

## Cómo funciona el multitenant

1. El request llega con un `Host`.
2. `src/lib/tenant.js` lo busca en `tenant_domains` (RPC `resolve_tenant`).
3. Si no está, prueba con el subdominio contra `tenants.slug`.
4. El `tenant.id` filtra todas las consultas, y **RLS lo vuelve a validar en Postgres**:
   aunque una consulta llegue sin filtro, la fila de otro vivero no sale.

Las escrituras del panel usan la sesión del usuario, y las policies exigen
membresía en ese tenant (`memberships`), con roles `owner` / `admin` / `editor`.

```
vivero-luz.midominio.com   ->  tenant_domains.host  ->  tenant A
viveroluz.com.ar           ->  tenant_domains.host  ->  tenant A  (dominio propio)
otro-vivero.midominio.com  ->  tenants.slug         ->  tenant B
```

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # completar con los datos del proyecto
npm run dev
```

### 1. Base de datos

Pegá `supabase/migrations/0001_init.sql` en el SQL Editor de Supabase y ejecutalo.
Crea tablas, funciones, policies de RLS y el bucket público `media`.

### 2. Variables de entorno

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `NEXT_PUBLIC_ROOT_DOMAIN` | dominio raíz, ej. `midominio.com` |
| `NEXT_PUBLIC_PLATFORM_HOSTS` | hosts que no son de un vivero (separados por coma) |
| `NEXT_PUBLIC_DEV_TENANT_SLUG` | solo dev: vivero por defecto en `localhost` |

### 3. Auth

En Supabase → Authentication → URL Configuration, agregá tu dominio y el
wildcard de subdominios a *Redirect URLs*.

### 4. Primer vivero

1. Entrá a `/admin/login` y creá tu cuenta.
2. Como el host todavía no resuelve a ningún vivero, vas a `/admin/sin-vivero`.
3. Creá el vivero: la función `create_tenant` te deja como `owner`, crea los
   settings, el subdominio y una plantilla de etiqueta.
4. Entrá por `<slug>.<ROOT_DOMAIN>/admin`.

En desarrollo local podés usar `vivero-luz.localhost:3000` (Chrome y Firefox lo
resuelven solos) o setear `NEXT_PUBLIC_DEV_TENANT_SLUG`.

### 5. Vercel

- Agregá el **wildcard domain** `*.midominio.com` al proyecto.
- Para cada dominio propio de un cliente: agregalo en Vercel **y** en el panel
  (Marca y datos → Direcciones web).

## QR y etiquetas

- `/api/qr?slug=monstera` devuelve el PNG del QR. Solo codifica rutas del propio
  vivero; acepta `format=svg`, `size`, `dark`, `light`.
- El QR apunta a `https://<dominio principal del vivero>/planta/<slug>`, así que
  la etiqueta impresa sigue válida aunque después cambies precio o descripción.
- `/admin/etiquetas` arma la hoja para imprimir. Las medidas salen de
  `label_templates` (ancho, alto, QR, separación, margen, A4/Carta y qué campos
  mostrar), o sea que cada vivero imprime en el papel que usa.

## Lista de precios

El vivero actualiza sus precios sin nosotros: entra a `/admin/precios`, sube
la misma planilla que ya usa y **antes de tocar nada** ve cuantos precios
suben, cuantos bajan, cuantos quedan igual, cuales no traen precio y cuales
no estan en el catalogo. Recien despues confirma.

- **Engancha por `products.sku`** (la columna Codigo) y, si la fila no trae
  codigo, por el slug que sale del nombre + envase. Los slugs existentes no
  se regeneran nunca.
- **Toca una sola columna: `price`.** Fotos, promociones, `allow_discount`,
  atributos y descripciones son trabajo del vivero y no se pisan.
- Se aplica con **un solo `apply_price_import`**, en una transaccion, con la
  sesion de la persona: RLS vuelve a exigir membresia del tenant.
- Que columna es cual **es dato, no constante**: se detecta por el encabezado
  (asi el orden no importa) y lo que el vivero corrige queda en
  `tenant_settings.price_import` para la proxima. Mismo criterio que `theme`.
- Cada importacion queda registrada fila por fila. Leido al reves, eso ya es
  el historial de precios.

El lector de `.xlsx` es propio (`src/lib/xlsx.js`, unos 180 renglones sobre
`node:zlib`): el repo es publico y no queriamos heredar los advisories de las
librerias de planillas para leer seis columnas.

## Modelo de datos

| Tabla | Para qué |
|---|---|
| `tenants` | el vivero |
| `tenant_domains` | hosts que resuelven a ese vivero |
| `tenant_settings` | marca, moneda, contacto — reemplaza toda constante |
| `memberships` | usuario + vivero + rol |
| `tenant_invites` | invitaciones por email, se canjean al entrar |
| `categories` | árbol (`parent_id`), profundidad libre |
| `products` | plantas, con promo por ventana de fechas y `attributes` jsonb |
| `product_images` | galería |
| `label_templates` | medidas y contenido de las etiquetas |
| `price_imports` | cada actualizacion de la lista: cuando, quien, cuanto cambio |
| `price_import_items` | fila por fila, que precio habia y cual quedo |

`products.attributes` es jsonb libre: cada vivero define sus datos de cuidado
(luz, riego, maceta, dificultad…) sin migrar nada. La ficha los renderiza sola.

## Estructura

```
src/
  app/
    (site)/            catálogo público
    admin/(panel)/     panel, requiere membresía
    admin/login        alta y acceso
    api/qr             generador de QR
  components/site/     topbar, drawer, cards, galería
  components/admin/    formularios, uploader, estudio de etiquetas
  lib/
    tenant.js          host -> tenant
    auth.js            sesión, rol, guardas
    queries.js         lecturas públicas cacheadas por tenant
    admin-queries.js   lecturas del panel
    xlsx.js            lector de .xlsx, sin dependencias
    price-import.js    mapeo de columnas y diff de la lista de precios
supabase/migrations/   schema + RLS
```

## Escalar a más viveros

No hay código por cliente. Un vivero nuevo es una fila en `tenants` (vía
`create_tenant`) más su dominio. El cache de lecturas públicas está segmentado
por tenant (`revalidateTag('tenant:<id>')`), así que un vivero no invalida el de
otro.

## Estado actual

- **Proyecto Supabase**: `Viveros` (`yblkzoutcoimwwwfhzle`, us-east-2). Migraciones
  0001–0004 aplicadas: tablas, RLS, funciones, bucket `media` y el vivero
  Paseo Corrientes con su paleta y sus referencias.
- **Deploy**: https://vivero-paseocorrientes.vercel.app (Vercel, deploy
  automatico en cada push a `main`).
- **Catalogo cargado**: 448 productos importados del listado de precios, en
  6 familias y 22 subcategorias. La planilla trae centavos de una formula de
  markup; el vivero elige donde cortarlos y hoy estan al peso.
- **Pendiente de aplicar**: `0013_lista_de_precios.sql`. Sin esa migracion,
  `/admin/precios` no funciona.
- **Vercel Authentication esta activa**: el sitio solo lo ve quien tenga
  acceso al equipo de Vercel. Al conectar el dominio propio queda publico;
  hasta entonces los QR no le sirven a un cliente en el local.

### Carga inicial del catalogo

```bash
node scripts/import-listado.mjs "Listado precios Publico.xlsx" import.sql
```

Genera el SQL (categorias + referencia de envase + productos, todo
idempotente por `slug`) para pegar en el SQL Editor. Es de una sola vez:
arma el arbol de categorias. Los precios despues se actualizan solos.
