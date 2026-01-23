import axios from 'axios';
import type {
  ApiResponse,
  Task,
  Link,
  GanttData,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskReorderRequest,
} from '../types/gantt';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// タスク API
export async function getTasks(): Promise<ApiResponse<GanttData>> {
  try {
    const response = await api.get('/api/tasks');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export async function getTask(id: number): Promise<ApiResponse<Task>> {
  try {
    const response = await api.get(`/api/tasks/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export async function createTask(
  task: CreateTaskRequest
): Promise<ApiResponse<Task>> {
  try {
    const response = await api.post('/api/tasks', task);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export async function updateTask(
  id: number,
  task: UpdateTaskRequest
): Promise<ApiResponse<Task>> {
  try {
    const response = await api.put(`/api/tasks/${id}`, task);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export async function deleteTask(
  id: number
): Promise<ApiResponse<{ deleted_id: number; deleted_children: number[] }>> {
  try {
    const response = await api.delete(`/api/tasks/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

// ... (existing code)
export async function cloneTask(id: number): Promise<ApiResponse<Task>> {
  try {
    const response = await api.post(`/api/tasks/${id}/clone`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export async function reorderTasks(
  request: TaskReorderRequest
): Promise<ApiResponse<{ status: string; updated_count: number }>> {
  try {
    const response = await api.post('/api/tasks/reorder', request);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

// リンク API
export async function getLinks(): Promise<ApiResponse<Link[]>> {
  try {
    const response = await api.get('/api/links');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export async function createLink(
  link: Omit<Link, 'id'>
): Promise<ApiResponse<Link>> {
  try {
    const response = await api.post('/api/links', link);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export async function deleteLink(id: number): Promise<ApiResponse<void>> {
  try {
    await api.delete(`/api/links/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

// エクスポート/インポート API
export async function exportCSV(): Promise<Blob | null> {
  try {
    const response = await api.get('/api/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('CSV export error:', error);
    return null;
  }
}

export async function importCSV(
  file: File
): Promise<
  ApiResponse<{ imported_count: number; skipped_count: number; errors: string[] }>
> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '通信エラー',
    };
  }
}

export default api;
