-- =====================================================================
-- La tipografia del manual es Fraunces 72pt (display) + Acumin (sans).
-- Fraunces esta en Google Fonts; Acumin es de Adobe, asi que la sans
-- libre mas cercana es Archivo.
--
-- Los ids del registro pasan a nombrar las familias en vez de un humor
-- ("bosque"), que no le decia nada a nadie.
-- =====================================================================

alter table public.tenant_settings
  alter column typeset set default 'fraunces-archivo';

update public.tenant_settings
   set typeset = case typeset
     when 'bosque'   then 'fraunces-archivo'
     when 'herbario' then 'petrona-archivo'
     when 'mercado'  then 'baskerville-karla'
     else 'fraunces-archivo'
   end
 where typeset in ('bosque', 'herbario', 'mercado')
    or typeset not in ('fraunces-archivo', 'petrona-archivo', 'baskerville-karla');
