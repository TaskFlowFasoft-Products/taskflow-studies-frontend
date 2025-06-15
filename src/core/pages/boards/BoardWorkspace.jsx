import ProgressBar from '../../../features/academicProgress/ProgressBar';
import { useState, useRef, useEffect } from "react";
import styles from "./styles/boardWorkspace.module.css";
import { useNavigate } from "react-router-dom";
import CreateBoardModal from "./components/modals/CreateBoardModal";
import CreateColumnModal from "./components/modals/CreateColumnModal";
import RenameBoardModal from "./components/modals/RenameBoardModal";
import DeleteConfirmModal from "./components/modals/DeleteConfirmModal";
import RenameColumnModal from "./components/modals/RenameColumnModal";
import DeleteCardConfirmModal from "./components/modals/DeleteCardConfirmModal";
import CreateCardModal from "./components/modals/CreateCardModal";
import DeleteColumnConfirmModal from "./components/modals/DeleteColumnConfirmModal";
import { getBoards } from "../../api/boardService";
import MenuPortal from "../../components/MenuPortal";
import {
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaTrashAlt,
  FaPen,
  FaRegClock,
} from "react-icons/fa";
import LogoIcon from "../../assets/Logo Icone.png";
import { toast } from "react-toastify";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { deleteBoard } from "../../api/boardService";
import { getBoardColumns } from "../../api/columnService";
import { createTask } from "../../api/taskService";
import { updateTask } from "../../api/taskService";
import { deleteTask } from "../../api/taskService";
import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const BOARD_TYPE_COLUMNS = {
  teoricas: ["Para Estudar", "Em Estudo", "Revisão", "Concluído"],
  praticas: ["Para Estudar", "Em Estudo", "Revisão", "Concluído"],
  trabalhos: ["Para Iniciar", "Em Desenvolvimento", "Revisão", "Entregue"]
};

const BoardWorkspace = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBoardIndex, setSelectedBoardIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [columnToAddCard, setColumnToAddCard] = useState(null);
  const [cardToEdit, setCardToEdit] = useState(null);
  const [showDeleteCardConfirmModal, setShowDeleteCardConfirmModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const userRef = useRef(null);
  const userDropdownRef = useRef(null);
  const columnDropdownRef = useRef(null);
  const boardDropdownRef = useRef(null);

  const [loggedInUserName, setLoggedInUserName] = useState("Carregando...");

  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: '' });

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setLoggedInUserName(storedUsername);
    } else {
      setLoggedInUserName("Usuário");
    }
  }, []);

  useEffect(() => {
    const fetchBoards = async () => {
      const data = await getBoards();
      setBoards(Array.isArray(data) ? data : []);
      setLoading(false);
    };
  
    fetchBoards();
  }, []);
  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target) &&
        userRef.current &&
        !userRef.current.contains(event.target)
      ) {
        setActiveMenuIndex(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    if (!sidebarOpen) {
      setActiveMenuIndex(null);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target)) {
        // setColumnMenu(null); // Remover esta linha
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = (index, event) => {
    event.stopPropagation();
    setActiveMenuIndex((prev) => (prev === index ? null : index));
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
    setActiveMenuIndex(null);
  };

  const confirmDeleteBoard = async () => {
    const boardId = boards[deleteIndex]?.id;

    if (!boardId) {
        toast.error("Erro: ID do quadro não encontrado para exclusão.");
        setShowDeleteModal(false);
        return;
    }

    setIsDeletingBoard(true);

    try {
        const result = await deleteBoard(boardId);
    
        if (result.success) {
          setBoards((prev) => prev.filter((_, i) => i !== deleteIndex));
          if (selectedBoardIndex === deleteIndex) {
            setSelectedBoardIndex(null);
          }
          toast.success("Quadro excluído com sucesso!");
        } else {
          toast.error(result.message || "Erro ao excluir quadro.");
        }
    } catch (error) {
        toast.error("Erro ao excluir quadro.");
    } finally {
        setShowDeleteModal(false);
        setIsDeletingBoard(false);
    }
  };
  

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("expires_at");
    setUserMenuOpen(false);
    navigate("/login");
  };

  const handleCreateCardClick = (colIndex) => {
    setColumnToAddCard(colIndex);
    setShowCreateCardModal(true);
  };

  const handleCreateCard = async (cardData) => {
    const updatedBoards = structuredClone(boards);
    const board = updatedBoards[selectedBoardIndex];
  
    setIsSavingCard(true);

    try {
      if (!cardData.title || cardData.title.trim() === '') {
        toast.error('O título do cartão é obrigatório');
        setIsSavingCard(false);
        return;
      }

      if (cardData.id) {
        let columnIndex = cardData.columnIndex;
        if (columnIndex === undefined || columnIndex === null) {
          columnIndex = board.columns.findIndex((col) =>
            col.cards.some((card) => card.id === cardData.id)
          );
        }
        
        if (columnIndex === -1) {
          toast.error("Coluna do cartão não encontrada.");
          return;
        }
        
        const currentColumnId = board.columns[columnIndex].id;

        const payload = {
          board_id: Number(board.id.toString().replace('col-', '')),
          column_id: Number(currentColumnId.replace('col-', '')),
          old_column_id: Number(currentColumnId.replace('col-', '')),
          task_id: Number(cardData.id.toString().replace('card-', '')),
          title: cardData.title,
          description: cardData.description,
          due_date: cardData.dueDate === '' ? null : cardData.dueDate,
          ...(cardData.completion_image_base64 ? { completion_image_base64: cardData.completion_image_base64 } : {}),
        };

        await updateTask(payload);

        const cards = board.columns[columnIndex].cards;
        const cardIndex = cards.findIndex((c) => c.id === cardData.id);
  
        if (cardIndex !== -1) {
          cards[cardIndex] = {
            ...cards[cardIndex],
            title: cardData.title,
            description: cardData.description,
            dueDate: cardData.dueDate,
            completion_image_base64: cardData.completion_image_base64
          };
          toast.success("Cartão atualizado com sucesso!");
        } else {
          toast.warn("Cartão não encontrado para atualização.");
        }
  
      } else {
        const columnIndex = columnToAddCard;
        const payload = {
          board_id: Number(board.id.toString().replace('col-', '')),
          column_id: Number(board.columns[columnIndex].id.replace('col-', '')),
          title: cardData.title,
          description: cardData.description,
          due_date: cardData.dueDate === '' ? null : cardData.dueDate,
        };
  
        const created = await createTask(payload);
  
        const newCard = {
          id: String(created.id),
          title: created.title,
          description: created.description,
          dueDate: created.due_date,
          createdAt: created.created_at,
        };
  
        board.columns[columnIndex].cards.push(newCard);
        toast.success("Cartão criado com sucesso!");
      }
  
      setBoards(updatedBoards);
      setCardToEdit(null);
      setShowCreateCardModal(false);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Erro ao salvar o cartão.";
      toast.error(errorMessage);
    } finally {
      setIsSavingCard(false);
      setShowCreateCardModal(false);
    }
  };
  


  const handleDeleteCard = (card) => {
    setCardToDelete(card);
    setShowDeleteCardConfirmModal(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete || cardToDelete.columnIndex === undefined || cardToDelete.id === undefined) {
        toast.error("Erro interno ao tentar excluir cartão. Por favor, tente novamente.");
        setCardToDelete(null);
        setShowDeleteCardConfirmModal(false);
        setShowCreateCardModal(false);
        setCardToEdit(null);
        return;
    }

    const updatedBoards = structuredClone(boards);
    const board = updatedBoards[selectedBoardIndex];
    const columnIndex = cardToDelete.columnIndex;

     if (!board || !board.columns || !board.columns[columnIndex]) {
        toast.error("Erro interno ao tentar excluir cartão. Por favor, tente novamente.");
        setCardToDelete(null);
        setShowDeleteCardConfirmModal(false);
        setShowCreateCardModal(false);
        setCardToEdit(null); 
        return;
    }
  
    setIsDeletingCard(true);

    try {
      const payload = {
        board_id: Number(board.id.toString().replace('col-', '')),
        column_id: Number(board.columns[columnIndex].id.replace('col-', '')),
        task_id: Number(cardToDelete.id.toString().replace('card-', '')), 
      };
  
      await deleteTask(payload);
  
      board.columns[columnIndex].cards = board.columns[columnIndex].cards.filter(
        (c) => c.id !== cardToDelete.id
      );
  
      setBoards(updatedBoards);
      toast.success("Cartão excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir o cartão.");
    } finally {
      setCardToDelete(null);
      setShowDeleteCardConfirmModal(false);
      setShowCreateCardModal(false); 
      setCardToEdit(null); 
      setIsDeletingCard(false);
    }
  };  

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const updatedBoards = structuredClone(boards);
    const board = updatedBoards[selectedBoardIndex];

    const sourceColId = Number(source.droppableId.replace('col-', ''));
    const destColId = Number(destination.droppableId.replace('col-', ''));

    const sourceColIndex = board.columns.findIndex(
      (col) => Number(col.id.replace('col-', '')) === sourceColId
    );
    const destColIndex = board.columns.findIndex(
      (col) => Number(col.id.replace('col-', '')) === destColId
    );

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = board.columns[sourceColIndex];
    const destCol = board.columns[destColIndex];

    const [movedCard] = sourceCol.cards.splice(source.index, 1);
    if (!movedCard) return;

    movedCard.column_id = Number(destColId); 

    destCol.cards.splice(destination.index, 0, movedCard);

    setBoards(updatedBoards);


    if (sourceColId !== destColId) {
      try {
        const cardId = Number(movedCard.id.replace('card-', ''));

        await updateTask({
          board_id: Number(board.id),
          task_id: cardId,
          column_id: Number(destColId), 
          title: movedCard.title ?? '',
          description: movedCard.description ?? '',
          due_date: movedCard.dueDate ?? null,
        });
      } catch (error) {
        const revertedBoards = structuredClone(boards);
        setBoards(revertedBoards);
      }
    }
  };

  const handleSelectBoard = async (index) => {
    setSelectedBoardIndex(index);
  
    const board = boards[index];
    const columns = await getBoardColumns(board.id);

  
    let normalizedColumns = columns.map((col) => ({
      ...col,
      id: `col-${col.id}`, 
      cards: col.cards?.map((card) => ({
        ...card,
        id: `card-${card.id}`,
        dueDate: typeof card.due_date === 'string' ? card.due_date : (card.dueDate || '')
      })) || [],
    }));
  
    // Se não houver colunas, reconstruir as colunas padrão
    if (normalizedColumns.length === 0) {
      const type = board.type || localStorage.getItem(`board_type_${board.id}`) || "teoricas";
      normalizedColumns = BOARD_TYPE_COLUMNS[type].map((colName, idx) => ({
        id: `${idx}`,
        title: colName,
        name: colName,
        cards: []
      }));
    }

    // Notificação de cards expirados
    normalizedColumns.forEach(col => {
      const isFinalColumn = ['concluído', 'entregue'].includes(col.title?.toLowerCase());
      if (!isFinalColumn) {
        col.cards.forEach(card => {
          if (card.dueDate) {
            const [year, month, day] = card.dueDate.split('-');
            const due = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999); // 23:59:59 do dia do prazo
            const now = new Date();
            if (now > due) {
              toast.error(`Task "${card.title}" expirou o prazo`);
            }
          }
        });
      }
    });

    setBoards((prevBoards) => {
      const updated = [...prevBoards];
      updated[index].columns = normalizedColumns;
      return updated;
    });
  };  
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target) &&
        userRef.current &&
        !userRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }

      if (
        boardDropdownRef.current &&
        !boardDropdownRef.current.contains(event.target) &&
        activeMenuIndex !== null
      ) {
        const isToggleClick = event.target.closest(`.${styles.boardMenu}`) !== null;

        if (!boardDropdownRef.current.contains(event.target) && !isToggleClick) {
           setActiveMenuIndex(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownRef, userRef, boardDropdownRef, activeMenuIndex]);

  useEffect(() => {
    const handleClickOutsideColumnMenu = (e) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target)) {
        // setColumnMenu(null); // Remover esta linha
      }
    };
    document.addEventListener("mousedown", handleClickOutsideColumnMenu);
    return () => document.removeEventListener("mousedown", handleClickOutsideColumnMenu);
  }, [columnDropdownRef]);

  const columns = boards[selectedBoardIndex]?.columns || [];
  const completedColumnTitles = ['concluído', 'entregue'];
  const completedCards = columns
    .filter(col => col.title && completedColumnTitles.includes(col.title.toLowerCase()))
    .reduce((acc, col) => acc + (col.cards ? col.cards.length : 0), 0);
  const totalCards = columns.reduce((acc, col) => acc + (col.cards ? col.cards.length : 0), 0);
  const progresso = totalCards === 0 ? 0 : Math.round((completedCards / totalCards) * 100);

  const handleCreateBoard = async ({ id }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${VITE_API_URL}/studies/boards`,
        { id: Number(id) },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Buscar novamente os quadros
      const data = await getBoards();
      setBoards(data);
      setShowModal(false);
      toast.success("Quadro criado com sucesso!");
    } catch (e) {
      toast.error("Erro ao criar quadro");
    } finally {
      setLoading(false);
    }
  };

  const handleClockClick = (e, tooltipText) => {
    e.stopPropagation();
    setTooltip({
      show: true,
      x: e.clientX,
      y: e.clientY,
      text: tooltipText
    });
  };

  useEffect(() => {
    if (!tooltip.show) return;
    const handleClick = () => setTooltip({ ...tooltip, show: false });
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [tooltip]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div
            className={`${styles.logo} ${!sidebarOpen ? styles.logoHidden : ""
              }`}
          >
            <img
              src={LogoIcon}
              alt="TaskStudies Logo"
              className={styles.logoImage}
            />
          </div>
          <h1 className={styles.appName}>TaskStudies</h1>
        </div>

        <div className={styles.headerCenter}>
          {selectedBoardIndex !== null
            ? boards[selectedBoardIndex]?.title
            : "Nenhum quadro selecionado"}
        </div>

        <div className={styles.headerRight}>
          <div
            ref={userRef}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{ cursor: "pointer" }}
          >
            <span style={{ background: '#fff', borderRadius: '50%', padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUserCircle size={23} color="#7c3aed" />
            </span>
          </div>

          {userMenuOpen && (
            <MenuPortal>
              <div className={styles.userMenu} ref={userDropdownRef}>
                <div className={styles.userInfo}>
                  <span className={styles.userDisplayName}>{loggedInUserName}</span>
                </div>
                <div className={styles.menuDivider}></div>
                <button className={styles.userMenuItem} onClick={handleLogout}>
                  Fazer Logout
                </button>
              </div>
            </MenuPortal>
          )}
        </div>
      </header>

      <div className={styles.workspaceContainer}>
        <div
          className={`${styles.toggleContainer} ${sidebarOpen ? styles.open : styles.closed
            }`}
        >
          <button
            className={styles.toggleSidebarBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <FaChevronLeft size={16} />
            ) : (
              <FaChevronRight size={16} />
            )}
          </button>
        </div>

        <aside
          className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ""
            }`}
        >
          <h3 className={styles.sidebarTitle}>Task Workspace</h3>
          <div className={styles.sidebarSection}>
            <p className={styles.sectionLabel}>Meus Quadros</p>
            <ul className={styles.boardList}>
              {Array.isArray(boards) && boards.length > 0 ? (
                boards.map((board, index) => (
                  <li
                    key={board.id || index}
                    className={`${styles.boardItem} ${selectedBoardIndex === index ? styles.activeBoard : ""}`}
                  >
                    <div
                      className={styles.boardContent}
                      onClick={() => handleSelectBoard(index)}
                    >
                      <span className={styles.pinIcon}>📌</span>
                      {board.title}
                    </div>
                    <div className={styles.boardMenu} style={{ position: 'relative' }}>
                      <FaTrashAlt
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(index);
                        }}
                        style={{ cursor: 'pointer', color: '#e63946', marginLeft: 8 }}
                        title="Excluir Quadro"
                      />
                    </div>
                  </li>
                ))
              ) : (
                <div>Você ainda não adicionou nenhum quadro. Que tal começar agora?</div>
              )}
            </ul>
            <button
              className={styles.addBoardBtn}
              onClick={() => setShowModal(true)}
            >
              <FaPlus size={12} style={{ marginRight: "6px" }} />
              Novo Quadro
            </button>
          </div>
        </aside>

        <main className={styles.mainContent}>
          {loading ? (
            <p>Carregando quadros...</p>
          ) : selectedBoardIndex === null ? (
            <h2>Selecione ou crie um quadro</h2>
          ) : (
            <div className={styles.boardView}>
              <h2 className={styles.boardTitle}>
                {boards[selectedBoardIndex]?.title}
              </h2>
              <ProgressBar progresso={progresso} />

              <DragDropContext onDragEnd={handleDragEnd}>
                <div className={styles.columnsArea}>
                  {boards[selectedBoardIndex]?.columns?.length > 0 &&
                    boards[selectedBoardIndex].columns.map((column, colIndex) => {
                      const totalCards = column.cards.length;
                      const completedCards = column.cards.filter(card => card.status === 'concluido').length;
                      const progresso = totalCards === 0 ? 0 : Math.round((completedCards / totalCards) * 100);

                      const isFinalColumn = ['concluído', 'entregue'].includes(column.title?.toLowerCase());
                      let cardStatusClass = '';
                      if (isFinalColumn) {
                        cardStatusClass = styles.cardDone; // borda verde
                      } else if (column.cards.length > 0 && column.cards[0].dueDate) {
                        const [year, month, day] = column.cards[0].dueDate.split('-');
                        const due = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999); // 23:59:59 do dia do prazo
                        const now = new Date();
                        if (now > due) {
                          cardStatusClass = styles.cardExpired; // borda vermelha
                        }
                      }

                      return (
                        <Droppable droppableId={column.id} key={column.id}>
                          {(provided) => (
                            <div
                              className={styles.column}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              <div className={styles.columnHeader}>
                                <h3 className={styles.columnTitle}>{column.title}</h3>
                              </div>

                              <div className={styles.columnContent}>
                                {column.cards?.length > 0 ? (
                                  column.cards.map((card, cardIndex) => {
                                    if (!card) return null; 
                                    return (
                                      <Draggable draggableId={card.id} index={cardIndex} key={card.id}>
                                        {(provided) => (
                                          <div
                                            className={`${styles.card} ${cardStatusClass}`}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => {
                                              const colTitle = boards[selectedBoardIndex]?.columns?.[colIndex]?.title?.toLowerCase() || '';
                                              const isInFinalColumn = ['concluído', 'entregue'].includes(colTitle);
                                              setCardToEdit({ ...card, columnIndex: colIndex, isInFinalColumn });
                                              setShowCreateCardModal(true);
                                            }}
                                          >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                              <span>{card.title}</span>
                                              {!isFinalColumn && card.dueDate && (() => {
                                                const [year, month, day] = card.dueDate.split('-');
                                                const due = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999); // 23:59:59 do dia do prazo
                                                const now = new Date();
                                                let tooltipText = '';
                                                if (now > due) {
                                                  tooltipText = 'Prazo expirado!';
                                                } else {
                                                  const diff = due - now;
                                                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                                                  const minutes = Math.floor((diff / (1000 * 60)) % 60);
                                                  tooltipText = `Faltam ${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}min`;
                                                }
                                                return (
                                                  <span
                                                    style={{ marginLeft: 8, cursor: 'pointer', position: 'relative' }}
                                                    onClick={e => handleClockClick(e, tooltipText)}
                                                  >
                                                    <FaRegClock size={16} color="#7c3aed" />
                                                  </span>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })
                                ) : (
                                  <span className={styles.placeholder}>Sem cartões</span>
                                )}
                                {provided.placeholder}
                              </div>

                              <button
                                className={styles.addCardBtn}
                                onClick={() => handleCreateCardClick(colIndex)}
                              >
                                + Adicionar Cartão
                              </button>
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                </div>
              </DragDropContext>

            </div>
          )}

        </main>

      </div>

      {showModal && (
        <CreateBoardModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateBoard}
          loading={false}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          boardName={boards[deleteIndex]?.title}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteBoard}
          loading={isDeletingBoard}
        />
      )}

      {showCreateCardModal && (
        <CreateCardModal
          onClose={() => {
            setShowCreateCardModal(false);
            setCardToEdit(null);
          }}
          onCreate={handleCreateCard}
          onDelete={handleDeleteCard}
          card={cardToEdit}
          isEditing={!!cardToEdit}
          loading={isSavingCard}
          isDeleting={isDeletingCard}
          isInFinalColumn={cardToEdit?.isInFinalColumn}
        />
      )}

      {showDeleteCardConfirmModal && (
        <DeleteCardConfirmModal
          cardTitle={cardToDelete?.title}
          onCancel={() => {
            setShowDeleteCardConfirmModal(false);
            setCardToDelete(null);
          }}
          onConfirm={confirmDeleteCard}
          loading={isDeletingCard}
        />
      )}

      {tooltip.show && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 60,
            background: '#fff',
            color: tooltip.text === 'Prazo expirado!' ? 'red' : '#222',
            border: '1px solid #ccc',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 15,
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: '0 2px 8px #0002',
            minWidth: 140,
            textAlign: 'center',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            pointerEvents: 'auto'
          }}
          onClick={e => e.stopPropagation()}
        >
          {tooltip.text}
        </div>
      )}

    </div>
  );
};

export default BoardWorkspace;