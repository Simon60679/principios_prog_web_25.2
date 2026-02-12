import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API de E-commerce",
            version: "1.0.0",
            description: "Documentação da API de E-commerce com Carrinho de Compras e Controle de Estoque",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Servidor Local",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    // Arquivos onde o swagger vai procurar as anotações (comentários)
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/models/*.ts", "./src/app.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;