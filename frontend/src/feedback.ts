// Este módulo fica separado de dom.ts porque é usado por duas páginas
// (index.html e login.html). Importar um módulo executa todo o código dele:
// se o feedback estivesse em dom.ts, a página de login rodaria também os
// querySelector da página de tarefas, procurando elementos que lá não existem.
const feedbackAlert = document.getElementById('feedback') as HTMLParagraphElement;

// toggle() inverte o estado atual da classe; aqui queremos um estado final
// conhecido, por isso removemos tudo e adicionamos só o que interessa.
function showFeedback(message: string, type: 'error' | 'success') {
  feedbackAlert.textContent = message;
  feedbackAlert.classList.remove('hidden', 'error', 'success')
  feedbackAlert.classList.add(type)
}

export function showError(message: string) {
  showFeedback(message, 'error')
}

export function showSuccess(message: string) {
  showFeedback(message, 'success')
}
