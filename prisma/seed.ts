import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.selection.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.create({
    data: {
      title: "Наушники Kakadu Air",
      description: "Беспроводные накладные наушники с шумоподавлением.",
      imageUrl: "https://picsum.photos/seed/air/600/400",
      category: "audio",
      basePrice: 7990,
      variants: {
        create: [
          { name: "Белый", priceDiff: 0 },
          { name: "Чёрный", priceDiff: 0 },
          { name: "Синий", priceDiff: 500 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      title: "Рюкзак Kakadu Trek 25",
      description: "Городской рюкзак с отделением для ноутбука.",
      imageUrl: "https://picsum.photos/seed/trek/600/400",
      category: "bags",
      basePrice: 4500,
      variants: {
        create: [
          { name: "25 л", priceDiff: 0 },
          { name: "35 л", priceDiff: 900 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      title: "Тариф Kakadu Cloud",
      description: "Облачное хранилище для личных файлов.",
      imageUrl: "https://picsum.photos/seed/cloud/600/400",
      category: "service",
      basePrice: 199,
      variants: {
        create: [
          { name: "Базовый", priceDiff: 0 },
          { name: "Про", priceDiff: 300 },
          { name: "Команда", priceDiff: 900 },
        ],
      },
    },
  });

  console.log("Seed готов");
}

main().finally(() => prisma.$disconnect());
