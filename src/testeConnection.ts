import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
    // busca todos os produtos
    const products = await prisma.product.findMany();

    products.forEach(element => {
        console.log(element.title + " - R$ " + element.price);
    });
}

test();