import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Carregando } from './components/ui';
import { useAuth } from './contexts/AuthContext';
import { useEscola } from './contexts/EscolaContext';
import { AcompanhamentoPage } from './pages/AcompanhamentoPage';
import { AlunoPerfilPage } from './pages/AlunoPerfilPage';
import { AlunosPage } from './pages/AlunosPage';
import { AvaliacoesPage } from './pages/AvaliacoesPage';
import { CurriculoPage } from './pages/CurriculoPage';
import { DashboardPage } from './pages/DashboardPage';
import { EscolasPage } from './pages/EscolasPage';
import { FrequenciaPage } from './pages/FrequenciaPage';
import { GraduacoesPage } from './pages/GraduacoesPage';
import { LoginPage } from './pages/LoginPage';
import { MinhaEvolucaoPage } from './pages/MinhaEvolucaoPage';
import { NaoEncontradaPage } from './pages/NaoEncontradaPage';
import { PremiacoesPage } from './pages/PremiacoesPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { TurmasPage } from './pages/TurmasPage';
import type { Perfil } from './types';

/** Exige login. */
function ComLogin({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  return usuario ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Exige uma escola selecionada (administradores escolhem em /escolas). */
function ComEscola({ children }: { children: ReactNode }) {
  const { escola, carregando } = useEscola();
  if (carregando && !escola) return <Carregando />;
  return escola ? <>{children}</> : <Navigate to="/escolas" replace />;
}

/** Restringe a rota a alguns perfis; os demais vão para a página inicial do seu perfil. */
function ApenasPerfis({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!perfis.includes(usuario.perfil)) return <Navigate to={usuario.perfil === 'aluno' ? '/minha-evolucao' : '/'} replace />;
  return <>{children}</>;
}

const GESTAO: Perfil[] = ['administrador', 'professor'];

export function AppRoutes() {
  const gestao = (pagina: ReactNode) => (
    <ApenasPerfis perfis={GESTAO}>
      <ComEscola>{pagina}</ComEscola>
    </ApenasPerfis>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ComLogin>
            <AppLayout />
          </ComLogin>
        }
      >
        <Route index element={gestao(<DashboardPage />)} />
        <Route path="escolas" element={<ApenasPerfis perfis={['administrador']}><EscolasPage /></ApenasPerfis>} />
        <Route path="alunos" element={gestao(<AlunosPage />)} />
        <Route path="alunos/:alunoId" element={gestao(<AlunoPerfilPage />)} />
        <Route path="turmas" element={gestao(<TurmasPage />)} />
        <Route path="frequencia" element={gestao(<FrequenciaPage />)} />
        <Route path="graduacoes" element={gestao(<GraduacoesPage />)} />
        <Route path="acompanhamento" element={gestao(<AcompanhamentoPage />)} />
        <Route path="avaliacoes" element={gestao(<AvaliacoesPage />)} />
        <Route path="premiacoes" element={gestao(<PremiacoesPage />)} />
        <Route path="relatorios" element={gestao(<RelatoriosPage />)} />
        <Route path="curriculo" element={<ComEscola><CurriculoPage /></ComEscola>} />
        <Route path="minha-evolucao" element={<ApenasPerfis perfis={['aluno']}><ComEscola><MinhaEvolucaoPage /></ComEscola></ApenasPerfis>} />
        <Route path="*" element={<NaoEncontradaPage />} />
      </Route>
    </Routes>
  );
}
