import { request } from "./api"
import { showError } from "./feedback"
import type { StrapiLogin } from "./types"

const loginInput = document.getElementById('login') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const formLogin = document.querySelector('form') as HTMLFormElement

// Quem já tem token não precisa ver o login: vai direto para as tarefas.
// (Se o token estiver expirado, a página de tarefas recebe 401 e manda
// o usuário de volta para cá, já sem o token.)
if (localStorage.getItem('token')) {
  window.location.replace('/')
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault()
  const identifier = loginInput.value
  const password = passwordInput.value

  const result = await request<StrapiLogin>('/auth/local', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identifier, password})
  })
  if (result.success) {
    localStorage.setItem('token', result.data.jwt)
    window.location.replace('/')
  } else {
    showError(result.error.message)
  }

})


