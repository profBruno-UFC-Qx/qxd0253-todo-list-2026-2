import { request } from "./api"
import { showError } from "./feedback"
import type { StrapiLogin } from "./types"

const loginInput = document.getElementById('login') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const formLogin = document.querySelector('form') as HTMLFormElement

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
  if(result.success) {
      const loginData = result.data;
      if(loginData.jwt) {
        localStorage.setItem('token', loginData.jwt)
        window.location.assign("/")
      }
  } else {
    console.log(result.error.message, result.error.name, result.error.status)
    showError(result.error.message)
  }

})


