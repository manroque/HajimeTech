import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PerfilAluno } from '../components/PerfilAluno';

/** Perfil do aluno visto por administradores e professores. */
export function AlunoPerfilPage() {
  const { alunoId = '' } = useParams();
  useEffect(() => {
    document.title = 'Perfil do aluno · HajimeTech';
  }, []);
  return (
    <>
      <Link to="/alunos" className="linha" style={{ marginBottom: 16, fontWeight: 600, textDecoration: 'none' }}>
        <ArrowLeft size={18} aria-hidden /> Voltar para alunos
      </Link>
      <PerfilAluno alunoId={alunoId} />
    </>
  );
}
