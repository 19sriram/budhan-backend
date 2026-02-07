import "dotenv/config";
import { toUserDto } from "../src/users/user.mapper.js";
import { pool, prisma } from "../src/db/prisma.js";

async function main() {
  const users = [
    {
      name: "test1",
      email: "test1@gmail.com",
    },
    {
      name: "test2",
      email: "test2@gmail.com",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: {
        email: u.email,
        name: u.name,
      },
      update: {},
      create: u,
    });
  }
  const allUsers = await prisma.user.findMany();
  const userDtos = allUsers.map(toUserDto);

  console.log("Seed finished! Users:", userDtos);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
