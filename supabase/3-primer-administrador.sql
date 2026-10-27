-- Da de alta al PRIMER administrador (tú). Los siguientes se agregan desde el dashboard.
-- Cambia el correo entre comillas por el tuyo y presiona Run.

insert into public.administradores (correo, agregado_por)
values (lower('tu-correo@ejemplo.com'), 'configuración inicial')
on conflict (correo) do nothing;
