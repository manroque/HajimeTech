import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Executa uma função assíncrona (normalmente um service) e controla
 * carregamento, erro e recarga. Ignora respostas de chamadas antigas.
 */
export function useCarregar<T>(funcao: () => Promise<T>, dependencias: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const chamada = useRef(0);

  const executar = useCallback(funcao, dependencias);

  const recarregar = useCallback(async () => {
    const id = ++chamada.current;
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await executar();
      if (id === chamada.current) setDados(resultado);
    } catch (e) {
      if (id === chamada.current) setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      if (id === chamada.current) setCarregando(false);
    }
  }, [executar]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { dados, carregando, erro, recarregar, setDados };
}
