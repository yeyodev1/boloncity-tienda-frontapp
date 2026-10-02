<script setup lang="ts">
import type { UserDTO } from '@/services/UserService'

defineProps<{ users: UserDTO[]; loading: boolean; labels: Record<string, string>; searching?: boolean }>()
const emit = defineEmits<{ create: []; edit: [user: UserDTO]; remove: [user: UserDTO] }>()

function access(user: UserDTO) {
  if (user.accountType === 'customer') return 'Se registró al comprar en la tienda'
  if (user.allBranches) return 'Todos los locales'
  const names = user.branches?.map((branch) => branch.name) || []
  return names.length ? names.join(', ') : 'Sin locales asignados'
}

function initial(user: UserDTO) {
  return (user.name || user.email).trim().slice(0, 1).toUpperCase()
}
</script>

<template>
  <section class="users cui-panel" aria-live="polite">
    <ul v-if="loading" class="users__list" aria-hidden="true">
      <li v-for="n in 5" :key="n" class="user"><span class="sk sk--avatar" /><span class="sk sk--line" /></li>
    </ul>

    <ul v-else-if="users.length" class="users__list">
      <li v-for="user in users" :key="user._id" class="user" :data-role="user.accountType">
        <span class="user__avatar" aria-hidden="true">
          <i v-if="user.accountType === 'customer'" class="fa-solid fa-user" />
          <template v-else>{{ initial(user) }}</template>
        </span>
        <div class="user__body">
          <div class="user__title">
            <strong>{{ user.name || user.email }}</strong>
            <span class="cui-chip" :class="{ 'cui-chip--accent': user.accountType === 'admin', 'cui-chip--good': user.accountType === 'branch_admin' }">{{ labels[user.accountType] || user.accountType }}</span>
          </div>
          <p v-if="user.name">{{ user.email }}</p>
          <p class="user__access" :class="{ 'is-warn': user.accountType === 'branch_admin' && !user.allBranches && !user.branches?.length }">
            <i :class="user.accountType === 'customer' ? 'fa-solid fa-bag-shopping' : 'fa-solid fa-store'" aria-hidden="true" /> {{ access(user) }}
          </p>
        </div>
        <div class="user__actions">
          <button type="button" class="cui-icon-btn" :aria-label="`Editar ${user.email}`" title="Editar" @click="emit('edit', user)"><i class="fa-solid fa-pen" /></button>
          <button type="button" class="cui-icon-btn is-danger" :aria-label="`Eliminar ${user.email}`" title="Eliminar" @click="emit('remove', user)"><i class="fa-solid fa-trash" /></button>
        </div>
      </li>
    </ul>

    <div v-else class="cui-empty">
      <i class="fa-solid fa-users" aria-hidden="true" />
      <strong>{{ searching ? 'Nadie coincide con esa búsqueda' : 'No hay usuarios en este grupo' }}</strong>
      <p>{{ searching ? 'Prueba con otro nombre o correo.' : 'Crea un usuario para darle acceso al panel.' }}</p>
      <button v-if="!searching" type="button" class="cui-btn cui-btn--primary" @click="emit('create')"><i class="fa-solid fa-user-plus" /> Nuevo usuario</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.users { overflow: hidden; }
.users__list { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }

.user {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  transition: background-color 0.2s ease;

  &:first-child { border-top: 0; }
  &:hover { background: var(--admin-hover); }
}

.user__avatar {
  align-items: center;
  background: var(--admin-accent);
  border-radius: 50%;
  color: var(--admin-on-accent);
  display: flex;
  flex: 0 0 42px;
  font-size: 0.9rem;
  font-weight: 800;
  height: 42px;
  justify-content: center;
}

.user[data-role='customer'] .user__avatar { background: var(--admin-surface-2); color: var(--admin-subtle); }
.user[data-role='admin'] .user__avatar { background: var(--admin-yellow); color: var(--admin-on-yellow); }

.user__body { display: flex; flex: 1 1 auto; flex-direction: column; gap: 0.1rem; min-width: 0; }
.user__title { align-items: center; display: flex; flex-wrap: wrap; gap: 0.4rem; }
.user__title strong { font-size: 0.94rem; overflow-wrap: anywhere; }
.user__body p { color: var(--admin-muted); font-size: 0.76rem; margin: 0; overflow-wrap: anywhere; }
.user__access i { font-size: 0.68rem; margin-right: 0.15rem; }
.user__access.is-warn { color: var(--admin-warning); font-weight: 700; }

.user__actions { display: flex; flex: 0 0 auto; gap: 0.35rem; }

.sk { animation: sk 1.2s ease-in-out infinite; background: var(--admin-hover); border-radius: 8px; display: block; }
.sk--avatar { border-radius: 50%; flex: 0 0 42px; height: 42px; }
.sk--line { flex: 0 1 45%; height: 14px; }
@keyframes sk { 50% { opacity: 0.45; } }

@media (prefers-reduced-motion: reduce) { .sk { animation: none; } }
</style>
