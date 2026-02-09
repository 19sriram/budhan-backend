import "dotenv/config";
import { toUserDto } from "../src/routes/users/v1/users/user.mapper.js";
import { pool, prisma } from "../src/db/prisma.js";
import { logger } from "../src/utils/logger.js";

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
    const user = await prisma.user.upsert({
      where: {
        email: u.email,
        name: u.name,
      },
      update: {},
      create: u,
    });
    await prisma.session.create({
      data: {
        userId: BigInt("1234"),
        token: `token-${user.email}`,
        id: `session-${user.id}`,
      },
    });
  }
  const allUsers = await prisma.user.findMany();
  const userDtos = allUsers.map(toUserDto);

  logger.info({ users: userDtos }, "Seed finished");
}

main()
  .catch((e) => {
    logger.error({ err: e }, "Seed failed");
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
