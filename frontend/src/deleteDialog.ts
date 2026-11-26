import type { Task } from "./types";
import * as taskService from "./services/taskService";
import { confirmButton, deleteDialog, taskToDeleteSpan } from "./dom";
import { showError } from "./feedback";

let taskToDeleteId: string = ""

export function setupDeleteDialog() {
  confirmButton.addEventListener('click', async() => {
    const result = await taskService.remove(taskToDeleteId)
    if (result.success) {
      document.getElementById(taskToDeleteId)?.remove()
    } else {
      showError(`Erro ao excluir tarefa: ${result.error.message}`)
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
  deleteDialog.showModal()
}
