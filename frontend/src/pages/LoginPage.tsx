/**
 * Login com e-mail e senha (POST /api/auth/login). Ver /backend/README.md.
 */
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Aviso, Botao, MensagemErro } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import type { Perfil } from '../types';
import { FAIXAS } from '../utils/formatacao';
import s from './LoginPage.module.css';

const SENHA_DEMO = 'hajime123';

const CONTAS_DEMO: { email: string; descricao: string }[] = [
  { email: 'admin@hajimetech.local', descricao: 'Administrador' },
  { email: 'ana@hajime.local', descricao: 'Professora' },
  { email: 'lucas@aluno.local', descricao: 'Aluno' },
];

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function destino(perfil: Perfil): string {
  return perfil === 'administrador' ? '/escolas' : perfil === 'aluno' ? '/minha-evolucao' : '/';
}

export function LoginPage() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<{ email?: string; senha?: string }>({});

  useEffect(() => {
    document.title = 'Entrar · HajimeTech';
  }, []);

  if (usuario && !entrando) return <Navigate to={usuario.perfil === 'aluno' ? '/minha-evolucao' : '/'} replace />;

  function validar(): boolean {
    const novos: typeof errosCampo = {};
    if (!email.trim()) novos.email = 'Informe seu e-mail.';
    else if (!EMAIL_VALIDO.test(email.trim())) novos.email = 'Digite um e-mail válido, como nome@exemplo.com.';
    if (!senha) novos.senha = 'Informe sua senha.';
    setErrosCampo(novos);
    return !novos.email && !novos.senha;
  }

  async function enviar() {
    setErro(null);
    if (!validar()) return;
    setEntrando(true);
    try {
      const u = await entrar(email.trim(), senha);
      navigate(destino(u.perfil), { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setSenha('');
      setEntrando(false);
    }
  }

  function usarConta(emailDemo: string) {
    setEmail(emailDemo);
    setSenha(SENHA_DEMO);
    setErrosCampo({});
    setErro(null);
  }

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
          <p className="texto-suave">Use o e-mail e a senha cadastrados pela sua academia.</p>

          <form
            className={s.form}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
          >
            <div className={s.campo}>
              <label htmlFor="email" className={s.rotulo}>E-mail</label>
              <input
                id="email"
                type="email"
                className="campo-input"
                autoComplete="username"
                inputMode="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errosCampo.email}
                aria-describedby={errosCampo.email ? 'email-erro' : undefined}
              />
              {errosCampo.email && <span id="email-erro" className={s.erroCampo}>{errosCampo.email}</span>}
            </div>

            <div className={s.campo}>
              <label htmlFor="senha" className={s.rotulo}>Senha</label>
              <div className={s.senha}>
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  className="campo-input"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  aria-invalid={!!errosCampo.senha}
                  aria-describedby={errosCampo.senha ? 'senha-erro' : undefined}
                />
                <button
                  type="button"
                  className={s.mostrarSenha}
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                >
                  {mostrarSenha ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
              </div>
              {errosCampo.senha && <span id="senha-erro" className={s.erroCampo}>{errosCampo.senha}</span>}
            </div>

            {erro && <MensagemErro mensagem={erro} />}

            <Botao type="submit" variante="destaque" carregando={entrando} className={s.entrar}>
              Entrar no HajimeTech
            </Botao>
          </form>

          <Aviso>
            <strong>Contas de demonstração</strong> (senha <code>{SENHA_DEMO}</code>):
            <ul className={s.contas}>
              {CONTAS_DEMO.map((c) => (
                <li key={c.email}>
                  <button type="button" className={s.conta} onClick={() => usarConta(c.email)}>
                    {c.descricao}: {c.email}
                  </button>
                </li>
              ))}
            </ul>
          </Aviso>
        </div>
      </main>
    </div>
  );
}
