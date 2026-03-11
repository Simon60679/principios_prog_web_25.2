import React from 'react';
import LoginForm from '../components/LoginForm';
import { Link } from 'react-router-dom'; // <-- Não esqueça desta importação!

export default function LoginPage() {
  return (
    // O flex-col e py-12 ajudam a centralizar o conteúdo no espaço entre o Navbar e o Footer
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Container principal com fundo branco e sombra */}
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-gray-100">
        
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          Acesse sua conta
        </h1>
        
        {/* O formulário que já tínhamos criado */}
        <LoginForm />

        {/* Link para a página de Cadastro */}
        <div className="mt-8 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm text-gray-600">
            Ainda não tem uma conta?{' '}
            <Link to="/cadastro" className="font-bold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}