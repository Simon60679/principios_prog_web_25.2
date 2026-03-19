import { expect } from "chai";
import sinon from "sinon";
import userService from "../../../src/services/UserService";
import userRepository from "../../../src/repository/UserRepository";
import cartRepository from "../../../src/repository/CartRepository";
import sequelize from "../../../src/config/database";

describe("UserService", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("createUser", () => {
        it("deve criar um usuário com sucesso", async () => {
            const userData = {
                name: "Teste Unitario",
                email: "teste@unitario.com",
                password: "123",
            };

            const mockCreatedUser = {
                id: 1,
                ...userData,
                cart: { userId: 1, items: [] },
            };

            // Mock da transação do Sequelize
            const transactionStub = {
                commit: sinon.stub(),
                rollback: sinon.stub()
            };
            sinon.stub(sequelize, "transaction").resolves(transactionStub as any);

            const createStub = sinon.stub(userRepository, "createUser").resolves(mockCreatedUser as any);
            const createCartStub = sinon.stub(cartRepository, "createCart").resolves();

            const result = await userService.createUser(userData);

            // Verifica se chamou o repositório de usuário E o de carrinho
            expect(createStub.called).to.be.true;
            expect(createCartStub.calledWith({ userId: 1 })).to.be.true;
            expect(transactionStub.commit.called).to.be.true;
            expect(result).to.deep.equal(mockCreatedUser);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const userData = { name: "Erro", email: "erro@teste.com", password: "123" };
            const error = new Error("Erro de banco de dados");

            const transactionStub = { commit: sinon.stub(), rollback: sinon.stub() };
            sinon.stub(sequelize, "transaction").resolves(transactionStub as any);

            sinon.stub(userRepository, "createUser").rejects(error);

            try {
                await userService.createUser(userData);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de banco de dados");
                expect(transactionStub.rollback.called).to.be.true;
            }
        });
    });

    describe("getAllUsers", () => {
        it("deve retornar uma lista de usuários", async () => {
            const mockUsers = [{ id: 1, name: "User 1" }, { id: 2, name: "User 2" }];
            const getAllStub = sinon.stub(userRepository, "getAllUsers").resolves(mockUsers as any);

            const result = await userService.getAllUsers();

            expect(getAllStub.called).to.be.true;
            expect(result).to.deep.equal(mockUsers);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro de conexão com o banco");
            sinon.stub(userRepository, "getAllUsers").rejects(error);

            try {
                await userService.getAllUsers();
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de conexão com o banco");
            }
        });

        it("deve retornar uma lista vazia se não houver usuários cadastrados", async () => {
            sinon.stub(userRepository, "getAllUsers").resolves([]);

            const result = await userService.getAllUsers();

            expect(result).to.deep.equal([]);
        });
    });

    describe("deleteUser", () => {
        it("deve retornar false se o usuário não existir", async () => {
            const findStub = sinon.stub(userRepository, "findUserById").resolves(null);
            const deleteStub = sinon.stub(userRepository, "deleteUser");

            const result = await userService.deleteUser(999);

            expect(findStub.calledWith(999)).to.be.true;
            expect(deleteStub.called).to.be.false;
            expect(result).to.be.false;
        });

        it("deve deletar e retornar true se o usuário existir", async () => {
            sinon.stub(userRepository, "findUserById").resolves({ id: 1, name: "User" } as any);
            const deleteStub = sinon.stub(userRepository, "deleteUser").resolves(1);

            const result = await userService.deleteUser(1);

            expect(deleteStub.calledWith(1)).to.be.true;
            expect(result).to.be.true;
        });

        it("deve propagar erro se o repositório falhar ao deletar", async () => {
            sinon.stub(userRepository, "findUserById").resolves({ id: 1 } as any);
            const error = new Error("Erro ao deletar");
            sinon.stub(userRepository, "deleteUser").rejects(error);

            try {
                await userService.deleteUser(1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro ao deletar");
            }
        });

        it("deve propagar erro se falhar ao buscar o usuário (etapa de verificação)", async () => {
            const error = new Error("Erro de conexão ao buscar");
            sinon.stub(userRepository, "findUserById").rejects(error);

            try {
                await userService.deleteUser(1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de conexão ao buscar");
            }
        });

        it("deve retornar true mesmo que o repositório retorne 0 linhas afetadas (concorrência)", async () => {
            sinon.stub(userRepository, "findUserById").resolves({ id: 1 } as any);
            sinon.stub(userRepository, "deleteUser").resolves(0);

            const result = await userService.deleteUser(1);

            expect(result).to.be.true;
        });
    });

    describe("updateUser", () => {
        it("deve retornar null se o usuário não existir", async () => {
            const findStub = sinon.stub(userRepository, "findUserById").resolves(null);
            const updateStub = sinon.stub(userRepository, "updateUser");

            const result = await userService.updateUser(999, { name: "Novo Nome" });

            expect(findStub.calledWith(999)).to.be.true;
            expect(updateStub.called).to.be.false;
            expect(result).to.be.null;
        });

        it("deve atualizar e retornar o usuário atualizado se houver mudanças", async () => {
            const existingUser = { id: 1, name: "Antigo" };
            const updatedUser = { id: 1, name: "Novo" };

            const findStub = sinon.stub(userRepository, "findUserById");
            findStub.onFirstCall().resolves(existingUser as any);
            findStub.onSecondCall().resolves(updatedUser as any);

            const updateStub = sinon.stub(userRepository, "updateUser").resolves(1);

            const result = await userService.updateUser(1, { name: "Novo" });

            expect(updateStub.calledWith(1, { name: "Novo" })).to.be.true;
            expect(result).to.deep.equal(updatedUser);
        });

        it("deve retornar o usuário original se não houver mudanças", async () => {
            const existingUser = { id: 1, name: "Mesmo Nome" };

            const findStub = sinon.stub(userRepository, "findUserById").resolves(existingUser as any);
            const updateStub = sinon.stub(userRepository, "updateUser").resolves(0);

            const result = await userService.updateUser(1, { name: "Mesmo Nome" });

            expect(updateStub.calledWith(1, { name: "Mesmo Nome" })).to.be.true;
            expect(findStub.calledOnce).to.be.true;
            expect(result).to.deep.equal(existingUser);
        });

        it("deve retornar o usuário original se o objeto de atualização estiver vazio", async () => {
            const existingUser = { id: 1, name: "Original" };

            sinon.stub(userRepository, "findUserById").resolves(existingUser as any);
            sinon.stub(userRepository, "updateUser").resolves(0);

            const result = await userService.updateUser(1, {});

            expect(result).to.deep.equal(existingUser);
        });

        it("deve propagar erro se o repositório falhar ao atualizar", async () => {
            sinon.stub(userRepository, "findUserById").resolves({ id: 1, name: "Antigo" } as any);
            const error = new Error("Erro no update");
            sinon.stub(userRepository, "updateUser").rejects(error);

            try {
                await userService.updateUser(1, { name: "Novo" });
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro no update");
            }
        });

        it("deve propagar erro se falhar ao verificar existência do usuário", async () => {
            const error = new Error("Erro de conexão");
            sinon.stub(userRepository, "findUserById").rejects(error);

            try {
                await userService.updateUser(1, { name: "Novo" });
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de conexão");
            }
        });

        it("deve propagar erro se falhar ao buscar o usuário atualizado (após o update)", async () => {
            const existingUser = { id: 1, name: "Antigo" };
            const error = new Error("Erro ao buscar atualizado");

            const findStub = sinon.stub(userRepository, "findUserById");
            findStub.onFirstCall().resolves(existingUser as any);
            findStub.onSecondCall().rejects(error);

            sinon.stub(userRepository, "updateUser").resolves(1);

            try {
                await userService.updateUser(1, { name: "Novo" });
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro ao buscar atualizado");
            }
        });

        it("deve retornar null se o usuário for deletado logo após a atualização (concorrência)", async () => {
            const existingUser = { id: 1, name: "Antigo" };

            const findStub = sinon.stub(userRepository, "findUserById");
            findStub.onFirstCall().resolves(existingUser as any);
            findStub.onSecondCall().resolves(null);

            sinon.stub(userRepository, "updateUser").resolves(1);

            const result = await userService.updateUser(1, { name: "Novo" });

            expect(result).to.be.null;
        });
    });
});