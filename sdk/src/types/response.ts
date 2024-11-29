import { TransactionDetail } from "./transaction";

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  username: string;
  first_name: string;
  last_name: string;
  uid: string;
  provider: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface QRCodeResponse {
  qr_code_url: string;
}

export interface TransactionResponse {
  error: number;
  data: TransactionDetail[];
  pages?: {
    totalRecord: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
