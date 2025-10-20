import express, { type Request, type Response } from 'express';
import cors from 'cors'
import { PrismaClient, Prisma } from "@prisma/client";

import { email, json, z, ZodError } from 'zod';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


// cria uma instancia da aplicação Express
const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());


const registerSchema = z.object({
    email: z.email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    name: z.string().optional()
});

const loginSchema = z.object({
    email: z.email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória')
});

// chave secreta para JWT (em produção, isso vai para variável de ambiente)
const JWT_SECRET = 'seu_jwt_secret_seguro_aqui';

// Interface para estender o Request do Express
interface AuthRequest extends Request {
    user?: {
        id: number,
        email: string,
        name?: string | null
    }
}

/*
    Middleware de autenticação
    - Extrai token do header Authorization
    - Verifica se token é valido
    - Busca usuário no banco
    - Anexa usuário q requisição para uso posterior
*/
const authMiddleware = async (req: AuthRequest, res: Response, next: any) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token de acesso não fornecido' });
        }

        // Header deve ser: "Bearer jdfjdsfjsdfjdnsf..."
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Formato do token inválido' });
        }

        // 2. Verificar se token é válido
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

        // 3. Buscar usuário no banco
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true } // Não buscar a senha
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' })
        }

        // 4. Anexar usuário a requisição
        req.user = user;

        // 5. Continuar para a próxima função (rota final)
        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};


// Define a porta em que o servidor vai rodar
const PORT = 3001;

app.listen(PORT, () => {
    console.log("Servidor rodando com sucesso em http://localhost:" + PORT);
});

app.get('/', (req: Request, res: Response) => {
    // retornar status do serviço
    res.json({ status: "OK" });
});

/*
    Get /api/auth/me
    - Rota protegida para verificar se token está funcionando
    - Retorna informações do usuário logado
*/
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    // se chegou até aqui, o middleware já validou o token
    return res.status(200).json({
        message: 'Usuário autenticado',
        user: req.user
    })
});

// criar usuário
app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        // 1. Validar dados de entrada
        const { email, password, name } = registerSchema.parse(req.body);

        // 2. Verificar se o usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email já está em uso' });
        }

        // 3. Criar hash da senha (10 rounds é um bom padrão de segurança)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Criar usuário no banco
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        // 5. Gerar token JWT
        const token = jwt.sign(
            { userId: user.id }, // Payload; informações que queremos no token
            JWT_SECRET,
            { expiresIn: '7d' } // Token expira em 7 dias
        );

        // 6. Retornar sucesso (sem a senha!)
        return res.status(201).json({
            message: 'Usuário ciado com sucesso',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        if (error instanceof z.ZodRealError) {
            return res.status(400).json({ error: error[0].message })
        }
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// login
app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        // 1. Validar dados de entrada
        const { email, password } = loginSchema.parse(req.body);

        // 2. Buscar usuário no banco
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // 3. Comparar senha fornecida com hash salvo
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email ou senha incorretos' })
        }

        // 4. Gerar token JWT
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 5. Retornar sucesso
        return res.status(200).json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });


    } catch (error) {
        if (error instanceof z.ZodRealError) {
            return res.status(400).json({ error: error[0].message })
        }
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});




app.get('/api/products', async (req: Request, res: Response) => {
    // buscar todos os produtos
    try {
        const products = await prisma.product.findMany();
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao listar produtos' });
    }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
    //const { id } = req.params;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID do produto inválido" });
    }

    try {
        const produtos = await prisma.product.findUnique({
            where: {
                id: id
            }
        });

        if (!produtos) {
            res.status(404).json({ error: "Produto não encontrado" });
        } else {
            return res.status(200).json(produtos);
        }
    } catch (erro) {
        return res.status(500).json({ error: "Erro ao consultar produto!" });
    }

});



/* 
    Schema Zod
*/
export const createProductSchema = z.object({
    title: z.string().min(3, "Titulo deve ter pelo menos 3 caracteres"),
    description: z.string().min(10, "Descrição deve ter pelo menos 3 caracteres"),
    price: z.coerce.number().positive("Preço deve ser maior que zero"),
    imageUrl: z.string().min(1, "ImageUrl não pode ser vazio"),
    isFeatured: z.coerce.boolean().optional().default(false)
});

// inserir produtos
// app.post('/api/products', async (req: Request, res: Response) => {                     // sem autenticação
app.post('/api/products', authMiddleware, async (req: AuthRequest, res: Response) => {    // com autenticação
    try {
        const data = createProductSchema.parse(req.body);
        const newProduct = await prisma.product.create({ data });
        return res.status(201).json({
            message: 'Produto criado com sucesso',
            newProduct
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Payload invalido',
                issues: error.issues.map((e) => ({
                    path: e.path.join("."),
                    message: e.message
                }))
            })
        }
        return res.status(500).json({ error: "Erro ao inserir produto" });
    }
});

const updateProductSchema = createProductSchema.partial();

// atualizar produtos
//app.put('/api/products/:id', async (req: Request, res: Response) => {                     // sem autenticação
app.put('/api/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {   // com autenticação
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID invalido!" });
    }

    try {
        const data = updateProductSchema.parse(req.body);
        const updated = await prisma.product.update({ where: { id }, data });

        return res.status(201).json({
            message: 'Produto atualizado com sucesso',
            updated
        });

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Payload invalido',
                issues: error.issues.map((e) => ({
                    path: e.path.join("."),
                    message: e.message
                }))
            })
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code == "P2025") {
            return res.status(404).json({ error: "Produto não encontrado" });
        }
        return res.status(500).json({ error: "erro ao atualizar produto" })
    }

});

// deletar produtos
//app.delete('/api/products/:id', async (req: Request, res: Response) => {                        // sem autenticação
app.delete('/api/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {      // com autenticação
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID invalido!" });
    }

    try {
        await prisma.product.delete({ where: { id } });

        //return res.status(204).send();
        return res.status(204).json({
            message: 'Produto deletado com sucesso'
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code == "P2025") {
            return res.status(404).json({ error: "Produto não encontrado" });
        }
        res.status(500).json({ error: "Erro interno ao deletar produto!" });
    }
});