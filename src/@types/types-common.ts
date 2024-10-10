export type PagedResponseT<T> = {
  count: number; // 总条数
  query_info: T[]; // 当页数据
}
