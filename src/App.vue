<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Todo } from './types'
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from './api'

const todos = ref<Todo[]>([])
const newTitle = ref('')
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const remainingCount = computed(
  () => todos.value.filter((todo) => !todo.completed).length
)

const completedCount = computed(
  () => todos.value.filter((todo) => todo.completed).length
)

async function loadTodos() {
  loading.value = true
  errorMessage.value = ''

  try {
    todos.value = await getTodos()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลได้'
  } finally {
    loading.value = false
  }
}

async function addTodo() {
  const title = newTitle.value.trim()

  if (!title || submitting.value) {
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    const todo = await createTodo(title)
    todos.value.unshift(todo)
    newTitle.value = ''
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'เพิ่ม Todo ไม่สำเร็จ'
  } finally {
    submitting.value = false
  }
}

async function toggleTodo(todo: Todo) {
  const oldValue = todo.completed
  todo.completed = !oldValue

  try {
    const updated = await updateTodo(todo.id, {
      completed: todo.completed,
    })

    Object.assign(todo, updated)
  } catch (error) {
    todo.completed = oldValue
    errorMessage.value =
      error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะได้'
  }
}

async function removeTodo(todo: Todo) {
  if (!confirm(`ต้องการลบ "${todo.title}" หรือไม่?`)) {
    return
  }

  const index = todos.value.findIndex((item) => item.id === todo.id)
  if (index === -1) return

  const removed = todos.value.splice(index, 1)[0]

  try {
    await deleteTodo(todo.id)
  } catch (error) {
    todos.value.splice(index, 0, removed)
    errorMessage.value =
      error instanceof Error ? error.message : 'ลบ Todo ไม่สำเร็จ'
  }
}

async function editTodo(todo: Todo) {
  const title = prompt('แก้ไข Todo', todo.title)

  if (title === null) {
    return
  }

  const trimmedTitle = title.trim()

  if (!trimmedTitle) {
    return
  }

  const oldTitle = todo.title
  todo.title = trimmedTitle

  try {
    const updated = await updateTodo(todo.id, {
      title: trimmedTitle,
    })

    Object.assign(todo, updated)
  } catch (error) {
    todo.title = oldTitle
    errorMessage.value =
      error instanceof Error ? error.message : 'แก้ไข Todo ไม่สำเร็จ'
  }
}

onMounted(loadTodos)
</script>

<template>
  <main class="page">
    <section class="app-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">PRODUCTIVITY</p>
          <h1>My Todo List</h1>
          <p class="subtitle">
            จัดการงานของคุณให้ง่ายและเป็นระบบ
          </p>
        </div>

        <div class="hero-icon">
          ✓
        </div>
      </header>

      <section class="stats">
        <div class="stat-card">
          <span class="stat-label">งานทั้งหมด</span>
          <strong>{{ todos.length }}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-label">กำลังทำ</span>
          <strong>{{ remainingCount }}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-label">เสร็จแล้ว</span>
          <strong>{{ completedCount }}</strong>
        </div>
      </section>

      <form class="add-form" @submit.prevent="addTodo">
        <input
          v-model="newTitle"
          type="text"
          maxlength="255"
          placeholder="เพิ่มรายการ Todo ใหม่..."
          aria-label="ชื่อ Todo"
        />

        <button type="submit" :disabled="submitting || !newTitle.trim()">
          {{ submitting ? 'กำลังเพิ่ม...' : 'เพิ่ม Todo' }}
        </button>
      </form>

      <div v-if="errorMessage" class="error">
        {{ errorMessage }}
      </div>

      <section class="todo-section">
        <div class="section-heading">
          <h2>รายการของฉัน</h2>
          <button class="refresh-button" @click="loadTodos" :disabled="loading">
            {{ loading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
        </div>

        <div v-if="loading && todos.length === 0" class="empty-state">
          <div class="spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>

        <div v-else-if="todos.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>ยังไม่มี Todo</h3>
          <p>เพิ่มรายการแรกของคุณได้จากช่องด้านบน</p>
        </div>

        <div v-else class="todo-list">
          <article
            v-for="todo in todos"
            :key="todo.id"
            class="todo-item"
            :class="{ completed: todo.completed }"
          >
            <button
              class="check-button"
              :class="{ checked: todo.completed }"
              :aria-label="todo.completed ? 'ยกเลิกสถานะเสร็จ' : 'ทำเครื่องหมายว่าเสร็จ'"
              @click="toggleTodo(todo)"
            >
              <span v-if="todo.completed">✓</span>
            </button>

            <div class="todo-content">
              <span class="todo-title">{{ todo.title }}</span>

              <small>
                {{ todo.completed ? 'เสร็จแล้ว' : 'กำลังดำเนินการ' }}
              </small>
            </div>

            <div class="todo-actions">
              <button
                class="action edit"
                aria-label="แก้ไข"
                @click="editTodo(todo)"
              >
                แก้ไข
              </button>

              <button
                class="action delete"
                aria-label="ลบ"
                @click="removeTodo(todo)"
              >
                ลบ
              </button>
            </div>
          </article>
        </div>
      </section>

      <footer>
        Todo List • Vue 3 + TypeScript + AdonisJS + PostgreSQL
      </footer>
    </section>
  </main>
</template>
