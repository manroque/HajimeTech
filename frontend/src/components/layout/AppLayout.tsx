import {
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  School,
  Target,
  TrendingUp,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEscola } from '../../contexts/EscolaContext';
import { restaurarDadosExemplo } from '../../services';
import type { Perfil } from '../../types';
import { PERFIS } from '../../utils/formatacao';
import { Logo } from '../Logo';
import { Botao } from '../ui';
import s from './AppLayout.module.css';

interface ItemMenu {
  para: string;
  rotulo: string;
  icone: ReactNode;
  perfis: Perfil[];
}

const GESTAO: Perfil[] = ['administrador', 'professor'];

const GRUPOS: { titulo: string; itens: ItemMenu[] }[] = [
  {
    titulo: 'Visão geral',
    itens: [
      { para: '/', rotulo: 'Painel', icone: <LayoutDashboard size={20} />, perfis: GESTAO },
      { para: '/minha-evolucao', rotulo: 'Minha evolução', icone: <TrendingUp size={20} />, perfis: ['aluno'] },
      { para: '/relatorios', rotulo: 'Relatórios', icone: <FileText size={20} />, perfis: GESTAO },
    ],
  },
  {
    titulo: 'Dia a dia',
    itens: [
      { para: '/alunos', rotulo: 'Alunos', icone: <Users size={20} />, perfis: GESTAO },
      { para: '/turmas', rotulo: 'Turmas', icone: <UsersRound size={20} />, perfis: GESTAO },
      { para: '/frequencia', rotulo: 'Frequência', icone: <CalendarCheck size={20} />, perfis: GESTAO },
    ],
  },
  {
    titulo: 'Evolução',
    itens: [
      { para: '/graduacoes', rotulo: 'Graduações', icone: <GraduationCap size={20} />, perfis: GESTAO },
      { para: '/acompanhamento', rotulo: 'Acompanhamento técnico', icone: <Target size={20} />, perfis: GESTAO },
      { para: '/avaliacoes', rotulo: 'Avaliações', icone: <ClipboardList size={20} />, perfis: GESTAO },
      { para: '/premiacoes', rotulo: 'Premiações', icone: <Award size={20} />, perfis: GESTAO },
    ],
  },
  {
    titulo: 'Academia',
    itens: [
      { para: '/curriculo', rotulo: 'Currículo', icone: <BookOpen size={20} />, perfis: ['administrador', 'professor', 'aluno'] },
      { para: '/escolas', rotulo: 'Escolas', icone: <School size={20} />, perfis: ['administrador'] },
    ],
  },
];

export function AppLayout() {
  const { usuario, sair } = useAuth();
  const { escola } = useEscola();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu do celular ao trocar de página.
  useEffect(() => setMenuAberto(false), [location.pathname]);

  if (!usuario) return null;

  function restaurar() {
    if (window.confirm('Descartar todas as alterações feitas nesta sessão e voltar aos dados de exemplo?')) {
      restaurarDadosExemplo();
      window.location.reload();
    }
  }

  return (
    <div className={s.app}>
      <a href="#conteudo" className={s.pular}>Pular para o conteúdo</a>

      <aside className={`${s.menu} ${menuAberto ? s.menuAberto : ''} nao-imprimir`} aria-label="Menu principal">
        <div className={s.menuTopo}>
          <Logo variante="claro" tamanho="sm" />
          <button className={s.fecharMenu} onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
            <X size={22} />
          </button>
        </div>

        <nav className={s.nav}>
          {GRUPOS.map((grupo) => {
            const itens = grupo.itens.filter((i) => i.perfis.includes(usuario.perfil));
            if (!itens.length) return null;
            return (
              <div key={grupo.titulo} className={s.grupo}>
                <span className={s.grupoTitulo}>{grupo.titulo}</span>
                {itens.map((item) => (
                  <NavLink
                    key={item.para}
                    to={item.para}
                    end={item.para === '/'}
                    className={({ isActive }) => `${s.link} ${isActive ? s.linkAtivo : ''}`}
                  >
                    {item.icone}
                    {item.rotulo}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className={s.menuRodape}>
          <BarChart3 size={16} aria-hidden />
          <span>Dados de demonstração</span>
          <button onClick={restaurar} className={s.restaurar} title="Restaurar dados de exemplo">
            <RotateCcw size={14} /> Restaurar
          </button>
        </div>
      </aside>
      {menuAberto && <div className={s.sombra} onClick={() => setMenuAberto(false)} aria-hidden />}

      <div className={s.principal}>
        <header className={`${s.topo} nao-imprimir`}>
          <button className={s.abrirMenu} onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
            <Menu size={24} />
          </button>

          <div className={s.escola}>
            <span className={s.escolaRotulo}>Escola</span>
            <strong>{escola?.nome ?? 'Nenhuma escola selecionada'}</strong>
          </div>
          {usuario.perfil === 'administrador' && (
            <Botao variante="secundario" tamanho="sm" icone={<School size={16} />} onClick={() => navigate('/escolas')}>
              Trocar escola
            </Botao>
          )}

          <div className={s.usuario}>
            <div className={s.avatar} aria-hidden>{usuario.nome.replace(/^(Sensei|Prof\.)\s+/, '').charAt(0)}</div>
            <div className={s.usuarioTexto}>
              <strong>{usuario.nome}</strong>
              <span>{PERFIS[usuario.perfil]}</span>
            </div>
            <Botao
              variante="fantasma"
              somenteIcone
              icone={<LogOut size={20} />}
              aria-label="Sair"
              title="Sair"
              onClick={() => {
                sair();
                navigate('/login');
              }}
            />
          </div>
        </header>

        <main id="conteudo" className={s.conteudo} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
