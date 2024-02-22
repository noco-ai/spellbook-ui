export interface Block {
  type: "code" | "text" | "html";
  content: string;
  raw: string;
}

export interface Message {
  id: number;
  parent_id: number;
  icon: string[];
  shortcuts: string;
  conversation_id: number;
  content: string;
  role: string;
  created_at: number;
  blocks: Block[];
  is_editing: boolean;
  siblings: number[];
  raw: string;
  files: string;
  filesList: string[];
}
