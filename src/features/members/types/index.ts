/** Represents a single organization member from the API response */
export interface Member {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/** Pagination metadata from the API */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

/** Full API response shape for the members list endpoint */
export interface MembersResponse {
  message: string;
  data: Member[];
  meta: PaginationMeta;
}
