// src/pages/LinkDetail.tsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useUrl, useAnalytics, useDeleteUrl } from '../services/api.js';
import { ClicksChart } from '../components/ClicksChart.js';
import { DevicesPieChart } from '../components/DevicesPieChart.js';
import { format } from 'date-fns';

export function LinkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: url, isLoading: urlLoading } = useUrl(id!);
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(id!);
  const deleteUrl = useDeleteUrl();

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!url) return;
    if (confirm('Delete this URL and all its analytics data?')) {
      deleteUrl.mutate(url.id, {
        onSuccess: () => navigate('/dashboard'),
      });
    }
  };

  if (urlLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Link not found.</p>
          <Link to="/dashboard" className="mt-4 text-sm text-brand-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-900 font-medium truncate">
            {url.title ?? url.slug}
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {url.title && (
                <h1 className="text-xl font-bold text-gray-900 mb-1">{url.title}</h1>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={url.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 font-mono text-sm hover:underline"
                >
                  {url.shortUrl}
                </a>
                {isExpired && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    Expired
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">{url.originalUrl}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Created {format(new Date(url.createdAt), 'PPP')}
                {url.expiresAt && ` · Expires ${format(new Date(url.expiresAt), 'PPP')}`}
              </p>
            </div>

            {/* Total clicks badge */}
            <div className="text-right shrink-0">
              <p className="text-4xl font-bold text-gray-900">
                {analytics?.totalClicks ?? url.totalClicks}
              </p>
              <p className="text-sm text-gray-400">total de cliques</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>

            <a
              href={url.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 border border-gray-200 hover:border-brand-300 px-4 py-2 rounded-lg transition-colors"
            >
              <ExternalLink size={15} />
              Visit original
            </a>

            <button
              onClick={handleDelete}
              disabled={deleteUrl.isPending}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 ml-auto transition-colors"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>

        {/* Clicks over time */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Cliques ao longo do tempo (últimos 30 dias)</h2>
          {analyticsLoading ? (
            <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
          ) : (
            <ClicksChart data={analytics?.clicksByDay ?? []} />
          )}
        </div>

        {/* Devices + Countries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Dispositivos</h2>
            {analyticsLoading ? (
              <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
            ) : (
              <DevicesPieChart data={analytics?.clicksByDevice ?? []} />
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Principais Países</h2>
            {analyticsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse bg-gray-100 rounded" />
                ))}
              </div>
            ) : analytics?.clicksByCountry.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">Nenhum dado ainda.</p>
            ) : (
              <div className="space-y-2">
                {analytics?.clicksByCountry.map((c) => {
                  const pct = analytics.totalClicks
                    ? Math.round((c.count / analytics.totalClicks) * 100)
                    : 0;
                  return (
                    <div key={c.country} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-10 shrink-0">{c.country}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-brand-500 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right shrink-0">
                        {c.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Referrers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Fontes de Tráfego</h2>
          {analyticsLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : analytics?.clicksByReferrer.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Nenhuma fonte de tráfego ainda.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {analytics?.clicksByReferrer.map((r) => (
                <div key={r.referrer} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-700">{r.referrer}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{r.count} cliques</span>
                    {analytics.totalClicks > 0 && (
                      <span className="text-xs text-gray-400">
                        {Math.round((r.count / analytics.totalClicks) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
