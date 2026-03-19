import LoginForm from '../components/LoginForm';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-gray-100">

        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          Acesse sua conta
        </h1>

        <LoginForm />

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