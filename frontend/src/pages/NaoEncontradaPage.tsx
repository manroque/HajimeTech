import { Compass } from 'lucide-react';
import { BotaoLink, EstadoVazio } from '../components/ui';

export function NaoEncontradaPage() {
  return (
    <EstadoVazio
      icone={<Compass />}
      titulo="Página não encontrada"
      descricao="O endereço digitado não existe ou foi movido."
      acao={<BotaoLink para="/">Voltar ao início</BotaoLink>}
    />
  );
}
