import { prisma } from "../../../../db/prisma.js";

interface UserData {
  name: string;
  email: string;
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: UserData) {
  const { name, email } = data;
  return prisma.user.upsert({
    where: {
      email: data.email,
    },
    update: {},
    create: {
      name,
      email,
    },
  });
}
