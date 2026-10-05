import type { ApiResponse, Todo } from './types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      body?.message ||
      body?.errors?.[0]?.message ||
      'เกิดข้อผิดพลาดในการเชื่อมต่อ API'

    throw new Error(message)
  }

  return body
}

export async function getTodos(): Promise<Todo[]> {
  const result = await request<ApiResponse<Todo[]>>('/todos')
  return result.data
}

export async function createTodo(title: string): Promise<Todo> {
  const result = await request<ApiResponse<Todo>>('/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })

  return result.data
}

export async function updateTodo(
  id: number,
  data: Partial<Pick<Todo, 'title' | 'completed'>>
): Promise<Todo> {
  const result = await request<ApiResponse<Todo>>(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return result.data
}

export async function deleteTodo(id: number): Promise<void> {
  await request(`/todos/${id}`, {
    method: 'DELETE',
  })
}
