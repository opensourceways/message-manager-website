export type PagedResponse<T> = {
  count: number;
  query_info: T[];
}

export type Pagination<T> = {
  total: number;
  data: T[];
}