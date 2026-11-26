// Tudo o que é preciso para desenhar UMA tarefa na lista: o <li> com
// checkbox, descrição, categoria, prazo e os botões de editar e excluir.
// Só createTaskElement é exportada; as demais são detalhes internos.
import type { Task } from "./types";
import * as taskService from "./services/taskService";
import { showError } from "./feedback";
import { createDeleteButton } from "./deleteDialog";

export function createTaskElement(task: Task): HTMLLIElement {
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
    const description = descriptionLabel.textContent.trim();
    // A mesma regra do formulário de criação vale aqui: toda entrada
    // de dados precisa ser validada, não só a primeira que escrevemos.
    if (description.length === 0) {
      showError("A descrição da tarefa não pode ficar vazia.");
      return; // continua editando, para o usuário corrigir
    }
    const result = await taskService.update({ ...task, description });
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
