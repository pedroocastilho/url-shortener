// src/pages/Home.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check, Link2, BarChart2, ArrowRight } from 'lucide-react';
import { useCreateUrl } from '../services/api.js';
import type { ShortUrl } from '../types/index.js';

const schema = z.object({
  originalUrl: z
    .string()
    .url('Please enter a valid URL including http:// or https://')
    .min(1, 'URL is required'),
  title: z.string().max(100).optional(),
  expiresAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function Home() {
  const [result, setResult] = useState<ShortUrl | null>(null);
  const [copied, setCopied] = useState(false);
  const createUrl = useCreateUrl();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    const payload = {
      originalUrl: data.originalUrl,
      title: data.title || undefined,
      expiresAt: data.expiresAt || undefined,
    };

    createUrl.mutate(payload, {
      onSuccess: (url) => {
        setResult(url);
        reset();
      },
    });
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Nav */}
      <nav className="border-b border-white/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Link2 size={20} className="text-brand-500" />
            <span>Shortify</span>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors"
          >
            <BarChart2 size={16} />
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Encurte seus links,
            <br />
            <span className="text-brand-500">acompanhe cada clique</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Crie links curtos e obtenha analytics detalhados em cada visita.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Long URL <span className="text-red-500">*</span>
            </label>
            <input
              {...register('originalUrl')}
              type="url"
              placeholder="https://your-very-long-url.com/with/a/long/path"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            {errors.originalUrl && (
              <p className="mt-1.5 text-xs text-red-500">{errors.originalUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="My awesome link"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Expires at <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                {...register('expiresAt')}
                type="datetime-local"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createUrl.isPending}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {createUrl.isPending ? 'Creating...' : 'Shorten URL'}
            {!createUrl.isPending && <ArrowRight size={16} />}
          </button>

          {createUrl.isError && (
            <p className="text-sm text-red-500 text-center">
              Failed to create URL. Please try again.
            </p>
          )}
        </form>

        {/* Result */}
        {result && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="text-sm font-medium text-green-800 mb-3">
              ✅ Your short link is ready!
            </p>

            <div className="flex items-center gap-2 bg-white rounded-lg border border-green-200 px-4 py-3">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-brand-600 font-mono text-sm hover:underline truncate"
              >
                {result.shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors shrink-0"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <Link
              to={`/links/${result.id}`}
              className="mt-3 flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 transition-colors"
            >
              <BarChart2 size={14} />
              View analytics for this link
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
