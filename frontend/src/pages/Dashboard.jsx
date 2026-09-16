import React, { useEffect, useState } from 'react';

import { get } from '../services/api';

const DADOS_INICIAIS = {
  total_alunos: 0,
  presencas_30_dias: 0,
  faixas: [],
  turmas: []
};

export default function Dashboard() {
  const [dados, setDados] = useState(
    DADOS_INICIAIS
  );

  useEffect(() => {
    get('/dashboard')
      .then(setDados)
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="hero">
        <div>
          <span className="pill">
            VISÃO GERAL
          </span>

          <h2>
            Olá, Sensei Ana 👋
          </h2>

          <p>
            Acompanhe os alunos, a frequência e a
            evolução da academia em um só lugar.
          </p>
        </div>

        <div className="hero-mark">
          道
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Alunos ativos</span>

          <b>
            {dados.total_alunos}
          </b>

          <small>
            cadastros ativos
          </small>
        </div>

        <div className="stat">
          <span>Presenças</span>

          <b>
            {dados.presencas_30_dias}
          </b>

          <small>
            últimos 30 dias
          </small>
        </div>

        <div className="stat">
          <span>Faixas</span>

          <b>
            {dados.faixas.length}
          </b>

          <small>
            faixas com alunos
          </small>
        </div>

        <div className="stat">
          <span>Turmas</span>

          <b>
            {dados.turmas.length}
          </b>

          <small>
            horários cadastrados
          </small>
        </div>
      </div>

      <div className="grid2">
        <section className="card">
          <div className="card-title">
            <div>
              <span className="section-kicker">
                DISTRIBUIÇÃO
              </span>

              <h3>
                Alunos por faixa
              </h3>
            </div>
          </div>

          {dados.faixas.length ? (
            dados.faixas.map((faixa) => (
              <div
                className="bar-row"
                key={faixa.faixa}
              >
                <span>
                  {faixa.faixa}
                </span>

                <div>
                  <i
                    style={{
                      width: `${Math.max(
                        8,
                        (faixa.total /
                          dados.total_alunos) *
                          100
                      )}%`
                    }}
                  />
                </div>

                <b>
                  {faixa.total}
                </b>
              </div>
            ))
          ) : (
            <Empty
              text={
                'Cadastre alunos para visualizar os indicadores.'
              }
            />
          )}
        </section>

        <section className="card">
          <span className="section-kicker">
            ORGANIZAÇÃO
          </span>

          <h3>
            Alunos por turma
          </h3>

          {dados.turmas.length ? (
            dados.turmas.map((turma) => (
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
            ))
          ) : (
            <Empty
              text={
                'Cadastre turmas para visualizar os indicadores.'
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}