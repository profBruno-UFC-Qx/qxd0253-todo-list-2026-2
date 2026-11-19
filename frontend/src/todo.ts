import type { Category, Task } from "./types";
import { fetchCollection, createTask, updateTask } from "./api";
import {
  taskList,
  formElement,
  categorySelect,
  descriptionInput,
  deadlineInput,
  submitButton,
} from "./dom";
import { createDeleteButton, setupDeleteDialog } from "./deleteDialog";

setupTaskForm();
setupDeleteDialog();
loadCategories();
loadTasks();

function setupTaskForm() {
  formElement.addEventListener("submit", async (e) => {
    e.preventDefault();
    const description = descriptionInput.value.trim();
    if (description.length !== 0) {
      const result = await createTask(
        {
          description,
          deadline: deadlineInput.value,
          done: false,
        },
        categorySelect.value,
      );

      if(result !== null) {
        const newTask = result.data
        //const option  = document.querySelector(`option[value=${categorySelect.value}]`) as HTMLOptionElement
        //const option = document.querySelector('#mySelect option:checked')
        const option = categorySelect.options[categorySelect.selectedIndex]
        newTask.category = {
          description: option.textContent,
          documentId: categorySelect.value,
        }
        taskList.appendChild(createTaskElement(newTask))
      }
      descriptionInput.value = "";
      submitButton.disabled = true;
    }
  });

  descriptionInput.addEventListener("input", () => {
    submitButton.disabled = descriptionInput.value.trim().length === 0;
  });
}

async function loadCategories(): Promise<void> {
  const result = await fetchCollection<Category>("/categories");
  const categories = result?.data;
  if (categories) {
    for (let category of categories) {
      const option = createCategoryOption(
        category.description,
        category.documentId,
      );
      categorySelect.appendChild(option);
    }
  } else {
    window.alert("Erro ao carregar categorias");
  }
}

async function loadTasks(): Promise<void> {
  const result = await fetchCollection<Task>("/tasks?populate=category");
  const tasks = result?.data;
  if (tasks) {
    for (let task of tasks) {
      const newTask = createTaskElement(task);
      taskList.appendChild(newTask);
    }
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



function createTaskElement(task : Task): HTMLLIElement {
  const listItem = document.createElement("li");
  listItem.id = task.documentId

  const taskId = `task-${task.documentId}`;
  const taskCheckbox = createTaskCheckbox(taskId);
  taskCheckbox.checked = task.done;
  taskCheckbox.addEventListener("change", async () => {
    const result = await updateTask({ ...task, done: taskCheckbox.checked })
    if (result) {
      task.done = result.data.done
    } else {
      taskCheckbox.checked = task.done // desfaz se o backend recusar
    }
  })

  const descriptionLabel = document.createElement("label");
  descriptionLabel.setAttribute("for", taskId);
  descriptionLabel.textContent = task.description;

  const categorySpan = document.createElement("span");
  categorySpan.classList.add("category");
  categorySpan.classList.add(task.category.description.toLocaleLowerCase());
  categorySpan.textContent = task.category.description;

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
    editing = false
    editButton.textContent = "✏️";
    editButton.setAttribute("aria-label", "Editar tarefa");
    descriptionLabel.setAttribute("for", taskId);
    descriptionLabel.contentEditable = "false";
    descriptionLabel.textContent = task.description; // volta ao último texto salvo
  }

  async function saveEditing() {
    const result = await updateTask({ ...task, description: descriptionLabel.textContent.trim() })
    if(result) {
      task.description = result.data.description
      descriptionLabel.textContent = result.data.description
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
