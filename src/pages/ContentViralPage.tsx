import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Flame, ArrowRight, Calendar, User } from 'lucide-react';
import { viralArticles } from '../data/viralArticles';

export function ContentViralPage() {
  return (
    <Layout
      theme="dark"
      heroContent={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 text-center text-white relative z-10">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-orange-500/20 text-orange-400 rounded-full mb-3 sm:mb-4 ring-1 ring-orange-500/30">
            <Flame size={24} className="sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight drop-shadow-md">
            Content Viral
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto opacity-90 px-4">
            Danh mục các bài viết chuyên môn - Kể sao cho cuốn
          </p>
        </div>
      }
      bodyContent={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {viralArticles.map((article) => (
              <div key={article.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                {article.coverImage && (
                  <Link to={`/content-viral/${article.slug}`} className="h-48 overflow-hidden block">
                    <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs font-medium text-white/50 mb-3">
                    <div className="flex items-center gap-1.5"><Calendar size={14}/> {article.date}</div>
                  </div>
                  <Link to={`/content-viral/${article.slug}`} className="hover:underline decoration-amber-400">
                    <h2 className="text-xl font-semibold text-white mb-3 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">{article.title}</h2>
                  </Link>
                  <p className="text-sm text-blue-100/70 mb-6 line-clamp-3 leading-relaxed flex-1">{article.excerpt}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                        {article.author.charAt(0)}
                      </div>
                      <div className="text-xs">
                        <div className="text-white font-medium">{article.author}</div>
                        <div className="text-white/50">{article.authorRole}</div>
                      </div>
                    </div>
                    <Link to={`/content-viral/${article.slug}`} className="flex items-center gap-1 text-sm font-semibold text-amber-400 hover:text-orange-400 transition-colors">
                      Đọc tiếp <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
