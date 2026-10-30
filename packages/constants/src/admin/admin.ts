export const AdminUserSortBy = {
  CREATED_AT: 'createdAt',
  NAME: 'name',
  LOGIN_ID: 'loginId',
} as const;
export type AdminUserSortBy = (typeof AdminUserSortBy)[keyof typeof AdminUserSortBy];

export const AdminUserSortOrder = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;
export type AdminUserSortOrder = (typeof AdminUserSortOrder)[keyof typeof AdminUserSortOrder];
