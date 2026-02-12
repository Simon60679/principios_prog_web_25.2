/**
 * Ponto de entrada da aplicação.
 * Inicializa a conexão com o banco de dados e coloca o servidor Express para escutar na porta definida.
 */
import app from "./app";
import sequelize from "./config/database";

const PORT = process.env.PORT || 3000;

sequelize
    .sync({ force: false })
    .then(() => {
        console.log("Banco de dados conectado e sincronizado!");
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Erro ao conectar ao banco de dados:", error);
        process.exit(1);
    });