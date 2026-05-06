import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkForm() {
  const id = "4c9605ab-e8e9-4990-a673-0eab1ebc30d7";
  console.log("Checking for form ID:", id);
  
  const form = await prisma.form.findUnique({
    where: { id }
  });
  
  if (form) {
    console.log("FOUND FORM:", JSON.stringify(form, null, 2));
  } else {
    console.log("FORM NOT FOUND IN PRISMA CLIENT");
    
    const rawForms = await prisma.$queryRawUnsafe(`SELECT * FROM Form WHERE id = '${id}'`);
    console.log("RAW SQL SEARCH RESULT:", JSON.stringify(rawForms, null, 2));
  }
  
  const allForms = await prisma.form.findMany({ select: { id: true, title: true, active: true } });
  console.log("ALL FORMS IN DB:", JSON.stringify(allForms, null, 2));
}

checkForm()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
