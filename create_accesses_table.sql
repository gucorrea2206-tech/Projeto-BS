-- Execute este código no SQL Editor do Supabase para criar a tabela de acessos

CREATE TABLE IF NOT EXISTS public.accesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  link text NOT NULL,
  email text NOT NULL,
  encrypted_password text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.accesses ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer usuário autenticado leia os acessos
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.accesses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir que qualquer usuário autenticado insira acessos
CREATE POLICY "Permitir inserção para usuários autenticados" ON public.accesses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir que apenas administradores deletem acessos
-- Nota: Esta política assume que você tem uma forma de verificar quem é admin.
-- Como a verificação de admin é feita no frontend no seu app, podemos permitir
-- que o frontend controle a deleção, ou podemos criar uma função mais restrita.
-- Para simplificar e manter a compatibilidade com o frontend atual:
CREATE POLICY "Permitir deleção para usuários autenticados" ON public.accesses
  FOR DELETE USING (auth.role() = 'authenticated');
