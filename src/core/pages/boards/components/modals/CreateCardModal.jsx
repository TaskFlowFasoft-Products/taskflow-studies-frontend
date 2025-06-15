import { useState, useEffect, useRef } from "react";
import styles from "./styles/createCardModal.module.css";
import { FaEdit, FaRegCalendarAlt } from "react-icons/fa";

const CreateCardModal = ({
    onClose,
    onCreate,
    onDelete,
    card = null,
    isEditing = false,
    loading = false,
    isDeleting = false,
    isInFinalColumn = false,
}) => {
    const [title, setTitle] = useState(card?.title || "");
    const [dueDate, setDueDate] = useState(card?.dueDate || "");
    const [description, setDescription] = useState(card?.description || "");
    const [titleError, setTitleError] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [savedImage, setSavedImage] = useState(card?.completion_image_base64 || null);
    const modalRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target === modalRef.current) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    },);

    useEffect(() => {
        setSavedImage(card?.completion_image_base64 || null);
        setImageFile(null); // Limpa o arquivo ao abrir novo card
    }, [card]);

    const validateTitle = (value) => {
        if (!value || value.trim() === '') {
            setTitleError("O título é obrigatório");
            return false;
        }
        setTitleError("");
        return true;
    };

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateTitle(title)) return;

        let completion_image_base64 = undefined;
        if (isInFinalColumn && imageFile) {
            completion_image_base64 = await getBase64(imageFile);
        }

        const cardData = {
            id: card?.id || undefined,
            title: title.trim(),
            dueDate,
            description: description.trim(),
            completion_image_base64,
        };

        onCreate(cardData);
    };

    const handleDelete = () => {
        if (onDelete && card) {
            onDelete(card);
        }
    };

    return (
        <div className={styles.modalOverlay} ref={modalRef}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>
                    {isEditing ? "Editar Cartão" : "Novo Cartão"} <FaEdit />
                </h2>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>Título*</label>
                    <input
                        type="text"
                        className={`${styles.input} ${titleError ? styles.inputError : ''}`}
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (e.target.value.trim()) setTitleError("");
                        }}
                        onBlur={(e) => validateTitle(e.target.value)}
                        placeholder="Nome do Cartão"
                        required
                    />
                    {titleError && <span className={styles.errorMessage}>{titleError}</span>}

                    <label className={styles.label}>Data de entrega</label>
                    <div style={{ position: "relative" }}>
                        <FaRegCalendarAlt
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "10px",
                                transform: "translateY(-50%)",
                                color: "#666",
                            }}
                        />
                        <input
                            type="date"
                            className={styles.input}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            style={{ paddingLeft: "2.2rem" }}
                        />
                    </div>

                    <label className={styles.label}>Descrição</label>
                    <textarea
                        className={styles.textarea}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Escreva uma descrição..."
                    />

                    {isInFinalColumn && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Anexo de imagem da atividade concluída</label>
                            <input
                                type="file"
                                accept="image/*"
                                className={styles.input}
                                onChange={(e) => {
                                    setImageFile(e.target.files[0] || null);
                                }}
                                disabled={!!imageFile || !!savedImage}
                            />
                            {(imageFile || savedImage) ? (
                                <div className={styles.attachmentInfo} style={{ marginTop: 8, color: '#2d6a4f', fontSize: 14 }}>
                                    <span
                                        style={{ textDecoration: 'underline', cursor: 'pointer', color: '#2d6a4f' }}
                                        onClick={() => setShowPreview(true)}
                                    >
                                        {imageFile ? imageFile.name : 'imagem_anexada.jpg'}
                                    </span>
                                    <span style={{ color: '#888', marginLeft: 8 }}>
                                        (Só é possível anexar uma imagem por cartão)
                                    </span>
                                </div>
                            ) : (
                                <div className={styles.attachmentInfo} style={{ marginTop: 8, color: '#888', fontSize: 14 }}>
                                    Nenhum arquivo anexado
                                </div>
                            )}
                            {showPreview && (imageFile || savedImage) && (
                                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPreview(false)}>
                                    <img
                                        src={imageFile ? URL.createObjectURL(imageFile) : savedImage}
                                        alt="Preview"
                                        className={styles.previewImage}
                                        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 2px 16px #0008' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.buttonGroup}>
                        {isEditing ? (
                            <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Excluindo..." : "Excluir"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={loading || !title.trim() || isDeleting}
                        >
                            {loading ? "Salvando..." : (isEditing ? "Salvar alterações" : "Salvar")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCardModal;
