import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main () {
    console.log("Iniciando seed do banco de dados ....");

    // limmpa a tabela antes de popular (útil em desenvolvimento)
    await prisma.product.deleteMany();

    // cria produtos de exemplo
    const products = await prisma.product.createMany({
        data: [
            {
                title: "Notebook de última geração",
                description: "Um notebook poderoso para trabalho e lazer",
                price: 4500.00,
                imageUrl: "/images/notebook.png",
                isFeatured: true
            },
            {
                title: "Smartphone avançado",
                description: "Capture os melhores momentos com uma camera de alta resolução",
                price: 2800.00,
                imageUrl: "/images/smartphone.png",
                isFeatured: false
            },
            {
                title: "Teclado mecanino RGB",
                description: "Alta performance e Feedback tátil para gamers e programadores",
                price: 350.50,
                imageUrl: "/images/teclado.png",
                isFeatured: true
            },
            {
                title: "Monitor gamer RGB",
                description: "Alta performance e resolução ideal para jogo",
                price: 1350.50,
                imageUrl: "/images/monitor.png",
                isFeatured: true
            }
        ]
    });
    console.log(products.count + " produtos criados com sucesso." );
}

main().catch((e) => {
    console.error("Erro ao popular o banco: " + e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
})
