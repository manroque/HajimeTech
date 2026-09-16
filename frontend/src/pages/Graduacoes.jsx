import React, { useEffect, useState } from 'react';

import { get, post } from '../services/api';

import Modal from '../components/Modal';

const FAIXAS = [
  'Azul',
  'Amarela',
  'Laranja',
  'Verde',
  'Roxa',
  'Marrom',
  'Preta'
];

const FORMULARIO_INICIAL = {
  aluno_id: '',
  nova_faixa: 'Azul',
  data_graduacao: new Date()
    .toISOString()
    .slice(0, 10),
  observacoes: ''
};

export default function Graduacoes() {
  const [alunos, setAlunos] = useState([]);
  const [historico, setHistorico] = useState([]);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [formulario, setFormulario] = useState(
    FORMULARIO_INICIAL
  );

  function carregarDados() {
    get('/alunos').then(setAlunos);

    get('/graduacoes')
      .then(setHistorico)
      .catch(() => {});
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function salvarGraduacao(event) {
    event.preventDefault();

    const alunoSelecionado = alunos.find(
      (aluno) =>
        aluno.id === formulario.aluno_id
    );

    await post('/graduacoes', {
      ...formulario,
      faixa_anterior:
        alunoSelecionado?.faixa_atual
    });

    setModalAberto(false);
    setFormulario(FORMULARIO_INICIAL);

    carregarDados();
  }

  function atualizarCampo(campo, valor) {
    setFormulario({
      ...formulario,
      [campo]: valor
    });
  }

  return (
    <div>
      <div className="toolbar">
        <p className="muted">
          A graduação é uma decisão da Sensei.
          O sistema apenas registra e organiza
          o histórico.
        </p>

        <button
          type="button"
          className="primary"
          onClick={() => setModalAberto(true)}
        >
          + Registrar graduação
        </button>
      </div>

      <section className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Faixa anterior</th>
              <th>Nova faixa</th>
              <th>Data</th>
              <th>Observação</th>
            </tr>
          </thead>

          <tbody>
            {historico.map((graduacao) => (
              <tr key={graduacao.id}>
                <td>
                  <strong>
                    {graduacao.aluno_nome}
                  </strong>
                </td>

                <td>
                  {graduacao.faixa_anterior || '—'}
                </td>

                <td>
                  <span className="belt">
                    {graduacao.nova_faixa}
                  </span>
                </td>

                <td>
                  {new Date(
                    graduacao.data_graduacao
                  ).toLocaleDateString('pt-BR')}
                </td>

                <td>
                  {graduacao.observacoes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!historico.length && (
          <div className="empty">
            Nenhuma graduação registrada ainda.
          </div>
        )}
      </section>

      {modalAberto && (
        <Modal
          title="Registrar graduação"
          onClose={() =>
            setModalAberto(false)
          }
        >
          <form
            className="form"
            onSubmit={salvarGraduacao}
          >
            <label>
              Aluno

              <select
                required
                value={formulario.aluno_id}
                onChange={(event) =>
                  atualizarCampo(
                    'aluno_id',
                    event.target.value
                  )
                }
              >
                <option value="">
                  Selecione
                </option>

                {alunos.map((aluno) => (
                  <option
                    value={aluno.id}
                    key={aluno.id}
                  >
                    {aluno.nome} —{' '}
                    {aluno.faixa_atual}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Nova faixa

              <select
                value={formulario.nova_faixa}
                onChange={(event) =>
                  atualizarCampo(
                    'nova_faixa',
                    event.target.value
                  )
                }
              >
                {FAIXAS.map((faixa) => (
                  <option
                    key={faixa}
                    value={faixa}
                  >
                    {faixa}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Data

              <input
                type="date"
                required
                value={
                  formulario.data_graduacao
                }
                onChange={(event) =>
                  atualizarCampo(
                    'data_graduacao',
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Observações

              <textarea
                value={
                  formulario.observacoes
                }
                onChange={(event) =>
                  atualizarCampo(
                    'observacoes',
                    event.target.value
                  )
                }
              />
            </label>

            <button
              type="submit"
              className="primary full"
            >
              Registrar
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}