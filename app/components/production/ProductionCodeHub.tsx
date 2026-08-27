import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  FolderTree,
} from 'lucide-react';
import { PRODUCTION_FILES, ProductionFile } from '../data/productionCodeFiles';

export function ProductionCodeHub() {
  const [selectedFileId, setSelectedFileId] = useState<string>('01');
  const [copied, setCopied] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const selectedFile = PRODUCTION_FILES.find((f) => f.id === selectedFileId) || PRODUCTION_FILES[0];

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredFiles = filterCategory === 'ALL'
    ? PRODUCTION_FILES
    : PRODUCTION_FILES.filter((f) => f.category === filterCategory);

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                PRODUCTION FILE HUB <span className="text-purple-400 font-normal">(8 PRODUCTION FILES)</span>
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">
                Components, API Routes, Nginx CORS, GitHub Actions CI/CD & E2E Suites
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#050505] hover:bg-slate-900 text-slate-300 text-xs font-mono rounded-lg border border-slate-800 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIED' : 'COPY FILE'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold rounded-lg shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          {[
            { step: '01', title: 'Components', detail: 'MagicOrb & Stats' },
            { step: '02', title: 'API Routes', detail: 'pages/api/health' },
            { step: '03', title: 'Nginx CORS', detail: 'Azure VM nginx.conf' },
            { step: '04', title: 'CI/CD Pipeline', detail: '.github/workflows' },
            { step: '05', title: 'E2E Testing', detail: 'Playwright & Cypress' },
          ].map((s, idx) => (
            <div key={idx} className="p-2.5 bg-[#050505] border border-slate-800 rounded-lg">
              <span className="text-[9px] text-purple-400 block font-semibold">STEP {s.step}</span>
              <h4 className="text-white text-xs font-bold">{s.title}</h4>
              <span className="text-[10px] text-slate-500 truncate block">{s.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-3.5 h-3.5 text-purple-400" />
              Files ({PRODUCTION_FILES.length})
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">VERIFIED</span>
          </div>

          <div className="my-2.5 flex flex-wrap gap-1 text-[10px] font-mono">
            {['ALL', 'Components', 'API Routes', 'Config', 'CI/CD', 'Tests'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded border transition ${
                  filterCategory === cat
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-[#050505] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`p-2.5 rounded-lg border transition cursor-pointer font-mono ${
                  selectedFileId === file.id
                    ? 'bg-[#101010] border-purple-500/50 text-white shadow-sm'
                    : 'bg-[#050505] border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold truncate text-white max-w-[180px]">{file.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-purple-300 border border-slate-800">
                    {file.category}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block truncate">
                  {file.targetPath}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#0a0a0a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2">
                  {selectedFile.name}
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    {selectedFile.language.toUpperCase()}
                  </span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Target: {selectedFile.targetPath}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#050505] hover:bg-slate-900 text-slate-300 text-xs font-mono rounded border border-slate-800 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>

            <div className="mt-3 bg-[#050505] rounded-lg p-3 border border-slate-800 overflow-x-auto max-h-[460px]">
              <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span className="truncate max-w-md">{selectedFile.description}</span>
            <span className="text-emerald-400">READY FOR VERCEL DEPLOY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
