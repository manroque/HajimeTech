import React, { useEffect, useState } from 'react';

import { get, post, put, del } from '../services/api';

import Modal from '../components/Modal';

const FORMULARIO_VAZIO = {
  nome: '',
  data_nascimento: '',
  faixa_atual: 'Branca',
  telefone: '',
  observacoes: '',
  turma_id: ''
};

const FAIXAS = [
  'Branca',
  'Azul',
  'Amarela',
  'Laranja',
  'Verde',
  'Roxa',
  'Marrom',
  'Preta'
];

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState(null);

  const [formulario, setFormulario] = useState(
    FORMULARIO_VAZIO
  );

  const [busca, setBusca] = useState('');

  function carregarAlunos() {
    get('/alunos').then(setAlunos);
  }

  useEffect(() => {
    carregarAlunos();

    get('/turmas')
      .then(setTurmas)
      .catch(() => {});
  }, []);

  async function salvarAluno(event) {
    event.preventDefault();

    if (alunoEditando) {
      await put(
        `/alunos/${alunoEditando.id}`,
        formulario
      );
    } else {
      await post('/alunos', formulario);
    }

    setModalAberto(false);
    setAlunoEditando(null);
    setFormulario(FORMULARIO_VAZIO);

    carregarAlunos();
  }

  function abrirNovoAluno() {
    setAlunoEditando(null);
    setFormulario(FORMULARIO_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(aluno) {
    setAlunoEditando(aluno);

    setFormulario({
      nome: aluno.nome,
      data_nascimento:
        aluno.data_nascimento?.slice(0, 10) || '',
      faixa_atual: aluno.faixa_atual,
      telefone: aluno.telefone || '',
      observacoes: aluno.observacoes || '',
      turma_id: aluno.turma_id || ''
    });

    setModalAberto(true);
  }

  async function excluirAluno(aluno) {
    if (!confirm('Desativar este aluno?')) {
      return;
    }

    await del(`/alunos/${aluno.id}`);

    carregarAlunos();
  }

  function atualizarCampo(campo, valor) {
    setFormulario({
      ...formulario,
      [campo]: valor
    });
  }

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  return (
    <div>
      <div className="toolbar">
        <div className="search">
          <span>⌕</span>

          <input
            aria-label="Buscar aluno"
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
          />
        </div>

        <button
          type="button"
          className="primary"
          onClick={abrirNovoAluno}
        >
          + Novo aluno
        </button>
      </div>

      <section className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Faixa</th>
              <th>Turma</th>
              <th>Contato</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {alunosFiltrados.map((aluno) => (
              <tr key={aluno.id}>
                <td>
                  <strong>
                    {aluno.nome}
                  </strong>
                </td>

                <td>
                  <span className="belt">
                    {aluno.faixa_atual}
                  </span>
                </td>

                <td>
                  {aluno.turma_nome || '—'}
                </td>

                <td>
                  {aluno.telefone || '—'}
                </td>

                <td>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() =>
                      abrirEdicao(aluno)
                    }
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="link-btn danger"
                    onClick={() =>
                      excluirAluno(aluno)
                    }
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!alunosFiltrados.length && (
          <div className="empty">
            Nenhum aluno encontrado.
          </div>
        )}
      </section>

      {modalAberto && (
        <Modal
          title={
            alunoEditando
              ? 'Editar aluno'
              : 'Novo aluno'
          }
          onClose={() => setModalAberto(false)}
        >
          <form
            className="form"
            onSubmit={salvarAluno}
          >
            <label>
              Nome

              <input
                required
                value={formulario.nome}
                onChange={(event) =>
                  atualizarCampo(
                    'nome',
                    event.target.value
                  )
                }
              />
            </label>

            <div className="form-grid">
              <label>
                Data de nascimento

                <input
                  type="date"
                  value={
                    formulario.data_nascimento
                  }
                  onChange={(event) =>
                    atualizarCampo(
                      'data_nascimento',
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Faixa

                <select
                  value={formulario.faixa_atual}
                  onChange={(event) =>
                    atualizarCampo(
                      'faixa_atual',
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
            </div>

            <label>
              Turma

              <select
                value={formulario.turma_id}
                onChange={(event) =>
                  atualizarCampo(
                    'turma_id',
                    event.target.value
                  )
                }
              >
                <option value="">
                  Sem turma
                </option>

                {turmas.map((turma) => (
                  <option
                    value={turma.id}
                    key={turma.id}
                  >
                    {turma.nome} — {turma.horario}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Telefone

              <input
                value={formulario.telefone}
                onChange={(event) =>
                  atualizarCampo(
                    'telefone',
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Observações

              <textarea
                value={formulario.observacoes}
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
              Salvar aluno
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}