export interface User {
  id: number;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  email: string;
  groups: string[];
  is_admin: boolean;
  is_enabled: boolean;
}
