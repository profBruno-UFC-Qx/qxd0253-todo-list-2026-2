const listaUl = document.querySelector("ul") as HTMLUListElement;
const formElement = document.querySelector("form") as HTMLFormElement;
const categorySelect = document.querySelector("select") as HTMLSelectElement;
const descInput = document.getElementById("descricao") as HTMLInputElement;
const prazoInput = document.getElementById("prazo") as HTMLInputElement;
const submitButton = document.querySelector("[type=submit]") as HTMLInputElement;

let countTask = 0;

formElement.addEventListener("submit", (e) => {
  e.preventDefault();
  const descricao = descInput.value.trim();
  if (descricao.length !== 0) {
    createTask(categorySelect.value, descricao, prazoInput.value);
    descInput.value = "";
    submitButton.disabled = true;  
  }

});

descInput.addEventListener("input", () => {
  submitButton.disabled = descInput.value.trim().length === 0;
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

  const deleteButton = createDeleteButton(listItem);
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

function createDeleteButton(listItem: HTMLLIElement) {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "🗑️";
  deleteButton.className = "float-right";
  deleteButton.addEventListener("click", () => listItem.remove());

  return deleteButton;
}

function createEditButton(descricaoLabel: HTMLLabelElement) {
  const editButton = document.createElement("button");
  editButton.textContent = "✏️";
  editButton.className = "float-right";
  let editing = false;
  let textoOriginal = "";
  const taskId = descricaoLabel.getAttribute('for')

  function startEditing() {
    editing = true;
    textoOriginal = descricaoLabel.textContent ?? "";
    editButton.textContent = "💾";
    descricaoLabel.removeAttribute('for');
    descricaoLabel.contentEditable = "plaintext-only";
    descricaoLabel.focus();
  }

  function stopEditing(salvar: boolean) {
    editing = false;
    const novoTexto = (descricaoLabel.textContent ?? "").trim();
    descricaoLabel.textContent = salvar && novoTexto.length > 0 ? novoTexto : textoOriginal;

    editButton.textContent = "✏️";
    if(taskId) {
      descricaoLabel.setAttribute('for', taskId);
    }
    descricaoLabel.contentEditable = "false";
  }

  editButton.addEventListener("mousedown", (e) => e.preventDefault());

  editButton.addEventListener("click", () => {
    if (editing) {
      stopEditing(true);
    } else {
      startEditing();
    }
  });

  descricaoLabel.addEventListener('keydown', (e) => {
    if (!editing) return;
    if (e.key === "Enter") {
      e.preventDefault(); // não insere quebra de linha
      stopEditing(true);
    } else if (e.key === "Escape") {
      stopEditing(false);
    }
  });

  descricaoLabel.addEventListener('blur', () => {
    if (editing) stopEditing(true);
  });

  return editButton;
}
