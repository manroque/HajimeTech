/** Mensagens rápidas de confirmação/erro ("Aluno salvo com sucesso"). */
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import styles from './Toast.module.css';

type TipoToast = 'sucesso' | 'erro';
interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

const ToastContext = createContext<((mensagem: string, tipo?: TipoToast) => void) | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fechar = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const mostrar = useCallback(
    (mensagem: string, tipo: TipoToast = 'sucesso') => {
      const id = ++seq;
      setToasts((t) => [...t, { id, tipo, mensagem }]);
      setTimeout(() => fechar(id), 4000);
    },
    [fechar],
  );

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className={styles.area} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tipo]}`}>
            {t.tipo === 'sucesso' ? <CheckCircle2 size={20} aria-hidden /> : <AlertCircle size={20} aria-hidden />}
            <span>{t.mensagem}</span>
            <button className={styles.fechar} onClick={() => fechar(t.id)} aria-label="Fechar mensagem">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  return ctx;
}
