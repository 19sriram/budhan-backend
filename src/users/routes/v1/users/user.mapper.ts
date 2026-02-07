import type { User } from "@prisma/client";
import type { UserDto } from "./user.dto.js";

export function toUserDto(user: User): UserDto {
  const { id, email, name } = user;
  return {
    id,
    email,
    name,
  };
}
