// src/components/LinkCard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, Trash2, BarChart2 } from 'lucide-react';
import { useDeleteUrl } from '../services/api.js';
import type { ShortUrl } from '../types/index.js';

interface LinkCardProps {
  url: ShortUrl;
}

export function LinkCard({ url }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const deleteUrl = useDeleteUrl();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm('Excluir esta URL e todos os seus dados de analytics?')) {
      deleteUrl.mutate(url.id);
    }
  };

  const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-500 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          {url.title && (
            <p className="text-sm font-medium text-gray-900 truncate mb-1">{url.title}</p>
          )}

          {/* Short URL */}
          <div className="flex items-center gap-2">
            <a
              href={url.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 font-mono text-sm hover:underline truncate"
            >
              {url.shortUrl}
            </a>
            {isExpired && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">
                Expirado
              </span>
            )}
          </div>

          {/* Original URL */}
          <p className="text-xs text-gray-400 mt-1 truncate">{url.originalUrl}</p>
        </div>

        {/* Click count */}
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-gray-900">{url.totalClicks}</p>
          <p className="text-xs text-gray-400">cliques</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>

        <Link
          to={`/links/${url.id}`}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 transition-colors ml-auto"
        >
          <BarChart2 size={14} />
          Analytics
        </Link>

        <a
          href={url.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 transition-colors"
        >
          <ExternalLink size={14} />
          Visitar
        </a>

        <button
          onClick={handleDelete}
          disabled={deleteUrl.isPending}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
          Excluir
        </button>
      </div>
    </div>
  );
}
