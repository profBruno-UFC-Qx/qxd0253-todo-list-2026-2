type ApiError = {
  status: number,
  name: string
  message: string,
  //details: 
}

export type Success<T> = {
  success: true,
  data: T
}

export type Failure = {
  success: false,
  error: ApiError
  
}

export type StrapiLogin = {
  jwt: string,
  user: {
    id: number,
    documentId: string,
    username: string,
    email: string
  }
} 

export type Result<T> = Success<T> | Failure

export type StrapiCollectionResponse<T> = {
  data: T[];
  meta: Pagination;
};

export type StrapiSingleResponse<T> = {
  data: T,
  meta: Record<string, never> // objeto vazio ({} aceitaria qualquer valor não nulo)
}

export type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export type Category = {
  documentId: string;
  description: string;
};

// O que o Strapi DEVOLVE: a categoria vem como objeto.
export type Task = {
  documentId: string;
  id: number;
  description: string;
  done: boolean,
  category: Category
  deadline: string | null;
};

// O que ENVIAMOS ao Strapi para criar ou editar uma tarefa: sem id/documentId
// (quem gera é o servidor) e com a categoria apenas pelo seu documentId.
export type TaskInput = {
  description: string;
  done: boolean;
  deadline: string | null;
  category: string;
};
