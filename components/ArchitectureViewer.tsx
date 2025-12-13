import React, { useState } from 'react';
import { Search, BookOpen, Cpu, Layers, Database, FileCheck, CheckCircle, Sparkles } from 'lucide-react';
import { ARCHITECTURE_DATA } from '../constants';
import { ArchitectureNode } from '../types';

const ArchitectureViewer: React.FC = () => {
  const [activeNode, setActiveNode] = useState<ArchitectureNode>(ARCHITECTURE_DATA[0]);

  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Search': return <Search className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Database': return <Database className={className} />;
      case 'FileCheck': return <FileCheck className={className} />;
      case 'Layers': return <Layers className={className} />;
      default: return <Database className={className} />;
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">5-Tier Quality Architecture</h1>
            <p className="text-neutral-400 text-sm">FinRL-Enhanced Research System Framework</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Flow Diagram */}
        <div className="flex-1 card p-6 overflow-y-auto">
          <div className="flex flex-col items-center space-y-4 max-w-xl mx-auto">
            {ARCHITECTURE_DATA.map((node, index) => (
              <React.Fragment key={node.id}>
                <button
                  onClick={() => setActiveNode(node)}
                  className={`relative group w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4
                    ${activeNode.id === node.id
                      ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-neutral-800/50 border-neutral-700 hover:border-indigo-400/50 hover:bg-neutral-800'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${activeNode.id === node.id
                      ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white'
                      : 'bg-neutral-700 text-neutral-400'
                    }`}>
                    {getIcon(node.icon, "w-5 h-5")}
                  </div>
                  <div className="text-left flex-1">
                    <h3 className={`font-semibold ${activeNode.id === node.id ? 'text-white' : 'text-neutral-300'}`}>
                      {node.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-1">{node.description}</p>
                  </div>
                  {activeNode.id === node.id && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                </button>

                {index < ARCHITECTURE_DATA.length - 1 && (
                  <div className="h-8 w-px bg-gradient-to-b from-indigo-500/50 to-transparent" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-96 flex-shrink-0 card p-6 flex flex-col">
          <div className="mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-indigo-500 to-cyan-500`}>
              {getIcon(activeNode.icon, "w-7 h-7 text-white")}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{activeNode.title}</h2>
            <p className="text-neutral-400 leading-relaxed">{activeNode.description}</p>
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Key Mechanisms
            </h4>
            <ul className="space-y-3">
              {activeNode.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-neutral-800/50 rounded-xl border border-neutral-700">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-neutral-300">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
            <h4 className="text-amber-400 font-semibold text-sm mb-1 flex items-center gap-2">
              ⚡ Quality Assurance
            </h4>
            <p className="text-xs text-amber-300/80">
              This tier ensures {activeNode.id === 'discovery' ? 'completeness of search and gap identification.' :
                activeNode.id === 'comprehension' ? 'data validity and citation verification.' :
                  activeNode.id === 'synthesis' ? 'unbiased insight generation and thematic organization.' :
                    activeNode.id === 'grounding' ? 'real-world applicability with verified data sources.' :
                      'scientific auditability and full reproducibility.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureViewer;