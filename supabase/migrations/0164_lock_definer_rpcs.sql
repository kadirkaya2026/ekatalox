-- Güvenlik (8 Eki 2026 taraması): SECURITY DEFINER fonksiyonlar anon/authenticated
-- rollerine açıktı. Eski migration'lar yalnız `revoke ... from public` yapıyordu;
-- Supabase'de anon/authenticated EXECUTE yetkisini PUBLIC'ten değil default
-- privileges'tan alır, bu yüzden tarayıcıdaki anon anahtarla
-- /rest/v1/rpc/transition_order_status, update_order_items, get_sales_* vb.
-- doğrudan çağrılabiliyordu (fonksiyonlar p_tenant_id'ye güveniyor).
--
-- Uygulama bu fonksiyonları yalnız sunucuda service_role (admin client) ile
-- çağırır; tetikleyici fonksiyonları çalışırken EXECUTE yetkisi istemez.
-- İstisna: is_super_admin / is_tenant_member RLS politikalarında kullanılır,
-- oturum açmış kullanıcının sorgusu sırasında çalışır → dokunulmaz.
--
-- Döngü public şemadaki TÜM definer fonksiyonları (aşırı yüklemeler dahil)
-- kapsar; tekrar çalıştırmak güvenlidir.
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname not in ('is_super_admin', 'is_tenant_member')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end
$$;
