import type { Category, Task } from "./types";
import { getAll, createTask, deleteTask, updateTask } from "./api";

const listaUl = document.querySelector("ul") as HTMLUListElement;
const formElement = document.querySelector("form") as HTMLFormElement;
const categorySelect = document.querySelector("select") as HTMLSelectElement;
const descInput = document.getElementById("descricao") as HTMLInputElement;
const prazoInput = document.getElementById("prazo") as HTMLInputElement;
const submitButton = document.querySelector(
  "[type=submit]",
) as HTMLInputElement;
const deleteDialog = document.getElementById('deleteDialog') as HTMLDialogElement
const confirmButton = document.getElementById('confirmButton') as HTMLButtonElement
const taskToDeleteSpan = document.getElementById('toDelete') as HTMLSpanElement
let taskToDeleteId: string = ""

initializeCategories();
initializeTasks();

formElement.addEventListener("submit", async (e) => {
  e.preventDefault();
  const descricao = descInput.value.trim();
  if (descricao.length !== 0) {
    const result = await createTask(
      {
        description: descricao,
        deadline: prazoInput.value,
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
      listaUl.appendChild(createTaskElement(newTask))
    }
    descInput.value = "";
    submitButton.disabled = true;
  }
});

descInput.addEventListener("input", () => {
  submitButton.disabled = descInput.value.trim().length === 0;
});

async function initializeCategories(): Promise<void> {
  const result = await getAll<Category>("/categories");
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

async function initializeTasks(): Promise<void> {
  const result = await getAll<Task>("/tasks?populate=category");
  const tasks = result?.data;
  if (tasks) {
    for (let task of tasks) {
      const newTask = createTaskElement(task);
      listaUl.appendChild(newTask);
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
  const taskCheckbox = createCheckbox(taskId);
  taskCheckbox.checked = task.done;
  taskCheckbox.addEventListener("change", async () => {
    const result = await updateTask({ ...task, done: taskCheckbox.checked })
    if (result) {
      task.done = result.data.done
    } else {
      taskCheckbox.checked = task.done // desfaz se o backend recusar
    }
  })

  const descricaoLabel = document.createElement("label");
  descricaoLabel.setAttribute("for", taskId);
  descricaoLabel.textContent = task.description;

  const categoriaSpan = document.createElement("span");
  categoriaSpan.classList.add("categoria");
  categoriaSpan.classList.add(task.category.description.toLocaleLowerCase());
  categoriaSpan.textContent = task.category.description;

  const deleteButton = createDeleteButton(task);
  const editButton = createEditButton(task, descricaoLabel);

  listItem.appendChild(taskCheckbox);
  listItem.appendChild(descricaoLabel);
  listItem.appendChild(categoriaSpan);

  if (task.deadline) {
    const prazoTime = document.createElement("time");
    prazoTime.className = "prazo";
    prazoTime.dateTime = task.deadline;
    prazoTime.textContent = formatarData(task.deadline);
    listItem.appendChild(prazoTime);
  }

  const acoes = document.createElement("span");
  acoes.className = "acoes";
  acoes.appendChild(editButton);
  acoes.appendChild(deleteButton);

  listItem.appendChild(acoes);

  return listItem;
}

function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function createCheckbox(taskId: string) {
  const taskCheckbox = document.createElement("input");
  taskCheckbox.type = "checkbox";
  taskCheckbox.id = taskId;

  return taskCheckbox;
}

function createDeleteButton(task: Task) {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "🗑️";
  deleteButton.setAttribute("aria-label", "Excluir tarefa");
  deleteButton.addEventListener("click",  () => {
     showDialog(task)
  });

  return deleteButton;
}

function createEditButton(task: Task, descricaoLabel: HTMLLabelElement) {
  const editButton = document.createElement("button");
  editButton.textContent = "✏️";
  editButton.setAttribute("aria-label", "Editar tarefa");
  let editing = false;
  const taskId = task.documentId;

  function startEditing() {
    editing = true;
    editButton.textContent = "💾";
    editButton.setAttribute("aria-label", "Salvar edição");
    descricaoLabel.removeAttribute("for");
    descricaoLabel.contentEditable = "plaintext-only";
    descricaoLabel.focus();
  }

  function stopEditing() {
    editing = false
    editButton.textContent = "✏️";
    editButton.setAttribute("aria-label", "Editar tarefa");
    if (taskId) {
      descricaoLabel.setAttribute("for", taskId);
    }
    descricaoLabel.contentEditable = "false";
    descricaoLabel.textContent = task.description; // volta ao último texto salvo
  }

  editButton.addEventListener("mousedown", (e) => e.preventDefault());

  editButton.addEventListener("click", async () => {
    if (editing) {
      const result = await updateTask({ ...task, description: descricaoLabel.textContent.trim() })
      if(result) {
        task.description = result.data.description
        descricaoLabel.textContent = result.data.description
      }
    } else {
      startEditing();
    }
  });

  descricaoLabel.addEventListener("keydown", async (e) => {
    if (!editing) return;
    if (e.key === "Enter") {
      e.preventDefault(); // não insere quebra de linha
      const result = await updateTask({ ...task, description: descricaoLabel.textContent.trim() })
      if(result) {
        task.description = result.data.description
        descricaoLabel.textContent = result.data.description
      }
      stopEditing();
    } else if (e.key === "Escape") {
      stopEditing();
    }
  });

  descricaoLabel.addEventListener("blur", () => {
    if (editing) stopEditing();
  });

  return editButton;
}


function showDialog(task: Task) {
  taskToDeleteId = task.documentId
  taskToDeleteSpan.textContent = task.description
  deleteDialog.show()
}

confirmButton.addEventListener('click', async() => {
  const result = await deleteTask(taskToDeleteId)
  if(result) {
    document.getElementById(taskToDeleteId)?.remove()
  }
  deleteDialog.close()
})
