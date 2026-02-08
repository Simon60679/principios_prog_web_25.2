import userService from "../../../src/services/UserService";
import userRepository from "../../../src/repository/UserRepository";

// Mock do UserRepository para não acessar o banco de dados real
jest.mock("../../../src/repository/UserRepository");

// Cria uma versão tipada do mock. Isso habilita o autocompletar e verifica se os métodos existem.
const userRepositoryMock = jest.mocked(userRepository);

describe("UserService", () => {
    // Limpa os mocks antes de cada teste
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createUser", () => {
        it("deve criar um usuário com sucesso", async () => {
            // Arrange (Preparação)
            const userData = {
                name: "Teste Unitario",
                email: "teste@unitario.com",
                password: "123",
            };

            const mockCreatedUser = {
                id: 1,
                ...userData,
                cart: { userId: 1, items: [] }, // Reflete a estrutura real retornada pelo repositório (com carrinho)
                // Simulando o retorno que viria do banco (senha hasheada, etc)
            };

            // Ensinamos o mock a retornar o valor esperado quando a função for chamada
            userRepositoryMock.createUser.mockResolvedValue(mockCreatedUser as any);

            // Act (Ação)
            const result = await userService.createUser(userData);

            // Assert (Verificação)
            expect(userRepositoryMock.createUser).toHaveBeenCalledWith(userData);
            expect(result).toEqual(mockCreatedUser);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const userData = { name: "Erro", email: "erro@teste.com", password: "123" };
            const error = new Error("Erro de banco de dados");

            userRepositoryMock.createUser.mockRejectedValue(error);

            await expect(userService.createUser(userData)).rejects.toThrow("Erro de banco de dados");
        });
    });

    describe("getAllUsers", () => {
        it("deve retornar uma lista de usuários", async () => {
            const mockUsers = [{ id: 1, name: "User 1" }, { id: 2, name: "User 2" }];
            userRepositoryMock.getAllUsers.mockResolvedValue(mockUsers as any);

            const result = await userService.getAllUsers();

            expect(userRepositoryMock.getAllUsers).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro de conexão com o banco");
            userRepositoryMock.getAllUsers.mockRejectedValue(error);

            await expect(userService.getAllUsers()).rejects.toThrow("Erro de conexão com o banco");
        });

        it("deve retornar uma lista vazia se não houver usuários cadastrados", async () => {
            userRepositoryMock.getAllUsers.mockResolvedValue([]);

            const result = await userService.getAllUsers();

            expect(result).toEqual([]);
        });
    });

    describe("deleteUser", () => {
        it("deve retornar false se o usuário não existir", async () => {
            // Simula que o usuário não foi encontrado
            userRepositoryMock.findUserById.mockResolvedValue(null);

            const result = await userService.deleteUser(999);

            expect(userRepositoryMock.findUserById).toHaveBeenCalledWith(999);
            expect(userRepositoryMock.deleteUser).not.toHaveBeenCalled(); // Não deve tentar deletar
            expect(result).toBe(false);
        });

        it("deve deletar e retornar true se o usuário existir", async () => {
            userRepositoryMock.findUserById.mockResolvedValue({ id: 1, name: "User" } as any);

            const result = await userService.deleteUser(1);

            expect(userRepositoryMock.deleteUser).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it("deve propagar erro se o repositório falhar ao deletar", async () => {
            userRepositoryMock.findUserById.mockResolvedValue({ id: 1 } as any);
            const error = new Error("Erro ao deletar");
            userRepositoryMock.deleteUser.mockRejectedValue(error);

            await expect(userService.deleteUser(1)).rejects.toThrow("Erro ao deletar");
        });

        it("deve propagar erro se falhar ao buscar o usuário (etapa de verificação)", async () => {
            const error = new Error("Erro de conexão ao buscar");
            userRepositoryMock.findUserById.mockRejectedValue(error);

            await expect(userService.deleteUser(1)).rejects.toThrow("Erro de conexão ao buscar");
        });

        it("deve retornar true mesmo que o repositório retorne 0 linhas afetadas (concorrência)", async () => {
            userRepositoryMock.findUserById.mockResolvedValue({ id: 1 } as any);
            userRepositoryMock.deleteUser.mockResolvedValue(0);

            const result = await userService.deleteUser(1);

            expect(result).toBe(true);
        });
    });

    describe("updateUser", () => {
        it("deve retornar null se o usuário não existir", async () => {
            userRepositoryMock.findUserById.mockResolvedValue(null);

            const result = await userService.updateUser(999, { name: "Novo Nome" });

            expect(userRepositoryMock.findUserById).toHaveBeenCalledWith(999);
            expect(userRepositoryMock.updateUser).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it("deve atualizar e retornar o usuário atualizado se houver mudanças", async () => {
            const existingUser = { id: 1, name: "Antigo" };
            const updatedUser = { id: 1, name: "Novo" };

            userRepositoryMock.findUserById
                .mockResolvedValueOnce(existingUser as any) // Primeira chamada: verifica existência
                .mockResolvedValueOnce(updatedUser as any); // Segunda chamada: retorna atualizado

            userRepositoryMock.updateUser.mockResolvedValue(1); // 1 linha afetada

            const result = await userService.updateUser(1, { name: "Novo" });

            expect(userRepositoryMock.updateUser).toHaveBeenCalledWith(1, { name: "Novo" });
            expect(result).toEqual(updatedUser);
        });

        it("deve retornar o usuário original se não houver mudanças", async () => {
            const existingUser = { id: 1, name: "Mesmo Nome" };

            userRepositoryMock.findUserById.mockResolvedValue(existingUser as any);
            userRepositoryMock.updateUser.mockResolvedValue(0); // 0 linhas afetadas

            const result = await userService.updateUser(1, { name: "Mesmo Nome" });

            expect(userRepositoryMock.updateUser).toHaveBeenCalledWith(1, { name: "Mesmo Nome" });
            expect(userRepositoryMock.findUserById).toHaveBeenCalledTimes(1); // Não busca novamente
            expect(result).toEqual(existingUser);
        });

        it("deve retornar o usuário original se o objeto de atualização estiver vazio", async () => {
            const existingUser = { id: 1, name: "Original" };

            userRepositoryMock.findUserById.mockResolvedValue(existingUser as any);
            userRepositoryMock.updateUser.mockResolvedValue(0);

            const result = await userService.updateUser(1, {});

            expect(result).toEqual(existingUser);
        });

        it("deve propagar erro se o repositório falhar ao atualizar", async () => {
            userRepositoryMock.findUserById.mockResolvedValue({ id: 1, name: "Antigo" } as any);
            const error = new Error("Erro no update");
            userRepositoryMock.updateUser.mockRejectedValue(error);

            await expect(userService.updateUser(1, { name: "Novo" })).rejects.toThrow("Erro no update");
        });

        it("deve propagar erro se falhar ao verificar existência do usuário", async () => {
            const error = new Error("Erro de conexão");
            userRepositoryMock.findUserById.mockRejectedValue(error);

            await expect(userService.updateUser(1, { name: "Novo" })).rejects.toThrow("Erro de conexão");
        });

        it("deve propagar erro se falhar ao buscar o usuário atualizado (após o update)", async () => {
            const existingUser = { id: 1, name: "Antigo" };
            const error = new Error("Erro ao buscar atualizado");

            userRepositoryMock.findUserById
                .mockResolvedValueOnce(existingUser as any) // 1. Encontra o usuário na verificação
                .mockRejectedValueOnce(error);              // 2. Falha ao buscar o usuário atualizado

            userRepositoryMock.updateUser.mockResolvedValue(1); // Atualiza com sucesso

            await expect(userService.updateUser(1, { name: "Novo" })).rejects.toThrow("Erro ao buscar atualizado");
        });

        it("deve retornar null se o usuário for deletado logo após a atualização (concorrência)", async () => {
            const existingUser = { id: 1, name: "Antigo" };

            userRepositoryMock.findUserById
                .mockResolvedValueOnce(existingUser as any) // 1. Encontra antes do update
                .mockResolvedValueOnce(null);               // 2. Não encontra depois do update

            userRepositoryMock.updateUser.mockResolvedValue(1); // Update diz que alterou 1 linha

            const result = await userService.updateUser(1, { name: "Novo" });

            expect(result).toBeNull();
        });
    });
});