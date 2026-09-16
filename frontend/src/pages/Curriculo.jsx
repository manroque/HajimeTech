import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '../services/api';
import Modal from '../components/Modal';

const FAIXAS = [
  'Azul',
  'Amarela',
  'Laranja',
  'Verde',
  'Roxa'
];

export default function Curriculo() {
  const [faixa, setFaixa] = useState('Azul');
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modal, setModal] = useState(null);

  const [nomeEdicao, setNomeEdicao] = useState('');
  const [descricaoEdicao, setDescricaoEdicao] = useState('');
  const [novaTecnica, setNovaTecnica] = useState('');

  async function carregar() {
    try {
      setLoading(true);
      setErro('');

      const data = await get(
        `/curriculo?faixa=${encodeURIComponent(faixa)}`
      );

      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível carregar o currículo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [faixa]);

  /* =========================
     EDITAR CATEGORIA
  ========================= */

  function abrirEditarCategoria(categoria) {
    setNomeEdicao(categoria.nome || '');
    setDescricaoEdicao(categoria.descricao || '');

    setModal({
      tipo: 'categoria',
      categoria
    });
  }

  async function salvarCategoria() {
    if (!nomeEdicao.trim()) {
      alert('Digite o nome da categoria.');
      return;
    }

    try {
      await put(
        `/curriculo/categorias/${modal.categoria.id}`,
        {
          nome: nomeEdicao.trim(),
          descricao: descricaoEdicao.trim() || null
        }
      );

      setModal(null);
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Não foi possível editar a categoria.');
    }
  }

  /* =========================
     EXCLUIR CATEGORIA
  ========================= */

  async function excluirCategoria(categoria) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a categoria "${categoria.nome}"?\n\nAs técnicas dessa categoria também serão removidas.`
    );

    if (!confirmar) {
      return;
    }

    try {
      await del(
        `/curriculo/categorias/${categoria.id}`
      );

      await carregar();
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir a categoria.');
    }
  }

  /* =========================
     EDITAR TÉCNICA
  ========================= */

  function abrirEditarTecnica(categoria, tecnica) {
    setNomeEdicao(tecnica.nome || '');

    setModal({
      tipo: 'tecnica',
      categoria,
      tecnica
    });
  }

  async function salvarTecnica() {
    if (!nomeEdicao.trim()) {
      alert('Digite o nome da técnica.');
      return;
    }

    try {
      await put(
        `/curriculo/itens/${modal.tecnica.id}`,
        {
          nome: nomeEdicao.trim()
        }
      );

      setModal(null);
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Não foi possível editar a técnica.');
    }
  }

  /* =========================
     EXCLUIR TÉCNICA
  ========================= */

  async function excluirTecnica(tecnica) {
    const confirmar = window.confirm(
      `Deseja realmente excluir "${tecnica.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await del(
        `/curriculo/itens/${tecnica.id}`
      );

      await carregar();
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir a técnica.');
    }
  }

  /* =========================
     ADICIONAR TÉCNICA
  ========================= */

  function abrirAdicionarTecnica(categoria) {
    setNovaTecnica('');

    setModal({
      tipo: 'nova-tecnica',
      categoria
    });
  }

  async function adicionarTecnica() {
    if (!novaTecnica.trim()) {
      alert('Digite o nome da técnica.');
      return;
    }

    try {
      await post('/curriculo/itens', {
        categoria_id: modal.categoria.id,
        nome: novaTecnica.trim()
      });

      setModal(null);
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Não foi possível adicionar a técnica.');
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div>
        <p>Carregando currículo...</p>
      </div>
    );
  }

  return (
    <div>

      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="toolbar">
        <div>
          <p className="eyebrow">
            CURRÍCULO TÉCNICO
          </p>

          <h2>
            Currículo por faixa
          </h2>

          <p className="muted">
            Consulte as técnicas exigidas para cada graduação.
          </p>
        </div>
      </div>

      {/* =========================
          ABAS DAS FAIXAS
      ========================= */}

      <div className="belt-tabs">
        {FAIXAS.map((item) => (
          <button
            key={item}
            type="button"
            className={
              faixa === item ? 'active' : ''
            }
            onClick={() => setFaixa(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* =========================
          ERRO
      ========================= */}

      {erro && (
        <div className="error-box">
          {erro}
        </div>
      )}

      {/* =========================
          LISTA DO CURRÍCULO
      ========================= */}

      <div className="curriculo-lista">

        {categorias.length === 0 ? (
          <div className="empty">
            Nenhuma categoria cadastrada para esta faixa.
          </div>
        ) : (
          categorias.map((categoria) => (

            <article
              className="curriculo-card"
              key={categoria.id}
            >

              {/* =========================
                  CABEÇALHO DA CATEGORIA
              ========================= */}

              <div className="curriculo-card-header">

                <div>
                  <h3>
                    {categoria.nome}
                  </h3>

                  {categoria.descricao && (
                    <p>
                      {categoria.descricao}
                    </p>
                  )}
                </div>

                {/* BOTÕES DA CATEGORIA */}

                <div className="actions">

                  <button
                    type="button"
                    className="edit-button"
                    title="Editar categoria"
                    aria-label={`Editar categoria ${categoria.nome}`}
                    onClick={() =>
                      abrirEditarCategoria(categoria)
                    }
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    title="Excluir categoria"
                    aria-label={`Excluir categoria ${categoria.nome}`}
                    onClick={() =>
                      excluirCategoria(categoria)
                    }
                  >
                    Excluir
                  </button>

                </div>

              </div>

              {/* =========================
                  TÉCNICAS
              ========================= */}

              <div className="tecnicas">

                {(categoria.itens || []).map(
                  (tecnica, indice) => (

                    <div
                      className="tecnica"
                      key={tecnica.id}
                    >

                      {/* NOME DA TÉCNICA */}

                      <div className="tecnica-nome">

                        <span className="numero">
                          {indice + 1}.
                        </span>

                        <span>
                          {tecnica.nome}
                        </span>

                      </div>

                      {/* BOTÕES DA TÉCNICA */}

                      <div className="tecnica-actions">

                        <button
                          type="button"
                          className="edit-button"
                          title="Editar técnica"
                          aria-label={`Editar técnica ${tecnica.nome}`}
                          onClick={() =>
                            abrirEditarTecnica(
                              categoria,
                              tecnica
                            )
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          title="Excluir técnica"
                          aria-label={`Excluir técnica ${tecnica.nome}`}
                          onClick={() =>
                            excluirTecnica(tecnica)
                          }
                        >
                          Excluir
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

              {/* =========================
                  ADICIONAR TÉCNICA
              ========================= */}

              <div className="categoria-footer">

                <button
                  type="button"
                  className="add-button"
                  onClick={() =>
                    abrirAdicionarTecnica(categoria)
                  }
                >
                  + Adicionar técnica
                </button>

              </div>

            </article>

          ))
        )}

      </div>

      {/* =========================
          MODAL - EDITAR CATEGORIA
      ========================= */}

      {modal?.tipo === 'categoria' && (
        <Modal
          title="Editar categoria"
          onClose={() => setModal(null)}
        >

          <div className="form">

            <label>
              Nome da categoria

              <input
                value={nomeEdicao}
                onChange={(e) =>
                  setNomeEdicao(e.target.value)
                }
                autoFocus
              />
            </label>

            <label>
              Descrição

              <textarea
                value={descricaoEdicao}
                onChange={(e) =>
                  setDescricaoEdicao(e.target.value)
                }
                rows={3}
              />
            </label>

            <div className="modal-actions">

              <button
                type="button"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary"
                onClick={salvarCategoria}
              >
                Salvar alteração
              </button>

            </div>

          </div>

        </Modal>
      )}

      {/* =========================
          MODAL - EDITAR TÉCNICA
      ========================= */}

      {modal?.tipo === 'tecnica' && (
        <Modal
          title="Editar técnica"
          onClose={() => setModal(null)}
        >

          <div className="form">

            <label>
              Nome da técnica

              <input
                value={nomeEdicao}
                onChange={(e) =>
                  setNomeEdicao(e.target.value)
                }
                autoFocus
              />
            </label>

            <div className="modal-actions">

              <button
                type="button"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary"
                onClick={salvarTecnica}
              >
                Salvar alteração
              </button>

            </div>

          </div>

        </Modal>
      )}

      {/* =========================
          MODAL - ADICIONAR TÉCNICA
      ========================= */}

      {modal?.tipo === 'nova-tecnica' && (
        <Modal
          title="Adicionar técnica"
          onClose={() => setModal(null)}
        >

          <div className="form">

            <label>
              Nome da técnica

              <input
                value={novaTecnica}
                onChange={(e) =>
                  setNovaTecnica(e.target.value)
                }
                placeholder="Ex.: O-soto-gari"
                autoFocus
              />
            </label>

            <div className="modal-actions">

              <button
                type="button"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary"
                onClick={adicionarTecnica}
              >
                Adicionar
              </button>

            </div>

          </div>

        </Modal>
      )}

    </div>
  );
}