const listaUl = document.querySelector("ul") as HTMLUListElement;
const formElement = document.querySelector("form") as HTMLFormElement;
const categorySelect = document.querySelector("select") as HTMLSelectElement;
const descInput = document.getElementById("descricao") as HTMLInputElement;
const prazoInput = document.getElementById("prazo") as HTMLInputElement;
const submitButton = document.querySelector("[type=submit]") as HTMLInputElement;

let countTask = 0;

formElement.addEventListener("submit", (e) => {
  e.preventDefault();
  createTask(categorySelect.value, descInput.value, prazoInput.value);
  descInput.value = "";
});

descInput.addEventListener("input", () => {
  submitButton.disabled = descInput.value.trim().length == 0;
});

function createTask(categoria: string, descricao: string, prazo: string) {
  const listItem = document.createElement("li");

  const taskId = `task-${++countTask}`;
  const taskCheckbox = createCheckbox(taskId);

  const descricaoLabel = document.createElement("label");
  descricaoLabel.setAttribute("for", taskId);
  descricaoLabel.textContent = descricao;

  const categoriaSpan = document.createElement("span");
  categoriaSpan.classList.add("categoria");
  categoriaSpan.classList.add(categoria.toLocaleLowerCase());
  categoriaSpan.textContent = categoria;

  const deleteButton = createDeleteButton();
  const editButton = createEditButton(descricaoLabel);

  listItem.appendChild(taskCheckbox);
  listItem.appendChild(descricaoLabel);
  listItem.appendChild(categoriaSpan);

  if (prazo) {
    const prazoTime = document.createElement("time");
    prazoTime.className = "prazo";
    prazoTime.dateTime = prazo;
    prazoTime.textContent = formatarData(prazo);
    listItem.appendChild(prazoTime);
  }

  listItem.appendChild(deleteButton);
  listItem.appendChild(editButton);
  listaUl.appendChild(listItem);
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

function createDeleteButton() {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "🗑️";
  deleteButton.className = "float-right";
  deleteButton.addEventListener("click", (e) => {
    if(e.target instanceof HTMLElement) {
      e.target.parentElement?.remove()
    }
  });

  return deleteButton;
}

function createEditButton(descricaoLabel: HTMLLabelElement) {
  const editButton = document.createElement("button");
  editButton.textContent = "✏️";
  editButton.className = "float-right";
  let editing = false;
  const taskId = descricaoLabel.getAttribute('for')

  function startEditing() {
    editing = true;
    editButton.textContent = "💾";
    descricaoLabel.removeAttribute('for');
    descricaoLabel.contentEditable = "true";
    descricaoLabel.focus();
  }

  function stopEditing() {
    editing = false;
    editButton.textContent = "✏️";
    if(taskId) {
      descricaoLabel.setAttribute('for', taskId);
    }
    descricaoLabel.contentEditable = "false";
  }

  editButton.addEventListener("mousedown", (e) => e.preventDefault());

  editButton.addEventListener("click", () => {
    if (editing) {
      stopEditing();
    } else {
      startEditing();
    }
  });

  descricaoLabel.addEventListener('blur', () => {
    if (editing) stopEditing();
  });

  return editButton;
}
