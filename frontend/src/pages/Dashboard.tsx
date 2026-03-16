// src/pages/Dashboard.tsx
import { Link } from 'react-router-dom';
import { Link2, Plus, BarChart2 } from 'lucide-react';
import { useUrls } from '../services/api.js';
import { LinkCard } from '../components/LinkCard.js';

export function Dashboard() {
  const { data: urls, isLoading, isError } = useUrls();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Link2 size={20} className="text-brand-500" />
            <span>Shortify</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New link
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Links</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {urls?.length ?? 0} links criados
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
            Erro ao carregar os links. Verifique se o backend está rodando.
          </div>
        )}

        {urls && urls.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <BarChart2 size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Nenhum link ainda</p>
            <p className="text-sm text-gray-400 mt-1">Crie seu primeiro link curto para começar.</p>
            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-1.5 text-sm bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
            >
              <Plus size={16} />
              Criar um link
            </Link>
          </div>
        )}

        {urls && urls.length > 0 && (
          <div className="space-y-3">
            {urls.map((url) => (
              <LinkCard key={url.id} url={url} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
