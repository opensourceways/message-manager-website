export type Recipient = {
  key?: string;
  id: any;
  recipient_id: string;
  mail: string;
  message: string;
  phone: string;
  remark: string;
  created_at?: string;
  formattedCreateTime?: string;
}

export type Subscribe = {
  id: string;
  source: string;
  event_type: string;
  mode_name: string;
  spec_version: string;
  mode_filter: Record<string, any>;
  
  recipient_name?: string;
  need_message?: boolean;
  need_phone?: boolean;
  need_mail?: boolean;
  need_inner_message?: boolean;
  recipientNames?: string[];
}