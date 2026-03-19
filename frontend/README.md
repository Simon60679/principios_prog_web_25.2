# DOCUMENTAÇÃO DO FRONTEND WEB

**Alunos:**
1. Cristiano
2. Lucas 

---

### 1. Introdução

**Nome do projeto:**
Marketplace

**Descrição geral:** 
O projeto é um e-commerce no estilo marketplace voltado para a compra e venda de produtos. A aplicação frontend fornece a interface para que os usuários (compradores e vendedores) interajam com o sistema. O ambiente permite buscar produtos, adicionar itens ao carrinho, além de painéis dedicados para vendedores gerenciarem seus anúncios/vendas e compradores acompanharem seus pedidos, com uma máquina de estados de entrega e fluxos de autenticação.

**Tecnologias utilizadas:**
* **React** (Biblioteca de interfaces)
* **TypeScript** (Tipagem estática para JavaScript, garantindo maior segurança e manutenibilidade)
* **Vite** (Ferramenta de build e servidor de desenvolvimento ultra-rápido)
* **Tailwind CSS** (Framework CSS utilitário para estilização rápida e responsiva)
* **React Router DOM** (Gerenciamento de rotas no cliente / SPA)
* **Context API** (Gerenciamento de estado global da aplicação, especificamente para autenticação)

---

### 2. Estrutura do Projeto

**Organização de pastas:**
A estrutura de pastas segue um padrão de organização focado na separação de responsabilidades:
* `/src/pages`: Contém as telas principais da aplicação, atuando como os contêineres que agrupam a lógica e a interface de cada rota (ex: `HomePage.tsx`, `PurchasesPage.tsx`, `SellerDashboardPage.tsx`).
* `/src/contexts`: Abriga os provedores de contexto global. O `AuthContext.tsx`, por exemplo, gerencia o token JWT, persistência no `localStorage` e as funções de login/logout.
* `/src/components`: Componentes reutilizáveis de UI menores.
* `/src/services`: Chamadas isoladas à API.
* `/src/assets`: Arquivos estáticos (imagens, ícones).

---

### 3. Design da Interface (UI/UX)

**Ferramentas de prototipagem:** 
[Figma]

**Principais telas do sistema:**

1. **Página Inicial (Home / Vitrine):** Lista produtos, barra de pesquisa funcional e opção de adicionar ao carrinho.
<img width="996" height="848" alt="image" src="https://github.com/user-attachments/assets/1722db21-69da-4fba-9807-909809b58cf3" />

2. **Dashboard do Vendedor:** Formulário completo para cadastro/edição de produtos (com upload de múltiplas imagens) e listagem/gerenciamento do histórico de vendas.
<img width="1108" height="856" alt="image" src="https://github.com/user-attachments/assets/06c379f0-8a56-4bea-b771-0d2eaefcfcfa" />

3. **Página de Compras (Meus Pedidos):** Visão do cliente detalhando os sub-pedidos e botão para confirmar o recebimento do pacote.
<img width="1033" height="851" alt="image" src="https://github.com/user-attachments/assets/a7a57189-a1cd-48f5-880e-c495b9e15482" />

---

### 4. Componentização

**Componentes principais:**
* **AuthContext / AuthProvider:** Componente invisível de UI, fundamental para encapsular toda a lógica de segurança e prover os dados do usuário para os filhos.
* **Product Card (na Home):** Estrutura de exibição de produtos contendo imagem, descrição, preço e botões de ação que lidam com status de estoque.
* **Status Badge:** Lógica modularizada (`renderStatusBadge`) utilizada para renderizar "etiquetas" visuais consistentes indicando o estado atual de um pedido.

**Reutilização e modularização:** 
O código foi construído utilizando Hooks (`useState`, `useEffect`, `useContext`). A injeção de dependências do usuário é feita via `AuthContext`, dispensando o "prop-drilling". Funções utilitárias como formatação de data (`formatDate`) e cálculos de totais foram modularizadas.

---

### 5. Integração com Backend

**API utilizada:** 
A aplicação consome uma API REST própria construída em Node.js com Express e Sequelize. O tráfego de dados sensíveis é autenticado através de cabeçalhos de autorização (`Authorization: Bearer {token}`).

**Principais endpoints consumidos:**
* **Autenticação:** `POST /auth/login`, `POST /auth/logout`
* **Produtos:** `GET /products`, `GET /products/search`, `POST /products`, `PUT /products/:id`, `PATCH /products/:id/stock`, `DELETE /products/:id`
* **Carrinho/Transações:** `POST /cart/add`, `GET /users/:id/sales`, `GET /users/:id/purchases`, `PATCH /users/sales/:saleId/status`, `PATCH /purchases/:purchaseId/status`

---

### 6. Roteamento

**Explicação das rotas:** 
* `/`: **HomePage** – Rota pública principal, acessada por qualquer pessoa, exibindo a vitrine e a barra de busca.
* `/login`: Tela de autenticação.
* `/produto/:id`: Rota dinâmica para acessar a página de detalhe de um produto em específico.
* *(Rotas Protegidas)*: Telas como o Dashboard do Vendedor (`/seller`) e Meus Pedidos (`/purchases`), acessíveis apenas quando logado.

---

### 7. Conclusão

**Aprendizados principais:** 
A implementação consolidou o entendimento sobre a criação de Single Page Applications (SPAs) com React e TypeScript. O uso de Context API provou-se uma ferramenta poderosa para manter o estado global da aplicação em sincronia. O manuseio de `FormData` para envio simultâneo de texto e arquivos de imagens trouxe grande aprendizado sobre requisições HTTP avançadas.

**Desafios enfrentados e soluções encontradas:** 
* *Desafio:* Lidar com o JWT e extrair informações sem chamadas extras ao backend. 
* *Solução:* Implementado parse do Payload Base64 (usando `atob`) do JWT diretamente no frontend.
* *Desafio:* Sincronizar os status complexos de pedidos.
* *Solução:* Ajuste das interfaces para lidar com estados intermediários via requisições PATCH.

**Melhorias futuras planejadas:** 
* Extrair os cards e formulários para componentes menores visando testes unitários automatizados.
* Implementar "Infinite Scroll" na tela principal.
* Inclusão de um painel analítico no Dashboard do Vendedor.
* Implementação do sistema de avaliações.
