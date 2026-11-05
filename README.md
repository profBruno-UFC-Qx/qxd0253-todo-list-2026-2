# Minha Todo List — manipulação do DOM com JavaScript puro, sem framework

Este repositório é material de apoio da disciplina de Fundamentos de Programação
para Web (QXD). Ele é pensado para quem está dando os primeiros passos em
JavaScript no navegador: com três arquivos (`index.html`, `todo.css` e
`todo.js`) e nenhuma biblioteca, o código mostra como capturar eventos de
formulário, criar elementos dinamicamente, ligar `label` e `input` pela
semântica do HTML e deixar o CSS reagir ao estado da página sem uma linha
extra de JavaScript.

---

## 🛠️ Conceitos de DOM Explorados

Os conceitos estão na ordem em que vale a pena estudá-los: do formulário que
recebe a tarefa até a edição de uma tarefa já criada.

### 1. Referências ao DOM obtidas uma única vez

Todo elemento que o script manipula é buscado logo no topo de `todo.js` e
guardado numa constante.

```javascript
const listaUl = document.querySelector("ul");
const formElement = document.querySelector("form");
const categorySelect = document.querySelector("select");
const descInput = document.getElementById("descricao");
const prazoInput = document.getElementById("prazo");
const submitButton = document.querySelector("[type=submit]");
```

**Por que essa decisão?**
* Buscar o elemento dentro de cada função que o usa (`document.querySelector`
  a cada clique) repete o trabalho de percorrer a árvore e espalha seletores
  pelo código. Concentrados no topo, eles funcionam como o "contrato" entre o
  script e o HTML: se o HTML mudar, só esse bloco precisa ser revisto.
* `const` deixa claro que a *referência* nunca muda — o que muda é o conteúdo
  do elemento.
* O seletor de atributo `[type=submit]` mostra que `querySelector` aceita
  qualquer seletor CSS, não só tag, classe ou id.
* O `<script>` fica no fim do `<body>`, então quando essas linhas rodam os
  elementos já existem — sem isso, todas as constantes seriam `null`.

### 2. Ouvir o `submit` do formulário, não o clique do botão

A tarefa é criada no evento `submit`, e `preventDefault()` impede o envio
padrão do formulário.

```javascript
formElement.addEventListener("submit", (e) => {
  e.preventDefault();
  createTask(categorySelect.value, descInput.value, prazoInput.value);
  descInput.value = "";
});
```

**Por que essa decisão?**
* A alternativa óbvia — um `click` no botão — perde o que o navegador já dá de
  graça: apertar **Enter** dentro do campo também dispara `submit`, e a
  validação nativa (`required` no campo de descrição) roda antes do evento.
* Sem `preventDefault()`, o navegador recarregaria a página (o comportamento
  padrão de um `<form>` é enviar os dados e navegar) e a lista recém-criada
  sumiria.
* Limpar `descInput.value` depois de criar a tarefa devolve o formulário
  pronto para a próxima entrada.

### 3. Botão habilitado pelo evento `input`

O botão de envio nasce `disabled` no HTML e só é liberado quando há texto de
verdade no campo.

```html
<input type="submit" disabled>
```

```javascript
descInput.addEventListener("input", () => {
  submitButton.disabled = descInput.value.trim().length == 0;
});
```

**Por que essa decisão?**
* O evento `input` dispara a cada caractere digitado, colado ou apagado — ao
  contrário de `change`, que só dispara quando o campo perde o foco. O retorno
  ao usuário é imediato.
* `trim()` cobre o caso que `required` sozinho não cobre: uma descrição feita
  só de espaços é "preenchida" para o HTML, mas vazia para quem lê a lista.
* Atribuir o resultado da comparação direto a `disabled` evita um
  `if/else` que só existiria para escrever `true` ou `false`.

### 4. Elementos criados com `createElement` e `textContent`

Cada tarefa é montada peça por peça e só no fim é anexada à lista.

```javascript
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
```

**Por que essa decisão?**
* O atalho tentador é `listaUl.innerHTML += "<li>..." + descricao + "</li>"`.
  Com `innerHTML`, o que o usuário digita é interpretado como HTML: uma
  descrição como `<img src=x onerror=alert(1)>` executaria código. Com
  `textContent`, o texto é sempre só texto.
* `innerHTML +=` também reconstrói a lista inteira a cada tarefa nova,
  descartando os *event listeners* das tarefas anteriores. Com
  `createElement`, cada elemento é um objeto que guarda seus próprios
  listeners — é isso que permite os botões de cada item funcionarem.
* O `<li>` é montado completo antes de ir para a página, então o navegador
  insere a tarefa na tela de uma vez.

### 5. Ids únicos para ligar `label` e `checkbox`

Um contador global gera um id diferente para cada tarefa, e o `label` aponta
para ele com `for`.

```javascript
let countTask = 0;
```

```javascript
function createCheckbox(taskId) {
  const taskCheckbox = document.createElement("input");
  taskCheckbox.type = "checkbox";
  taskCheckbox.id = taskId;

  return taskCheckbox;
}
```

**Por que essa decisão?**
* Com `for` apontando para o id do checkbox, clicar no **texto** da tarefa
  marca a caixa. A área clicável fica muito maior, e leitores de tela anunciam
  o texto como o nome do checkbox — sem nenhum JavaScript para isso.
* O id precisa ser único na página; se todas as tarefas usassem o mesmo id,
  todo `label` marcaria o primeiro checkbox. O pré-incremento `++countTask`
  garante `task-1`, `task-2`… mesmo depois de tarefas serem apagadas, porque o
  contador nunca volta.

### 6. Estado visual com o seletor `:checked + label`

Riscar uma tarefa concluída é responsabilidade do CSS, não do JavaScript.

```css
:checked + label{
    text-decoration: line-through;
}
```

**Por que essa decisão?**
* A alternativa seria um listener de `change` em cada checkbox adicionando e
  removendo uma classe no `label`. Aqui o estado já está no DOM (o checkbox
  sabe se está marcado), e a pseudo-classe `:checked` combinada com o
  combinador de irmão adjacente `+` faz o resto.
* Isso só funciona porque `createTask` anexa o `label` **imediatamente depois**
  do checkbox — a ordem do `appendChild` é parte do contrato com o CSS.

### 7. Funções fábrica para os botões de cada tarefa

Cada botão é criado por uma função própria que já o devolve com estilo e
comportamento.

```javascript
function createDeleteButton() {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "🗑️";
  deleteButton.className = "float-right";
  deleteButton.addEventListener("click", (e) => {
    e.target.parentNode.remove();
  });

  return deleteButton;
}
```

```css
.float-right {
  float: right;
}
```

**Por que essa decisão?**
* Separar `createCheckbox`, `createDeleteButton` e `createEditButton` deixa
  `createTask` legível como uma receita: cria as peças, junta, anexa.
* O botão de apagar não precisa saber *qual* tarefa remove: ele sobe da origem
  do evento (`e.target`) até o pai (`parentNode`, o `<li>`) e chama
  `remove()`. Não há array paralelo de tarefas para manter sincronizado com a
  tela.
* A aparência fica numa classe CSS (`float-right`) em vez de
  `deleteButton.style.float = "right"`: o estilo continua no arquivo de estilo
  e pode ser reaproveitado pelos dois botões.

### 8. Edição no lugar com `contentEditable` e closure

O botão de editar transforma o próprio `label` num campo editável. Começar e
terminar a edição são duas funções nomeadas, chamadas tanto pelo botão quanto
pela saída do campo.

```javascript
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

  // Impede que o clique no botão tire o foco do label: sem isso, o blur
  // encerraria a edição antes do click, e o click a reabriria.
  editButton.addEventListener("mousedown", (e) => e.preventDefault());

  editButton.addEventListener("click", () => {
    if (editing) {
      stopEditing();
    } else {
      startEditing();
    }
  });

  // Registrado uma única vez: sair do campo (clicar fora, Tab) também salva.
  descricaoLabel.addEventListener('blur', () => {
    if (editing) stopEditing();
  });

  return editButton;
}
```

**Por que essa decisão?**
* `contentEditable` evita trocar o `label` por um `<input>` e depois trocar de
  volta: o texto é editado onde ele já está, e o `textContent` atualizado é o
  próprio valor salvo.
* Enquanto edita, o atributo `for` é removido. Sem isso, cada clique para
  posicionar o cursor no texto também marcaria e desmarcaria o checkbox — a
  ligação do conceito 5 vira um obstáculo. Ao salvar, `for` volta com o
  `taskId` guardado antes.
* `startEditing` e `stopEditing` concentram cada transição num lugar só. A
  versão anterior repetia parte do "sair da edição" dentro do `blur`, só
  trocando o ícone: clicar fora deixava o `label` editável, sem `for`, com
  `editing` ainda `true` — tela e estado dessincronizados.
* O listener de `blur` é registrado **uma vez**, na criação do botão. Dentro
  do `click`, um novo listener seria empilhado a cada edição.
* O `mousedown` com `preventDefault()` resolve a ordem dos eventos: ao clicar
  num botão, o navegador dispara `mousedown` → `blur` do campo → `click`. Sem
  impedir a troca de foco, o `blur` salvaria e o `click` seguinte reabriria a
  edição.
* `editing` e `taskId` são variáveis locais da função, capturadas pelos
  listeners (uma *closure*). Cada tarefa tem o seu próprio `editing`, sem um
  objeto global indexado por id.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** estrutura do formulário e validação nativa (`required`,
  `type="date"`, `disabled`).
* **CSS3:** reação ao estado do checkbox com `:checked + label` e
  posicionamento dos botões.
* **JavaScript (ES6+):** manipulação do DOM, eventos, template literals,
  arrow functions e closures — sem bibliotecas.

---

## ▶️ Como executar

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd todoList2026-2
   ```
2. Abra o `index.html` diretamente no navegador, **ou** use a extensão
   *Live Server* do VS Code para recarregar a página a cada alteração.

Não há dependências nem etapa de build.

---

## 📖 Como usar este repositório para estudo

* **Abra o DevTools** (aba *Elements*) enquanto cria tarefas e observe cada
  `<li>` aparecer com seu `input`, `label` e botões, na ordem do
  `appendChild`.
* **Troque `textContent` por `innerHTML`** em `createTask` e cadastre a
  descrição `<b>teste</b>`. Veja a diferença e pense no que aconteceria com um
  `<script>` ou um `onerror`.
* **Inverta a ordem** dos `appendChild` do checkbox e do label e veja o
  `:checked + label` parar de funcionar.
* **Repare nos parâmetros `categoria` e `prazo`** de `createTask`: eles chegam
  do formulário, mas ainda não aparecem na tarefa. Exiba-os no `<li>`.
* **Investigue a ordem dos eventos:** comente a linha do `mousedown` em
  `createEditButton`, comece a editar uma tarefa e clique em 💾. Coloque um
  `console.log` no `blur` e no `click` para ver por que a edição reabre.

---
Desenvolvido por [Bruno Mateus](https://github.com/brunomateus) para fins didáticos.
