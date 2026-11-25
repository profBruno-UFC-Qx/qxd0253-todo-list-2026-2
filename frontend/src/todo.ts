import type { Task } from "./types";
import * as taskService from "./services/taskService";
import * as categoryService from "./services/categoryService";
import {
  taskList,
  formElement,
  categorySelect,
  descriptionInput,
  deadlineInput,
  submitButton,
} from "./dom";
import { showError } from "./feedback";
import { createDeleteButton, setupDeleteDialog } from "./deleteDialog";

// Sem token, não adianta carregar a página: todas as chamadas falhariam.
// replace() (em vez de assign()) não deixa esta página no histórico,
// então o botão "voltar" do login não traz o usuário de volta para cá.
if (localStorage.getItem("token")) {
  setupTaskForm();
  setupDeleteDialog();
  loadCategories();
  loadTasks();
} else {
  window.location.replace("/login.html");
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
    if (categories) {
      for (let category of categories) {
        const option = createCategoryOption(
          category.description,
          category.documentId,
        );
        categorySelect.appendChild(option);
      }
    }
  } else {
    showError(`Erro ao carregar categorias: ${result.error.message}`);
  }
}

async function loadTasks(): Promise<void> {
  const result = await taskService.getAll();
  if (result.success) {
    const tasks = result.data.data;
    if (tasks) {
      for (let task of tasks) {
        const newTask = createTaskElement(task);
        taskList.appendChild(newTask);
      }
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

function createTaskElement(task: Task): HTMLLIElement {
  const listItem = document.createElement("li");
  listItem.id = task.documentId;

  const taskId = `task-${task.documentId}`;
  const taskCheckbox = createTaskCheckbox(taskId);
  taskCheckbox.checked = task.done;
  taskCheckbox.addEventListener("change", async () => {
    const result = await taskService.update({
      ...task,
      done: taskCheckbox.checked,
    });
    if (result.success) {
      task.done = result.data.data.done;
    } else {
      taskCheckbox.checked = task.done; // desfaz se o backend recusar
      showError(`${result.error.status} - ${result.error.message}`)
    }
  });

  const descriptionLabel = document.createElement("label");
  descriptionLabel.setAttribute("for", taskId);
  descriptionLabel.textContent = task.description;

  const categorySpan = document.createElement("span");
  categorySpan.classList.add("category");
  // Texto vindo do usuário não vira nome de classe ("Vida pessoal" tem espaço
  // e faria o classList.add lançar erro). Um atributo data-* aceita qualquer texto.
  const categoryName = task.category.description;
  categorySpan.dataset.category = categoryName.toLocaleLowerCase();
  categorySpan.textContent = categoryName;

  const deleteButton = createDeleteButton(task);
  const editButton = createEditButton(task, descriptionLabel);

  listItem.appendChild(taskCheckbox);
  listItem.appendChild(descriptionLabel);
  listItem.appendChild(categorySpan);

  if (task.deadline) {
    const deadlineTime = document.createElement("time");
    deadlineTime.className = "deadline";
    deadlineTime.dateTime = task.deadline;
    deadlineTime.textContent = formatDate(task.deadline);
    listItem.appendChild(deadlineTime);
  }

  const actions = document.createElement("span");
  actions.className = "actions";
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  listItem.appendChild(actions);

  return listItem;
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function createTaskCheckbox(taskId: string) {
  const taskCheckbox = document.createElement("input");
  taskCheckbox.type = "checkbox";
  taskCheckbox.id = taskId;

  return taskCheckbox;
}

function createEditButton(task: Task, descriptionLabel: HTMLLabelElement) {
  const editButton = document.createElement("button");
  editButton.textContent = "✏️";
  editButton.setAttribute("aria-label", "Editar tarefa");
  let editing = false;
  const taskId = `task-${task.documentId}`; // mesmo id do checkbox

  function startEditing() {
    editing = true;
    editButton.textContent = "💾";
    editButton.setAttribute("aria-label", "Salvar edição");
    descriptionLabel.removeAttribute("for");
    descriptionLabel.contentEditable = "plaintext-only";
    descriptionLabel.focus();
  }

  function stopEditing() {
    editing = false;
    editButton.textContent = "✏️";
    editButton.setAttribute("aria-label", "Editar tarefa");
    descriptionLabel.setAttribute("for", taskId);
    descriptionLabel.contentEditable = "false";
    descriptionLabel.textContent = task.description; // volta ao último texto salvo
  }

  async function saveEditing() {
    const result = await taskService.update({
      ...task,
      description: descriptionLabel.textContent.trim(),
    });
    if (result.success) {
      task.description = result.data.data.description;
      descriptionLabel.textContent = result.data.data.description;
    } else {
      showError(`${result.error.status} - ${result.error.message}`)
    }
    stopEditing();
  }

  editButton.addEventListener("mousedown", (e) => e.preventDefault());

  editButton.addEventListener("click", async () => {
    if (editing) {
      await saveEditing();
    } else {
      startEditing();
    }
  });

  descriptionLabel.addEventListener("keydown", async (e) => {
    if (!editing) return;
    if (e.key === "Enter") {
      e.preventDefault(); // não insere quebra de linha
      await saveEditing();
    } else if (e.key === "Escape") {
      stopEditing();
    }
  });

  descriptionLabel.addEventListener("blur", () => {
    if (editing) stopEditing();
  });

  return editButton;
}
