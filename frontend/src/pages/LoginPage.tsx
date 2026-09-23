/**
 * Login SIMULADO: escolhe-se um perfil e um usuário de demonstração.
 * INTEGRAÇÃO BACKEND: substituir por formulário de e-mail e senha
 * (POST /api/auth/login). Ver /backend/README.md.
 */
import { GraduationCap, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Aviso, Botao, MensagemErro } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useCarregar } from '../hooks/useCarregar';
import { authService, escolasService } from '../services';
import type { Perfil } from '../types';
import { FAIXAS } from '../utils/formatacao';
import s from './LoginPage.module.css';

const OPCOES: { perfil: Perfil; titulo: string; descricao: string; icone: ReactNode }[] = [
  { perfil: 'administrador', titulo: 'Administrador', descricao: 'Acesso total, incluindo escolas e currículo.', icone: <ShieldCheck size={26} /> },
  { perfil: 'professor', titulo: 'Professor', descricao: 'Gerencia alunos, turmas e o currículo da sua escola.', icone: <GraduationCap size={26} /> },
  { perfil: 'aluno', titulo: 'Aluno', descricao: 'Acompanha a própria evolução (somente leitura).', icone: <UserRound size={26} /> },
];

export function LoginPage() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil>('professor');
  const [usuarioId, setUsuarioId] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { dados } = useCarregar(async () => {
    const [usuarios, escolas] = await Promise.all([authService.listarUsuariosDemo(), escolasService.listar()]);
    return { usuarios, escolas };
  }, []);

  const usuariosDoPerfil = useMemo(() => dados?.usuarios.filter((u) => u.perfil === perfil) ?? [], [dados, perfil]);

  useEffect(() => {
    setUsuarioId(usuariosDoPerfil[0]?.id ?? '');
  }, [usuariosDoPerfil]);

  useEffect(() => {
    document.title = 'Entrar · HajimeTech';
  }, []);

  if (usuario) return <Navigate to={usuario.perfil === 'aluno' ? '/minha-evolucao' : '/'} replace />;

  async function enviar() {
    if (!usuarioId) return;
    setEntrando(true);
    setErro(null);
    try {
      const u = await entrar(usuarioId);
      navigate(u.perfil === 'administrador' ? '/escolas' : u.perfil === 'aluno' ? '/minha-evolucao' : '/', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setEntrando(false);
    }
  }

  const nomeEscola = (id: string | null) => dados?.escolas.find((e) => e.id === id)?.nome ?? 'Todas as escolas';

  return (
    <div className={s.pagina}>
      <section className={s.marca} aria-hidden>
        <Logo variante="claro" tamanho="lg" />
        <p className={s.slogan}>Acompanhe cada passo da evolução no tatame.</p>
        <div className={s.faixas}>
          {FAIXAS.map((f, i) => (
            <span key={f.id} className={s.faixa} style={{ background: f.cor, width: `${30 + i * 9}%` }} />
          ))}
        </div>
        <p className={s.rodapeMarca}>Branca → Azul → Amarela → Laranja → Verde → Roxa → Marrom → Preta</p>
      </section>

      <main className={s.formulario}>
        <div className={s.caixa}>
          <div className={s.logoCelular}>
            <Logo tamanho="md" />
          </div>
          <h1>Entrar</h1>
          <p className="texto-suave">Escolha como deseja acessar o sistema.</p>

          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
          >
            <fieldset className={s.perfis}>
              <legend className="visualmente-oculto">Perfil de acesso</legend>
              {OPCOES.map((o) => (
                <label key={o.perfil} className={`${s.perfil} ${perfil === o.perfil ? s.perfilAtivo : ''}`}>
                  <input
                    type="radio"
                    name="perfil"
                    value={o.perfil}
                    checked={perfil === o.perfil}
                    onChange={() => setPerfil(o.perfil)}
                    className="visualmente-oculto"
                  />
                  <span className={s.perfilIcone}>{o.icone}</span>
                  <span>
                    <strong>{o.titulo}</strong>
                    <small>{o.descricao}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className={s.campo}>
              <label htmlFor="usuario" className={s.rotulo}>Usuário de demonstração</label>
              <select id="usuario" className="campo-input" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
                {usuariosDoPerfil.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} - {nomeEscola(u.escolaId)}
                  </option>
                ))}
              </select>
            </div>

            {erro && <MensagemErro mensagem={erro} />}

            <Botao type="submit" variante="destaque" carregando={entrando} disabled={!usuarioId} className={s.entrar}>
              Entrar no HajimeTech
            </Botao>
          </form>

          <Aviso>
            Este é um <strong>login simulado</strong> para apresentação. Na versão com backend, o acesso será feito com
            e-mail e senha.
          </Aviso>
        </div>
      </main>
    </div>
  );
}
