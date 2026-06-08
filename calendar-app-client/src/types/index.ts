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
  assignedUsers: any;
  end: any;
  id: number;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  isExternal: boolean;
  groupId: number | null;
  userIds: number[];
}
export interface CreateTaskDto {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  isExternal: boolean;
  groupId: number | null;
  userIds: number[];
}