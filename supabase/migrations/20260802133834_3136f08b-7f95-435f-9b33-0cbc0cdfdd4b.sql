CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'tenant_admin'
      AND tenant_id = _tenant_id
  );
$$;

REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid) TO service_role;