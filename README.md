# Minha Todo List — do DOM com JavaScript puro a um frontend TypeScript que conversa com uma API REST

Este repositório é material de apoio da disciplina de Fundamentos de Programação
para Web (QXD). Ele é pensado para quem está dando os primeiros passos com o
navegador: a primeira versão tem três arquivos (`index.html`, `todo.css` e
`todo.js`) e nenhuma biblioteca, e mostra como capturar eventos de formulário,
criar elementos dinamicamente e deixar o CSS reagir ao estado da página. Os
commits seguintes levam o mesmo código para TypeScript com Vite e passam por
uma revisão: cada um corrige um problema concreto. Ler o histórico em ordem
ensina tanto a manipular o DOM quanto a reconhecer, no próprio código, o que
pode dar errado. Na parte final, as tarefas deixam de viver só na página: um
backend em Strapi passa a guardá-las, e o frontend aprende a ler, criar,
editar e excluir dados por HTTP, até ser dividido em módulos.

---

## 🏗️ Evolução da Arquitetura

O projeto parte de um CRUD em JavaScript puro, aberto direto no navegador, e
chega a um frontend TypeScript em modo estrito, dividido em módulos, que lê e
grava as tarefas numa API REST servida pelo Strapi.

Cada estágio abaixo tem uma tag no git: `v1.0` é a versão em JavaScript
puro, `v2.0` a migração para TypeScript, as versões `v2.x` seguintes são
as melhorias, e as versões `v3.x` são a integração com o backend. Para ver o
que mudou de um estágio para o outro, use `git diff`, por exemplo
`git diff v2.0 v2.1` ou `git diff v2.4 v3.0`.

### 1. Manipulação do DOM com JavaScript puro

*Versão `v1.0`. Trechos de `todo.js`, `todo.css` e `index.html` nessa versão.*

A base de tudo: um formulário que cria tarefas, cada uma com checkbox, texto e
botões de excluir e editar. Os conceitos estão na ordem em que vale a pena
estudá-los, do formulário que recebe a tarefa até a edição de uma tarefa já
criada.

#### 1.1 Referências ao DOM obtidas uma única vez

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

```html
<script src="todo.js" defer></script>
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
* O `<script>` está no `<head>`, mas com `defer`: o navegador baixa o arquivo
  em paralelo e só o executa depois de ler o HTML inteiro. Sem `defer`, essas
  linhas rodariam antes de o `<body>` existir, e todas as constantes seriam
  `null`.

#### 1.2 Ouvir o `submit` do formulário, não o clique do botão

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

#### 1.3 Botão habilitado pelo evento `input`

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

#### 1.4 Elementos criados com `createElement` e `textContent`

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

#### 1.5 Ids únicos para ligar `label` e `checkbox`

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

#### 1.6 Estado visual com o seletor `:checked + label`

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

#### 1.7 Funções fábrica para os botões de cada tarefa

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
  tela. (O estágio 5 mostra o preço dessa escolha e a troca por algo mais
  robusto.)
* A aparência fica numa classe CSS (`float-right`) em vez de
  `deleteButton.style.float = "right"`: o estilo continua no arquivo de estilo
  e pode ser reaproveitado pelos dois botões.

#### 1.8 Edição no lugar com `contentEditable` e closure

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
```

**Por que essa decisão?**
* `contentEditable` evita trocar o `label` por um `<input>` e depois trocar de
  volta: o texto é editado onde ele já está, e o `textContent` atualizado é o
  próprio valor salvo.
* Enquanto edita, o atributo `for` é removido. Sem isso, cada clique para
  posicionar o cursor no texto também marcaria e desmarcaria o checkbox — a
  ligação do conceito 1.5 vira um obstáculo. Ao salvar, `for` volta com o
  `taskId` guardado antes.
* `startEditing` e `stopEditing` concentram cada transição num lugar só. Se o
  `blur` tivesse sua própria versão de "sair da edição" (por exemplo, só
  trocando o ícone), clicar fora deixaria o `label` editável, sem `for`, com
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

### 2. Tipagem do DOM com TypeScript e Vite

*Versão `v2.0`. `todo.js` vira `src/todo.ts`, e `todo.css` vai para `src/assets/`.*

O navegador não executa TypeScript, então o projeto ganha o Vite, que serve o
`.ts` em desenvolvimento e gera o JavaScript final no build. O código quase não
muda: a lição está nos poucos lugares em que o compilador obrigou a ser
explícito.

```typescript
const listaUl = document.querySelector("ul") as HTMLUListElement;
const formElement = document.querySelector("form") as HTMLFormElement;
const categorySelect = document.querySelector("select") as HTMLSelectElement;
const descInput = document.getElementById("descricao") as HTMLInputElement;
const prazoInput = document.getElementById("prazo") as HTMLInputElement;
const submitButton = document.querySelector("[type=submit]") as HTMLInputElement;
```

```typescript
  deleteButton.addEventListener("click", (e) => {
    if(e.target instanceof HTMLElement) {
      e.target.parentElement?.remove()
    }
  });
```

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
```

```json
    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
```

**Por que essa decisão?**
* `getElementById` devolve `HTMLElement | null`: o TypeScript não sabe que
  `#descricao` é um `<input>`, nem que ele existe. Sem o `as HTMLInputElement`,
  `descInput.value` nem compila. O `as` é uma *promessa* do programador, não
  uma verificação: se o HTML mudar, o erro só aparece em tempo de execução.
  Por isso as buscas continuam concentradas no topo (conceito 1.1), num lugar
  só para conferir.
* Em `e.target`, a promessa não serviria: o tipo é `EventTarget | null`, e o
  alvo do clique depende de onde o usuário clicou. `instanceof HTMLElement` é
  uma verificação real, feita em tempo de execução, e dentro do `if` o
  TypeScript passa a tratar `e.target` como `HTMLElement` (*narrowing*).
* Os outros ajustes saem do mesmo raciocínio: `contentEditable` é uma string
  (`"true"`, não `true`), e `getAttribute('for')` pode devolver `null`, por
  isso `stopEditing` passa a testar `if(taskId)` antes de restaurar o `for`.
* O Vite só remove os tipos, não os verifica. Por isso o `build` roda `tsc`
  antes (com `"noEmit": true`, ele só checa). Se a checagem falha, o build
  para. O `npm run dev` continua funcionando mesmo com erro de tipo.
* `noUnusedParameters` transforma em erro algo que o JavaScript aceitava em
  silêncio: `createTask` recebia `categoria` e `prazo` e não usava nenhum dos
  dois. Nesta versão o `npm run build` falha por isso, e o estágio 3 resolve.

### 3. Categoria e prazo na tarefa

*Versão `v2.1`. Trechos de `src/todo.ts` e `src/assets/todo.css`.*

Os dois parâmetros que o compilador apontou como ignorados passam a aparecer
na tarefa.

```typescript
  const categoriaSpan = document.createElement("span");
  categoriaSpan.classList.add("categoria");
  categoriaSpan.classList.add(categoria.toLocaleLowerCase());
  categoriaSpan.textContent = categoria;
```

```typescript
  if (prazo) {
    const prazoTime = document.createElement("time");
    prazoTime.className = "prazo";
    prazoTime.dateTime = prazo;
    prazoTime.textContent = formatarData(prazo);
    listItem.appendChild(prazoTime);
  }
```

```typescript
function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}
```

```css
.lazer {
  background-color: cornflowerblue;
  color: white;
}
```

**Por que essa decisão?**
* A categoria vira uma classe (`lazer`, `estudo`, `trabalho`) e a cor fica no
  CSS. A alternativa — um `if` no TypeScript escolhendo `style.backgroundColor`
  — misturaria aparência com lógica. Isso funciona porque cada categoria é uma
  palavra só: `classList.add` não aceita espaço, então uma categoria como
  "Vida pessoal" lançaria um erro.
* O prazo usa `<time>` com `dateTime`: o texto exibido é `11/11/2026`, mas o
  valor original (`2026-11-11`) continua legível para máquinas, como
  leitores de tela e buscadores.
* `formatarData` só reorganiza o texto. O caminho tentador,
  `new Date(prazo).toLocaleDateString("pt-BR")`, interpreta `"2026-11-11"`
  como meia-noite em UTC. No horário de Brasília (UTC−3) isso ainda é dia 10,
  e a tarefa mostraria o prazo um dia antes.
* `if (prazo)` porque o campo de data não é obrigatório: sem prazo, o `<time>`
  simplesmente não é criado, em vez de aparecer vazio.

### 4. Robustez do envio e da edição

*Versão `v2.2`. Trechos de `src/todo.ts`.*

Dois caminhos ainda deixavam passar dados ruins: o envio guardava espaços nas
pontas da descrição e deixava o botão habilitado, e a edição aceitava texto
vazio e não tinha como desistir.

```typescript
formElement.addEventListener("submit", (e) => {
  e.preventDefault();
  const descricao = descInput.value.trim();
  if (descricao.length !== 0) {
    createTask(categorySelect.value, descricao, prazoInput.value);
    descInput.value = "";
    submitButton.disabled = true;  
  }

});
```

```typescript
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
    // Descrição vazia não é permitida: volta ao texto anterior.
    descricaoLabel.textContent = salvar && novoTexto.length > 0 ? novoTexto : textoOriginal;
```

```typescript
  descricaoLabel.addEventListener('keydown', (e) => {
    if (!editing) return;
    if (e.key === "Enter") {
      e.preventDefault(); // não insere quebra de linha
      stopEditing(true);
    } else if (e.key === "Escape") {
      stopEditing(false);
    }
  });
```

**Por que essa decisão?**
* `submitButton.disabled = true` precisa ser escrito à mão porque mudar
  `descInput.value` pelo código **não** dispara o evento `input`. O listener
  do conceito 1.3 só reage ao que o usuário digita, então, sem essa linha, o
  botão ficava habilitado com o campo vazio.
* O `trim()` no envio aplica a mesma regra que já decidia se o botão fica
  habilitado: o que vale é o texto sem as pontas, e é isso que vai para a
  tarefa.
* `textoOriginal` é uma foto do texto no início da edição. É ela que permite
  o Esc desfazer, e que impede uma descrição vazia: em vez de rejeitar com uma
  mensagem, a tarefa simplesmente volta ao que era.
* `stopEditing(salvar)` mantém uma única saída da edição (conceito 1.8) para
  três gatilhos: botão, `blur` e Enter salvam; Esc descarta. Duas funções
  separadas, "salvar" e "cancelar", repetiriam a restauração do `for` e do
  ícone.
* `"plaintext-only"` em vez de `"true"`: com `"true"`, colar um texto copiado
  de uma página traz junto negrito, links e outros elementos para dentro do
  `label`. O `preventDefault()` no Enter faz o mesmo papel para as quebras de
  linha, que o `contentEditable` inseriria.

### 5. Remoção pela closure, não pela hierarquia

*Versão `v2.3`, que reúne dois commits: a remoção e o `strict`. Trechos de `src/todo.ts` e `tsconfig.json`.*

O botão de excluir deixa de descobrir sua tarefa pela posição no HTML e passa
a recebê-la na criação.

```typescript
function createDeleteButton(listItem: HTMLLIElement) {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "🗑️";
  deleteButton.className = "float-right";
  deleteButton.addEventListener("click", () => listItem.remove());

  return deleteButton;
}
```

```typescript
  const deleteButton = createDeleteButton(listItem);
```

**Por que essa decisão?**
* `e.target.parentElement` significava "apague o pai de quem foi clicado".
  Isso só dava certo enquanto o botão fosse filho direto do `<li>` e o clique
  caísse no próprio botão. Bastaria colocar os botões dentro de um wrapper, ou
  trocar o emoji por um `<img>`, para apagar o elemento errado — e o estágio 6
  faz exatamente a primeira coisa.
* Agora o botão sabe qual tarefa remove, do mesmo jeito que o botão de editar
  já sabia qual `label` editar: a função recebe o elemento e o listener o
  captura (*closure*). Some também o `instanceof`, porque não há mais `e.target`
  para verificar.
* No mesmo commit, `==` vira `===` no listener de `input`. Com `==`, o
  JavaScript converte tipos antes de comparar (`0 == ""` é `true`). Aqui o
  resultado seria o mesmo, mas `===` não deixa essa dúvida para quem lê.

```json
    /* Linting */
    "strict": true,
```

* O `strict` liga as verificações mais rígidas do TypeScript, como proibir
  `any` implícito e exigir tratar `null`. A partir do TypeScript 6 ele já é o
  padrão, então a linha não muda nada com o TypeScript 7 do projeto. Ela fica
  para declarar a intenção para quem lê o `tsconfig.json`, e para manter as
  verificações se alguém compilar com uma versão mais antiga.

### 6. Acessibilidade e layout com flexbox

*Versão `v2.4`. Trechos de `src/todo.ts`, `index.html` e `src/assets/todo.css`.*

Os botões ganham um nome para leitores de tela, o seletor de categoria ganha
um rótulo, e o layout deixa de depender de `float`.

```typescript
  deleteButton.setAttribute("aria-label", "Excluir tarefa");
```

```typescript
    editButton.textContent = "💾";
    editButton.setAttribute("aria-label", "Salvar edição");
```

```html
<html lang="pt-BR">
```

```html
      <label>
        Categoria:
        <select name="categoria" id="categoria">
          <option>Lazer</option>
          <option>Estudo</option>
          <option>Trabalho</option>
        </select>
      </label>
```

```typescript
  const acoes = document.createElement("span");
  acoes.className = "acoes";
  acoes.appendChild(editButton);
  acoes.appendChild(deleteButton);

  listItem.appendChild(acoes);
```

```css
li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.acoes {
  margin-left: auto;
}
```

**Por que essa decisão?**
* Um botão só com emoji tem como nome o próprio emoji. Leitores de tela leem
  algo como "cesto de lixo, botão", ou nada. O `aria-label` dá o nome da
  *ação*, e no botão de editar ele muda junto com o ícone, porque a ação muda.
* Envolver o `<select>` num `<label>` repete o que os campos de descrição e
  prazo já faziam: o texto "Categoria:" vira o nome do campo, e clicar nele
  abre o seletor.
* `lang="pt-BR"` diz ao navegador em que idioma está a página. É o que o
  leitor de tela usa para escolher a pronúncia, e o corretor ortográfico para
  escolher o dicionário. Com `"en"`, o português era lido com sotaque inglês.
* Com `float: right`, o primeiro botão anexado fica mais à direita, então a
  ordem na tela era o inverso da ordem no código. Com flexbox, os elementos
  aparecem na ordem do `appendChild`, e `margin-left: auto` no grupo
  `.acoes` empurra os botões para a direita.
* O botão de excluir agora está dentro de `.acoes`, e não mais direto no
  `<li>`. Com a remoção antiga (`e.target.parentElement`), ele apagaria só o
  grupo de botões. Com a do estágio 5, continua apagando a tarefa.

### 7. Leitura de uma API REST com `fetch` e tipos genéricos

*Versão `v3.0`. Trechos de `src/api.ts`, `src/types.ts`, `src/todo.ts` e `index.html` nessa versão.*

As categorias e as tarefas deixam de estar escritas no código e passam a vir
do backend. O `index.html` perde as três `<option>` fixas, e um módulo novo,
`api.ts`, concentra o acesso à rede.

```typescript
const BASE_URL = "http://localhost:1337/api"

export async function getAll<T>(url: string): Promise<StrapiCollectionResponse<T> | null> {
  try {
    const response = await fetch(`${BASE_URL}${url}`)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error((error as Error).message);
    return null
  }
}
```

```typescript
export type StrapiCollectionResponse<T> = {
  data: T[];
  meta: Pagination;
};
```

```typescript
async function initializeTasks(): Promise<void> {
  const result = await getAll<Task>('/tasks?populate=category')
  const tasks = result?.data
  if(tasks) {
    for(let task of tasks) {
      const newTask = createTask(task)
      listaUl.appendChild(newTask)
    }
  }
} 

function createCategoryOption(description: string, id: string): HTMLOptionElement {
  const newOption = document.createElement('option')
  newOption.textContent = description
  newOption.value = id
  return newOption
}
```

**Por que essa decisão?**
* O Strapi devolve toda coleção no mesmo envelope, `{ data, meta }`. Com o
  tipo genérico `StrapiCollectionResponse<T>`, uma única função `getAll<T>`
  serve para categorias e tarefas, e quem chama escolhe o `T`:
  `getAll<Task>(...)` já devolve `data` tipado como `Task[]`, sem `as`.
* O `fetch` só rejeita a promessa em falha de rede. Um 404 ou um 500 chegam
  como resposta normal, por isso o `if (!response.ok)` transforma esses
  status em erro.
* `getAll` devolve `null` em vez de deixar o erro subir. Quem chama decide o
  que fazer com `result?.data`: as categorias mostram um alerta, as tarefas
  só deixam a lista vazia.
* Sem `?populate=category`, o Strapi devolve a tarefa sem a relação, e
  `category.description` quebraria ao montar a categoria. O `populate` pede
  a categoria junto, numa requisição só.
* O `value` de cada `<option>` passa a ser o `documentId` da categoria, não o
  texto. O texto é para quem lê a tela; o id é o que o backend precisa para
  gravar a relação.
* `createTask` deixa de inserir o `<li>` na lista e passa a devolvê-lo. Quem
  chama decide onde ele entra, e a mesma função serve tanto para as tarefas
  que vêm do servidor quanto para as criadas no formulário.

### 8. Criação e exclusão no backend, identificadas pelo `documentId`

*Versão `v3.1`. Trechos de `src/api.ts`, `src/todo.ts` e `index.html` nessa versão.*

O formulário passa a enviar a tarefa para o servidor com `POST`, e o 🗑️ pede
confirmação num `<dialog>` antes de mandar o `DELETE`.

```typescript
export async function createTask(
  task: Omit<Task, "id" | "documentId" | "category">,
  categoryId: string,
): Promise<StrapiSingleResponse<Task> | null> {
  try {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          description: task.description,
          done: task.done,
          deadline: task.deadline || null,
          category: categoryId
        },
      }),
    });
    if (!response.ok) {
      if (response.status === 400) {
        window.alert((await response.json()).error.message);
      }
      throw new Error(`Response status: ${response.status}`);
    }
```

```typescript
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
```

```typescript
function createTaskElement(task : Task): HTMLLIElement {
  const listItem = document.createElement("li");
  listItem.id = task.documentId

  const taskId = `task-${task.documentId}`;
```

```html
  <dialog id="deleteDialog">
    <header><button commandfor="deleteDialog" command="close">X</button></header>
    <p>Tem certeza que deseja remover a tarefas <strong><span id="toDelete"></span></strong>?</p>
    <footer>
      <button id="confirmButton">Sim</button> <button id="cancelButton" commandfor="deleteDialog" command="close">Não</button>
    </footer>
  </dialog>
```

```typescript
confirmButton.addEventListener('click', async() => {
  const result = await deleteTask(taskToDeleteId)
  if(result) {
    listaUl.querySelector(`#${taskToDeleteId}`)?.remove()
  }
  deleteDialog.close()
})
```

**Por que essa decisão?**
* A tarefa só aparece na lista depois que o servidor confirma
  (`if(result !== null)`), e só some depois que o `DELETE` dá certo. Se a
  tela mudasse antes, uma falha no backend deixaria na página uma tarefa que
  não existe, ou esconderia uma que continua salva.
* O `documentId` do Strapi passa a ser o id
  da tarefa. O contador recomeçava do zero a cada recarga e não tinha relação
  com o servidor. O `documentId` é o mesmo que aparece na URL
  `/tasks/:documentId` do `DELETE`.
* O tipo do que se envia sai do próprio `Task`:
  `Omit<Task, "id" | "documentId" | "category">`. Quem gera os ids é o
  servidor, e a categoria vai à parte, como `categoryId`. Se `Task` ganhar um
  campo, o `createTask` fica sabendo.
* O Strapi espera o corpo dentro de `data`, e responde 400 com uma mensagem
  em `error.message` quando a validação falha (por exemplo, descrição vazia).
  O `window.alert` mostra essa mensagem em vez de engolir o erro.
* A resposta do `POST` não traz a categoria, porque não houve `populate`. Por
  isso o código monta `newTask.category` a partir da `<option>` selecionada.
  As duas linhas comentadas são outras opções para recuperar a informação que precisamos
  `querySelector`; `selectedIndex` chega nela sem seletor CSS.
* No `<dialog>`, `commandfor` e `command="close"` fecham o diálogo sem uma
  linha de JavaScript. Diferente de um `window.confirm`, o diálogo pode ser
  estilizado e mostra a descrição da tarefa que vai ser apagada.

### 9. Edição com `PUT` e checkbox sincronizado com o servidor

*Versão `v3.2`. Trechos de `src/api.ts` e `src/todo.ts` nessa versão.*

O CRUD fica completo: editar a descrição e marcar a tarefa como concluída
passam a ser gravados no backend. O mesmo commit corrige a remoção do
estágio 8.

```typescript
export async function updateTask(
  task: Omit<Task, "category">
): Promise<StrapiSingleResponse<Task> | null> {
  try {
    const response = await fetch(`${BASE_URL}/tasks/${task.documentId}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          description: task.description,
          done: task.done,
          deadline: task.deadline || null,
        },
      }),
    });
```

```typescript
  taskCheckbox.addEventListener("change", async () => {
    const result = await updateTask({ ...task, done: taskCheckbox.checked })
    if (result) {
      task.done = result.data.done
    } else {
      taskCheckbox.checked = task.done // desfaz se o backend recusar
    }
  })
```

```typescript
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
```

```typescript
    document.getElementById(taskToDeleteId)?.remove()
```

**Por que essa decisão?**
* O checkbox muda na tela antes de o servidor responder. Se o `PUT` falhar,
  `taskCheckbox.checked = task.done` desfaz a marcação, e a página volta a
  mostrar o que está salvo. Sem isso, a tarefa pareceria concluída até a
  próxima recarga.
* `{ ...task, done: taskCheckbox.checked }` cria uma cópia com o novo valor.
  O objeto `task` só é atualizado com o que o servidor devolveu
  (`result.data.done`). A edição da descrição segue o mesmo padrão:
  `{ ...task, description: ... }`.
* Com isso, `task.description` guarda sempre o último texto salvo, e o
  `stopEditing()` o devolve ao label. Esc e blur cancelam a edição de
  verdade, e um `PUT` que falha não deixa na tela um texto que não foi
  gravado. Se o código fizesse `task.description = ...` antes do `PUT`, não
  haveria mais como saber qual era o texto salvo.
* Depois de salvar, o label mostra `result.data.description`, o texto que o
  servidor gravou, e não o que foi digitado.
* O `updateTask` aceita `Omit<Task, "category">`: o `PUT` não envia a
  relação, então editar a descrição não mexe na categoria.
* A remoção do estágio 8 usava `querySelector(`#${taskToDeleteId}`)`. Um
  seletor CSS de id não pode começar com dígito, e o `documentId` é gerado ao
  acaso: quando ele começava com número, o `querySelector` lançava
  `SyntaxError`. `getElementById` recebe o id como texto, sem interpretar CSS.
* Repare que, no `click` do 💾, falta o `stopEditing()` que existe no
  caminho do Enter: o texto é salvo, mas o label continua editável. O
  estágio 11 corrige isso.

### 10. Frontend e backend no mesmo repositório

*Versão `v3.3`. Trechos de `backend/src/api/task/` nessa versão.*

O projeto Strapi entra no repositório, e cada lado ganha sua pasta:
`frontend/` com o Vite e `backend/` com o Strapi. Os arquivos do frontend
foram movidos com `git mv`, sem mudar uma linha.

```json
  "attributes": {
    "description": {
      "type": "string",
      "required": true
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "tasks"
    },
    "deadline": {
      "type": "date"
    },
    "done": {
      "type": "boolean",
      "default": false
    }
  }
```

```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::task.task');
```

**Por que essa decisão?**
* O modelo de dados vive em `schema.json`, versionado com o resto do código.
  Quem clona o repositório recebe os mesmos *content-types*. O banco SQLite
  (`.tmp/`) e o `.env` ficam fora do git: um tem dados locais, o outro tem
  segredos.
* `deadline` é `date`, e não `datetime`. O `<input type="date">` produz
  `AAAA-MM-DD`, e `formatarData` divide o texto em `-` esperando exatamente
  isso. Com `datetime`, o Strapi devolvia `2026-11-26T03:00:00.000Z`, e a
  data aparecia como `26T03:00:00.000Z/11/2026`.
* A relação é `manyToOne`: cada tarefa tem uma categoria, e uma categoria tem
  várias tarefas (`inversedBy` aqui, `mappedBy` em `category`).
* O controller, as rotas e o service são uma linha cada, com
  `factories.createCore*`. Só com isso o Strapi cria `GET`, `POST`, `PUT` e
  `DELETE` em `/api/tasks`, as quatro rotas que o frontend usa.
* Com `git mv`, o git registra a mudança de pasta como renomeação, e
  `git log --follow frontend/src/todo.ts` continua mostrando a história desde
  a `v1.0`.

### 11. Modularização do frontend

*Versão `v3.4`. Trechos de `frontend/src/dom.ts`, `frontend/src/deleteDialog.ts` e `frontend/src/todo.ts` nessa versão.*

O `todo.ts` tinha 241 linhas misturando referências ao DOM, formulário, lista,
edição e exclusão. Ele é dividido em módulos, os nomes passam para o inglês e
a edição ganha uma função única para salvar.

```typescript
export const taskList = document.querySelector("ul") as HTMLUListElement;
export const formElement = document.querySelector("form") as HTMLFormElement;
export const categorySelect = document.querySelector("select") as HTMLSelectElement;
export const descriptionInput = document.getElementById("description") as HTMLInputElement;
export const deadlineInput = document.getElementById("deadline") as HTMLInputElement;
```

```typescript
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
```

```typescript
setupTaskForm();
setupDeleteDialog();
loadCategories();
loadTasks();
```

```typescript
  const taskId = `task-${task.documentId}`; // mesmo id do checkbox
```

```typescript
  async function saveEditing() {
    const result = await updateTask({ ...task, description: descriptionLabel.textContent.trim() })
    if(result) {
      task.description = result.data.description
      descriptionLabel.textContent = result.data.description
    }
    stopEditing();
  }
```

**Por que essa decisão?**
* `dom.ts` reúne as referências aos elementos. A lista, o formulário e o
  diálogo usam os mesmos elementos, e nenhum módulo precisa importar outro só
  para chegar num `<ul>`. Se um id do HTML mudar, só um arquivo muda.
* `deleteDialog.ts` junta o estado da exclusão e o código que mexe nele, que
  antes ficavam a 200 linhas de distância. `taskToDeleteId` e
  `openDeleteDialog` não são exportados: nenhum outro módulo consegue alterar
  qual tarefa vai ser apagada.
* Os listeners ficam dentro de `setupTaskForm()` e `setupDeleteDialog()`, em
  vez de soltos no topo do módulo. Importar um arquivo não registra nada
  sozinho, e as quatro linhas do topo de `todo.ts` mostram, em ordem, tudo o
  que acontece quando a página carrega.
* Funções, variáveis, ids e classes passam todos para o inglês. Antes
  conviviam `descricaoLabel` e `categorySelect`, `formatarData` e
  `createTaskElement`. O texto que aparece na tela continua em português,
  como pede o `lang="pt-BR"`.
* `saveEditing()` tira a duplicação entre o `click` do 💾 e o Enter. No
  estágio 9 as duas cópias já tinham divergido: só uma chamava
  `stopEditing()`. Com uma função só, os dois caminhos fazem a mesma coisa.
* O `for` do label precisa apontar para o id do checkbox, que é
  `task-<documentId>`. O `stopEditing` devolvia o `for` com o `documentId`
  sozinho, e depois de editar uma tarefa clicar no texto deixava de marcar o
  checkbox.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** estrutura do formulário, validação nativa (`required`,
  `type="date"`, `disabled`), semântica (`<label>`, `<time>`, `lang`) e
  `<dialog>` aberto e fechado com `commandfor`/`command`.
* **CSS3:** reação ao estado do checkbox com `:checked + label`, cores por
  categoria e alinhamento da tarefa com flexbox.
* **TypeScript 7:** tipos do DOM, *narrowing* com `instanceof` e modo
  estrito, verificados no build.
* **Vite 8:** servidor de desenvolvimento que serve o `.ts` direto e gera o
  JavaScript final em `dist/`.
* **Fetch API:** as requisições `GET`, `POST`, `PUT` e `DELETE` do frontend
  para o backend, com `async`/`await`.
* **Strapi 5:** backend que gera a API REST de tarefas e categorias a partir
  dos *content-types* definidos em `schema.json`.
* **SQLite:** banco local do Strapi, criado em `backend/.tmp/` e fora do git.

---

## ▶️ Como executar

É preciso ter o [Node.js](https://nodejs.org/) instalado (uma versão LTS
recente).

O repositório tem dois projetos independentes, cada um com seu
`package.json`: `frontend/` (Vite + TypeScript) e `backend/` (Strapi 5).

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd todoList2026-2
   ```
2. Suba o backend (em um terminal). Na primeira vez, crie o `.env` a partir
   do exemplo e troque os valores `tobemodified`:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run develop
   ```
   O painel abre em `http://localhost:1337/admin`. Crie o usuário
   administrador, cadastre as categorias (ex.: Lazer, Estudo, Trabalho) e, em
   *Settings → Users & Permissions → Roles → Public*, libere `find` em
   *Category* e `find`, `create`, `update` e `delete` em *Task*.
3. Suba o frontend (em outro terminal) e abra o endereço que ele mostrar
   (normalmente `http://localhost:5173`):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Para verificar os tipos e gerar a versão final em `frontend/dist/`:
   ```bash
   npm run build
   ```

Para estudar a primeira versão, em JavaScript puro, use
`git checkout v1.0` e abra o `index.html` direto no navegador: ela não
precisa de Node nem de build. Até a `v2.4` o projeto Vite fica na raiz, sem
a pasta `frontend/`, e nenhuma versão anterior à `v3.3` tem o
backend. Volte com `git checkout main`.

---

## 📖 Como usar este repositório para estudo

* **Leia a evolução pelos diffs.** `git show v2.0` mostra tudo que o
  TypeScript exigiu. `git diff v2.2 v2.3` mostra a remoção e o `strict`
  juntos, mesmo sendo dois commits. `git diff v2.4 v3.2 -- src` mostra
  tudo que a integração com o backend mudou no frontend.
* **Abra a aba *Network* do DevTools** e use a página: carregue, crie, edite,
  marque e exclua uma tarefa. Para cada ação, encontre a requisição, o método
  HTTP, o corpo enviado em `data` e a resposta do Strapi.
* **Tire uma permissão da role *Public*** no painel do Strapi (por exemplo,
  `delete` em *Task*), tente excluir uma tarefa e veja o status da resposta e
  o que a página faz quando o `deleteTask` devolve `false`.
* **Tire o `?populate=category`** de `loadTasks` e recarregue a página. Leia
  o erro no console e compare a resposta do servidor na aba *Network*.
* **Teste o seletor de id:** no console, rode
  `document.querySelector("#1abc")` e depois
  `document.getElementById("1abc")`. Compare com a correção do estágio 9.
* **Troque o `updateTask({ ...task, description: ... })` de `saveEditing`**
  por `task.description = descriptionLabel.textContent.trim()` seguido de
  `updateTask(task)`. Pare o Strapi, edite uma descrição, aperte Enter e
  compare o texto na tela com o que aparece depois de religar o servidor e
  recarregar a página.
* **Abra o DevTools** (aba *Elements*) enquanto cria tarefas e observe cada
  `<li>` aparecer com checkbox, `label`, categoria, prazo e o grupo de botões,
  na ordem do `appendChild`.
* **Troque `textContent` por `innerHTML`** em `createTaskElement` e cadastre a
  descrição `<b>teste</b>`. Veja a diferença e pense no que aconteceria com um
  `<script>` ou um `onerror`.
* **Inverta a ordem** dos `appendChild` do checkbox e do label e veja o
  `:checked + label` parar de funcionar.
* **Remova um `as HTMLInputElement`** de `frontend/src/dom.ts` e rode
  `npm run build`. Leia os erros e explique por que cada um aparece.
* **Rode `npm run build` na versão `v2.0`** (`git checkout v2.0`) e veja
  o `noUnusedParameters` apontar `categoria` e `prazo`. Depois rode
  `npm run dev` no mesmo commit e repare que a página funciona mesmo assim.
* **Troque `formatDate(task.deadline)` por `new Date(task.deadline).toLocaleDateString("pt-BR")`**
  e cadastre uma tarefa com prazo. Confira o dia que aparece.
* **Apague a linha `submitButton.disabled = true`** do `submit`, crie uma
  tarefa e veja o estado do botão com o campo vazio.
* **Na versão `v2.4`, volte a remoção para `e.target.parentElement?.remove()`**
  e clique em 🗑️. Observe no DOM o que foi apagado.
* **Investigue a ordem dos eventos:** comente a linha do `mousedown` em
  `createEditButton`, comece a editar uma tarefa e clique em 💾. Coloque um
  `console.log` no `blur` e no `click` para ver por que a edição reabre.
* **Navegue com o leitor de tela** (VoiceOver no macOS: Cmd+F5; Narrador no
  Windows: Ctrl+Win+Enter) e ouça como os botões e o seletor de categoria são
  anunciados.

---
Desenvolvido por [Bruno Mateus](https://github.com/brunomateus) para fins didáticos.
