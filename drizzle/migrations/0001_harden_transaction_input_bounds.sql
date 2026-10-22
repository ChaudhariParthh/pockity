ALTER TABLE public.transactions ADD CONSTRAINT transactions_description_nonblank CHECK (length(btrim(description)) > 0) NOT VALID;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_category_bounds CHECK (length(btrim(category)) BETWEEN 1 AND 100) NOT VALID;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_finite_date CHECK (isfinite(date)) NOT VALID;
REVOKE ALL ON public.transactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;