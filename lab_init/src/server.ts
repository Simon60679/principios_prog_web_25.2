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