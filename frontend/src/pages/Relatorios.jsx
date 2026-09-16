import React, { useEffect, useState } from 'react';

import { get } from '../services/api';

const DADOS_INICIAIS = {
  faixas: [],
  turmas: []
};

export default function Relatorios() {
  const [dados, setDados] = useState(
    DADOS_INICIAIS
  );

  useEffect(() => {
    get('/dashboard')
      .then(setDados)
      .catch(() => {});
  }, []);

  return (
    <div className="grid2">
      <section className="card">
        <span className="section-kicker">
          RELATÓRIO
        </span>

        <h3>
          Distribuição por faixa
        </h3>

        {dados.faixas.map((faixa) => (
          <div
            className="list-row"
            key={faixa.faixa}
          >
            <span>
              {faixa.faixa}
            </span>

            <b>
              {faixa.total} alunos
            </b>
          </div>
        ))}
      </section>

      <section className="card">
        <span className="section-kicker">
          RELATÓRIO
        </span>

        <h3>
          Distribuição por turma
        </h3>

        {dados.turmas.map((turma) => (
          <div
            className="list-row"
            key={turma.nome}
          >
            <span>
              {turma.nome}
            </span>

            <b>
              {turma.total} alunos
            </b>
          </div>
        ))}
      </section>

      <section className="card full-card">
        <span className="section-kicker">
          ANÁLISE
        </span>

        <h3>
          Próximos indicadores
        </h3>

        <p className="muted">
          O dashboard está preparado para evoluir
          com baixa frequência, evolução técnica e
          cruzamentos entre currículo e desempenho,
          conforme o roadmap do projeto.
        </p>
      </section>
    </div>
  );
}