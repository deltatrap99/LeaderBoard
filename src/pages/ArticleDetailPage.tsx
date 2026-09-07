import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ArrowLeft, Share2, Check, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { viralArticles } from '../data/viralArticles';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  
  const article = viralArticles.find(a => a.slug === slug);
  
  useEffect(() => {
    if (!article) {
      navigate('/content-viral');
    }
  }, [article, navigate]);

  if (!article) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <Layout
      theme="dark"
      heroContent={<div className="h-2"></div>} // Minimal hero banner
      bodyContent={
        <div className="bg-[#FAFAFA] text-slate-800 min-h-screen">
          {/* Top Breadcrumb */}
          <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-4">
            <Link to="/content-viral" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-600 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh mục
            </Link>
          </div>

          <article className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 pb-24">
            {/* Article Header */}
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.2]">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-lg font-bold text-white shadow-sm">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold text-base">{article.author}</div>
                    <div className="text-slate-500 text-sm flex items-center gap-3"><span>{article.authorRole} • {article.date}</span> <span className="flex items-center gap-1 text-slate-400"><Eye size={14} /> {article.views?.toLocaleString('vi-VN')} lượt xem</span></div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
                      isCopied 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {isCopied ? (
                      <><Check size={16} /> Đã copy link</>
                    ) : (
                      <><Share2 size={16} /> Chia sẻ</>
                    )}
                  </button>
                </div>
              </div>
            </header>

            {/* Cover Image */}
            {article.coverImage && (
              <figure className="mb-12">
                <img 
                  src={article.coverImage} 
                  alt={article.title} 
                  className="w-full h-auto object-cover max-h-[500px] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]" 
                />
              </figure>
            )}
            
            {/* Markdown Content */}
            <div className="prose prose-slate prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl prose-strong:text-slate-900 prose-blockquote:border-amber-500 prose-blockquote:bg-amber-50/50 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:font-medium prose-blockquote:text-slate-700 prose-blockquote:not-italic prose-li:marker:text-amber-500 leading-relaxed tracking-wide">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
              </ReactMarkdown>
            </div>
            
            {/* Article Footer Tags */}
            <div className="mt-16 pt-8 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors text-slate-600 rounded-full text-sm font-medium">#LoFiContent</span>
                <span className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors text-slate-600 rounded-full text-sm font-medium">#Marketing</span>
                <span className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors text-slate-600 rounded-full text-sm font-medium">#GiaoDuc</span>
              </div>
            </div>
          </article>
        </div>
      }
    />
  );
}
