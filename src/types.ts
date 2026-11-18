export type StrapiCollectionResponse<T> = {
  data: T[];
  meta: Pagination;
};

export type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export type Category = {
  documentId: string;
  id: number;
  description: string;
};

export type Task = {
  documentId: string;
  id: number;
  description: string;
  done: boolean,
  category: Category;
  deadline: string;
};
