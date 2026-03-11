import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Coluna 1 */}
        <div>
          <span className="text-xl font-black text-white tracking-tighter mb-4 block">
            MARKET<span className="text-gray-400">PLACE</span>
          </span>
          <p className="text-sm text-gray-400">
            A melhor plataforma para comprar e vender produtos de forma rápida e segura.
          </p>
        </div>

        {/* Coluna 2 */}
        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Links Úteis</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Como comprar</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Como vender</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
          </ul>
        </div>

        {/* Coluna 3 */}
        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Segurança</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Termos de Serviço</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-gray-800 text-sm text-center text-gray-500">
        &copy; {currentYear} Meu Marketplace. Todos os direitos reservados.
      </div>
    </footer>
  );
}