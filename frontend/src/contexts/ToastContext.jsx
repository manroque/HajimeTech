/** Mensagens rápidas de confirmação/erro ("Aluno salvo com sucesso"). */
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const fechar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const mostrar = useCallback(
    (mensagem, tipo = 'sucesso') => {
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
