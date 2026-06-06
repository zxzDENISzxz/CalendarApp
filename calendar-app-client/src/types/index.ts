export interface UserDto {
  id: number;
  name: string;
  email: string;
}

export interface GroupDto {
  id: number;
  name: string;
  colorHex: string;
}

export interface TaskDto {
  id: number;
  title: string;
  description?: string;
  start: string; // ISO дата-время строка
  end: string;   // ISO дата-время строка
  isExternal: boolean;
  groupId?: number;
  assignedUsers: UserDto[];
}