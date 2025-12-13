import React from 'react';
import { GUIDE_CONTENT } from '../constants';

const GuideViewer: React.FC = () => {
  return (
    <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">Mechanisms & Implementation</h2>
        <p className="text-sm text-slate-500 mt-1">Detailed breakdown of how AI Research Agents operate.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
        {GUIDE_CONTENT.map((section, index) => (
          <section key={index} className="max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-science-500 rounded-full inline-block"></span>
              {section.title}
            </h3>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p className="leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
            {index < GUIDE_CONTENT.length - 1 && (
              <hr className="my-8 border-slate-100" />
            )}
          </section>
        ))}
        
        {/* Prompt Preview Section */}
        <section className="max-w-4xl mx-auto bg-slate-900 rounded-xl p-6 text-slate-300">
           <h3 className="text-white font-bold mb-4">System Prompt Structure (Preview)</h3>
           <p className="text-sm mb-4">The simulation uses the following prompt structure to enforce agent behavior:</p>
           <div className="font-mono text-xs bg-black/50 p-4 rounded-lg overflow-x-auto border border-slate-700">
             <div className="text-green-400"># SYSTEM_ROLE</div>
             <div>You are an expert AI research assistant...</div>
             <br/>
             <div className="text-green-400"># SEARCH_PROTOCOL</div>
             <div>Phase 1: Query Decomposition...</div>
             <br/>
             <div className="text-green-400"># QUALITY_ASSURANCE</div>
             <div>Verify: Methodological Diversity, Domain Coverage...</div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default GuideViewer;
