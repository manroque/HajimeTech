import { useEffect } from 'react';
import { PerfilAluno } from '../components/PerfilAluno';
import { Aviso } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

/** Visão somente leitura do próprio aluno. */
export function MinhaEvolucaoPage() {
  const { usuario } = useAuth();
  useEffect(() => {
    document.title = 'Minha evolução · HajimeTech';
  }, []);
  if (!usuario?.alunoId) return <Aviso>Seu usuário não está vinculado a um cadastro de aluno.</Aviso>;
  return (
    <div className="pilha">
      <Aviso>Olá! Aqui você acompanha sua evolução no judô. Somente professores podem alterar estas informações.</Aviso>
      <PerfilAluno alunoId={usuario.alunoId} somenteLeitura />
    </div>
  );
}
