// TODO:建议使用interface，且使用T结尾，并加注释
export type MessageT = {
  id: string;
  data_schema: string;
  event_id: string;
  source: string;
  source_url: string;
  source_group: string;
  spec_version: string;
  summary: string;
  time: string;
  formattedTime: string;
  title: string;
  type: string;
  user: string;
  is_read: boolean;
}