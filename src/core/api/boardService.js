import axios from "axios";
import { VITE_API_URL } from "../config/config";

export async function getBoards() {
  const token = localStorage.getItem("access_token");

  try {
    const boardResponse = await axios.get(`${VITE_API_URL}/studies/boards`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return boardResponse.data.boards;
  } catch (error) {
    return [];
  }
}


export async function createBoard(title) {
  const token = localStorage.getItem("access_token");

  try {
    const response = await axios.post(
      `${VITE_API_URL}/studies/boards`,
      { title },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.status === 200) {
      return {
        success: true,
        board: {
          id: String(response.data.board_id),
          name: title,
          columns: [],
          created_at: response.data.created_at
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Erro ao criar quadro"
    };
  }
}

export async function deleteBoard(boardId) {
  const token = localStorage.getItem("access_token");

  try {
    const response = await axios.delete(`${VITE_API_URL}/studies/boards/${boardId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200 && response.data.success) {
      return { success: true };
    } else {
      return { success: false, message: response.data.message || "Falha ao excluir." };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Erro inesperado."
    };
  }
}

export async function updateBoard(boardId, newTitle) {
  const token = localStorage.getItem("access_token");
  try {
    const response = await axios.put(
      `${VITE_API_URL}/studies/boards/${boardId}`,
      { title: newTitle },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.status === 200 && response.data.success) {
      return { success: true };
    } else {
      return {
        success: false,
        message: response.data.message || "Falha ao atualizar título."
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Erro inesperado ao atualizar quadro."
    };
  }
}

export async function getBoardTemplates() {
  const token = localStorage.getItem("access_token");
  try {
    const response = await axios.get(`${VITE_API_URL}/studies/boards/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Retorna apenas o array de templates
    return response.data.templates;
  } catch {
    return [];
  }
}
