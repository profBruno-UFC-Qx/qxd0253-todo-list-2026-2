import type { Task } from "./types";
import { deleteTask } from "./api";
import { confirmButton, deleteDialog, taskToDeleteSpan } from "./dom";

let taskToDeleteId: string = ""

export function setupDeleteDialog() {
  confirmButton.addEventListener('click', async() => {
    const result = await deleteTask(taskToDeleteId)
    if(result) {
      document.getElementById(taskToDeleteId)?.remove()
    }
    deleteDialog.close()
  })
}

export function createDeleteButton(task: Task) {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "🗑️";
  deleteButton.setAttribute("aria-label", "Excluir tarefa");
  deleteButton.addEventListener("click",  () => {
     openDeleteDialog(task)
  });

  return deleteButton;
}

function openDeleteDialog(task: Task) {
  taskToDeleteId = task.documentId
  taskToDeleteSpan.textContent = task.description
  deleteDialog.show()
}
