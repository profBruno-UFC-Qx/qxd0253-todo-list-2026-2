import * as taskService from "./services/taskService";
import * as categoryService from "./services/categoryService";
import {
  taskList,
  formElement,
  categorySelect,
  descriptionInput,
  deadlineInput,
  submitButton,
  logoutButton,
} from "./dom";
import { showError } from "./feedback";
import { setupDeleteDialog } from "./deleteDialog";
import { createTaskElement } from "./taskItem";

// Sem token, não adianta carregar a página: todas as chamadas falhariam.
// replace() (em vez de assign()) não deixa esta página no histórico,
// então o botão "voltar" do login não traz o usuário de volta para cá.
if (localStorage.getItem("token")) {
  setupLogout();
  setupTaskForm();
  setupDeleteDialog();
  loadCategories();
  loadTasks();
} else {
  window.location.replace("/login.html");
}

// Para o frontend, "estar logado" é só ter o token salvo no navegador.
// Sair, portanto, é apagar esse token.
function setupLogout() {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.replace("/login.html");
  });
}

function setupTaskForm() {
  formElement.addEventListener("submit", async (e) => {
    e.preventDefault();
    const description = descriptionInput.value.trim();
    if (description.length !== 0) {
      const result = await taskService.create({
        description,
        deadline: deadlineInput.value || null,
        done: false,
        category: categorySelect.value,
      });

      if (result.success) {
        // A resposta já vem com a categoria completa (?populate=category).
        taskList.appendChild(createTaskElement(result.data.data));
        // Só limpa o campo se deu certo: em caso de erro, o usuário
        // não perde o que digitou e pode tentar de novo.
        descriptionInput.value = "";
        submitButton.disabled = true;
      } else {
        showError(`Erro ao criar tarefa: ${result.error.message}`);
      }
    }
  });

  descriptionInput.addEventListener("input", () => {
    submitButton.disabled = descriptionInput.value.trim().length === 0;
  });
}

async function loadCategories(): Promise<void> {
  const result = await categoryService.getAll();
  if (result.success) {
    const categories = result.data.data;
    for (const category of categories) {
      const option = createCategoryOption(
        category.description,
        category.documentId,
      );
      categorySelect.appendChild(option);
    }
  } else {
    showError(`Erro ao carregar categorias: ${result.error.message}`);
  }
}

async function loadTasks(): Promise<void> {
  const result = await taskService.getAll();
  if (result.success) {
    const tasks = result.data.data;
    for (const task of tasks) {
      const newTask = createTaskElement(task);
      taskList.appendChild(newTask);
    }
  } else {
    showError(`Erro ao carregar tarefas: ${result.error.message}`);
  }
}

function createCategoryOption(
  description: string,
  id: string,
): HTMLOptionElement {
  const newOption = document.createElement("option");
  newOption.textContent = description;
  newOption.value = id;
  return newOption;
}
