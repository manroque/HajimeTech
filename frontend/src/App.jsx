import React, { useState } from 'react';

import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Alunos from './pages/Alunos';
import Frequencia from './pages/Frequencia';
import Graduacoes from './pages/Graduacoes';
import Curriculo from './pages/Curriculo';
import Relatorios from './pages/Relatorios';

export default function App() {
  const [pagina, setPagina] = useState('dashboard');

  const paginas = {
    dashboard: Dashboard,
    alunos: Alunos,
    frequencia: Frequencia,
    graduacoes: Graduacoes,
    curriculo: Curriculo,
    relatorios: Relatorios
  };

  const PaginaAtual = paginas[pagina] || Dashboard;

  return (
    <Layout page={pagina} setPage={setPagina}>
      <PaginaAtual />
    </Layout>
  );
}