// TODO:建议使用interface，且使用T结尾，并加注释
export type PagedResponse<T> = {
  count: number;
  query_info: T[];
}

export type Pagination<T> = {
  total: number;
  data: T[];
}