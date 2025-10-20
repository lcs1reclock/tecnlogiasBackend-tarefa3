criar projeto: 
# npm i -y 

Instalar dependentecias:
# npm install -D typescript @types/node @types/express tsx


express:
Framework que facilita criar o servidor e as rotas

Configurar o typescript: criar json com opções de manual de instruções
#  npx tsc --init 

Add linha no package
# "dev": "tsx watch src/server.ts"


rodar aplicação:
# npm run dev

Executar o docker: 
# docker-compose up -d
## -d (rodar em segundo plano)
## iniciar docker de acordo com as Configurções do arquivo.


Prisma:
Ferramenta para conectar Typescript com SQL 
Instalar: 
    # npm i -D prisma
    # npm i @prisma/client
    # npx prisma init           (iniciar o prisma e gera o arquivo .env) 


Migration:
# Histórico de modifiação do banco
    # npx prisma migrate dev --name init        (gera a pasta prisma/migration/nome_do_arquivo com o SQL gerado) 

# Abrir a interface do Prisma
    # npx prisma studio          (abre a ferramenta no navegador) 

# Criar arquivo seed.ts para inserir dados no banco
# Rodar arquivo teste para inserir os registros.
# npx prisma db seed


Cors:
# npm i cors
# npm i -D @types/cors 

Zod - biblioteca de validação de dados em tempo de compilação.
# npm i Zod 

Autenticação JWT

$ npm install bcryptjs jsonwebtoken
$ npm install -D @types/bcryptjs @types/jsonwebtoken

* bcryptjs: proteger as senhas, insere criptografias nas senhas (gere um hash irreversivel da senha)
* jsonwebtoken: cria passes de acessos (define quantos dias vai expirar, por exemplo)

 após adicionar o model User no prisma, rodar o comando, para criar a tabela:
 $ npx prisma migrate dev --name create-users
 
 obs.: ** Abrir docker e startar o postgresql **