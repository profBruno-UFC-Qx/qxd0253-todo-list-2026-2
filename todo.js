const listaUl = document.querySelector("ul");
const formElement = document.querySelector("form");
const categorySelect = document.querySelector("select");
const descInput = document.getElementById("descricao");
const prazoInput = document.getElementById("prazo");
const submitButton = document.querySelector("[type=submit]");

let countTask = 0;

formElement.addEventListener("submit", (e) => {
  e.preventDefault();
  createTask(categorySelect.value, descInput.value, prazoInput.value);
  descInput.value = "";
});

descInput.addEventListener("input", () => {
  submitButton.disabled = descInput.value.trim().length == 0;
});

function createTask(categoria, descricao, prazo) {
  const listItem = document.createElement("li");

  const taskId = `task-${++countTask}`;
  const taskCheckbox = createCheckbox(taskId);

  const descricaoLabel = document.createElement("label");
  descricaoLabel.setAttribute("for", taskId);
  descricaoLabel.textContent = descricao;

  const deleteButton = createDeleteButton();
  const editButton = createEditButton(descricaoLabel);

  listItem.appendChild(taskCheckbox);
  listItem.appendChild(descricaoLabel);
  listItem.appendChild(deleteButton);
  listItem.appendChild(editButton);
  listaUl.appendChild(listItem);
}

function createCheckbox(taskId) {
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
    e.target.parentNode.remove();
  });

  return deleteButton;
}

function createEditButton(descricaoLabel) {
  const editButton = document.createElement("button");
  editButton.textContent = "✏️";
  editButton.className = "float-right";
  let editing = false;
  const taskId = descricaoLabel.getAttribute('for')

  function startEditing() {
    editing = true;
    editButton.textContent = "💾";
    descricaoLabel.removeAttribute('for');
    descricaoLabel.contentEditable = true;
    descricaoLabel.focus();
  }

  function stopEditing() {
    editing = false;
    editButton.textContent = "✏️";
    descricaoLabel.setAttribute('for', taskId);
    descricaoLabel.contentEditable = false;
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
