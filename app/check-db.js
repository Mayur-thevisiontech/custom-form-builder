import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const forms = await prisma.form.findMany();
  console.log("--- Forms Status ---");
  forms.forEach(f => {
    console.log(`Form: ${f.title} (${f.id})`);
    console.log(`Last Seen: ${f.lastSeenAt}`);
    console.log(`Updated At: ${f.updatedAt}`);
    console.log('-------------------');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
