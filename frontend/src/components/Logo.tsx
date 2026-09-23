import styles from './Logo.module.css';

interface LogoProps {
  /** `claro` para fundos escuros (menu lateral), `escuro` para fundos claros. */
  variante?: 'claro' | 'escuro';
  tamanho?: 'sm' | 'md' | 'lg';
  /** Esconde o texto e mostra só o símbolo. */
  somenteSimbolo?: boolean;
}

/**
 * Logomarca HajimeTech.
 * O símbolo é uma faixa de judô em movimento ascendente, que passa por
 * degraus (as graduações) até o círculo vermelho, que é a meta. Representa o
 * acompanhamento e a evolução do aluno.
 */
export function Logo({ variante = 'escuro', tamanho = 'md', somenteSimbolo = false }: LogoProps) {
  return (
    <span className={`${styles.logo} ${styles[variante]} ${styles[tamanho]}`}>
      <svg className={styles.simbolo} viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill="#13306E" />
        {/* degraus de progressão */}
        <rect x="8" y="33" width="6" height="7" rx="1.5" fill="#3B6CF6" opacity="0.55" />
        <rect x="16" y="28" width="6" height="12" rx="1.5" fill="#3B6CF6" opacity="0.75" />
        <rect x="24" y="23" width="6" height="17" rx="1.5" fill="#3B6CF6" />
        {/* faixa em movimento */}
        <path d="M6 30 C16 29 24 22 31 13" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M29 17 l-5 9 M31 15 l2 10" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        {/* meta */}
        <circle cx="37" cy="11" r="5" fill="#C8102E" />
      </svg>
      {!somenteSimbolo && (
        <span className={styles.texto}>
          Hajime<span className={styles.tech}>Tech</span>
        </span>
      )}
    </span>
  );
}
