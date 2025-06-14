import { useEffect, useState } from "react";
import styles from "./styles/createBoardModal.module.css";
import { getBoardTemplates } from "../../../../api/boardService";

const CreateBoardModal = ({ onClose, onCreate, loading }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      const templates = await getBoardTemplates();
      setTemplates(templates);
      setSelectedId(templates[0]?.id || "");
      setIsLoadingTemplates(false);
    };
    fetchTemplates();
  }, []);

  const handleTypeChange = (e) => {
    setSelectedId(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ id: selectedId });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Novo Quadro</h2>
        {isLoadingTemplates ? (
          <p>Carregando modelos...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Quadro*</label>
              <select
                className={styles.input}
                value={selectedId}
                onChange={handleTypeChange}
                required
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.createButton} disabled={loading}>
                {loading ? "Salvando..." : "Criar Quadro"}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateBoardModal;
