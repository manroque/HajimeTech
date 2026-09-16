import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  BookOpen,
  BarChart3
} from 'lucide-react';

const itensMenu = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['alunos', 'Alunos', Users],
  ['frequencia', 'Frequência', CalendarCheck],
  ['graduacoes', 'Graduações', GraduationCap],
  ['curriculo', 'Currículo', BookOpen],
  ['relatorios', 'Relatórios', BarChart3]
];

export default function Layout({
  page,
  setPage,
  children
}) {
  const tituloPagina =
    itensMenu.find((item) => item[0] === page)?.[1] ||
    'Dashboard';

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <span>H</span>

          <div>
            <strong>HajimeTech</strong>
            <small>Gestão de Judô</small>
          </div>
        </div>

        <nav aria-label="Navegação principal">
          {itensMenu.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={page === id ? 'active' : ''}
              onClick={() => setPage(id)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="side-note">
          <b>Academia Hajime</b>
          <span>Sensei Ana • Administradora</span>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <p className="eyebrow">
              PAINEL DE GESTÃO
            </p>

            <h1>
              {tituloPagina}
            </h1>
          </div>

          <div
            className="avatar"
            aria-label="Usuário Sensei Ana"
          >
            SA
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}