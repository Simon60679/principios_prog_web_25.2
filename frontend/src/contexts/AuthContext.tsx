import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('@Marketplace:token');
    const storedUser = localStorage.getItem('@Marketplace:user');

    if (storedToken && storedUser) {
      try {
        // Tenta converter o texto salvo em um objeto válido
        const parsedUser = JSON.parse(storedUser);
        
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Dados corrompidos no LocalStorage. Limpando sessão...", error);
        
        // Se der erro
        localStorage.removeItem('@Marketplace:token');
        localStorage.removeItem('@Marketplace:user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciais inválidas');
      }

      const data = await response.json();
      
      // Busca o token independentemente do nome da variável que o backend usar
      const receivedToken = data.token || data.accessToken;

      if (!receivedToken) {
        throw new Error("O backend não enviou um token válido.");
      }

      // TRUQUE DE MESTRE: Decodifica a carga útil (payload) do JWT no frontend
      // O JWT tem 3 partes separadas por ponto. A do meio (índice 1) tem os dados.
      const payloadBase64 = receivedToken.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));

      // Monta o usuário pegando a ID de dentro do próprio token recém decodificado
      const receivedUser = data.user || { 
        id: decodedPayload.id || decodedPayload.userId, 
        name: decodedPayload.name || email.split('@')[0], 
        email 
      };

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('@Marketplace:token', receivedToken);
      localStorage.setItem('@Marketplace:user', JSON.stringify(receivedUser));

    } catch (error) {
      console.error("Erro no login:", error);
      throw error; 
    }
  };

  const logout = async () => {
    // Avisa o backend para colocar o token na blacklist (conforme seu authRoutes.ts)
    if (token) {
      try {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Erro ao invalidar token no backend", err);
      }
    }

    // Limpa o estado local
    setToken(null);
    setUser(null);
    localStorage.removeItem('@Marketplace:token');
    localStorage.removeItem('@Marketplace:user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};