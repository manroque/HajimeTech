import React, { useEffect, useState } from 'react';

import { get, post } from '../services/api';

export default function Frequencia() {
  const [alunos, setAlunos] = useState([]);
  const [presencas, setPresencas] = useState({});

  const [data, setData] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    get('/alunos')
      .then(setAlunos);

    get(`/frequencias?data=${data}`)
      .then((resultado) => {
        setPresencas(
          Object.fromEntries(
            resultado.map((item) => [
              item.aluno_id,
              item.presente
            ])
          )
        );
      })
      .catch(() => {});
  }, [data]);

  async function alternarPresenca(aluno) {
    const novaPresenca = !presencas[aluno.id];

    setPresencas({
      ...presencas,
      [aluno.id]: novaPresenca
    });

    await post('/frequencias', {
      aluno_id: aluno.id,
      turma_id: aluno.turma_id,
      data,
      presente: novaPresenca
    });
  }

  const totalPresentes = Object.values(
    presencas
  ).filter(Boolean).length;

  return (
    <div>
      <div className="toolbar">
        <div>
          <label
            className="mini-label"
            htmlFor="date"
          >
            Data
          </label>

          <input
            id="date"
            type="date"
            value={data}
            onChange={(event) =>
              setData(event.target.value)
            }
          />
        </div>

        <span className="summary">
          {totalPresentes} presentes
        </span>
      </div>

      <section className="card attendance">
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Turma</th>
              <th>Presença</th>
            </tr>
          </thead>

          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>
                  <strong>
                    {aluno.nome}
                  </strong>
                </td>

                <td>
                  {aluno.turma_nome || '—'}
                </td>

                <td>
                  <button
                    type="button"
                    className={
                      'attendance-btn ' +
                      (presencas[aluno.id]
                        ? 'present'
                        : 'absent')
                    }
                    onClick={() =>
                      alternarPresenca(aluno)
                    }
                    aria-pressed={
                      !!presencas[aluno.id]
                    }
                  >
                    {presencas[aluno.id]
                      ? '✓ Presente'
                      : '○ Ausente'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}