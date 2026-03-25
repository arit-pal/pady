export interface User {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  metadata: Record<string, unknown>;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  message: string;
}
