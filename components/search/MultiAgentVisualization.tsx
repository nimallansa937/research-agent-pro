import React from 'react';
import {
    Network,
    TrendingUp,
    Lightbulb,
    BarChart3,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface Pattern {
    name: string;
    insight: string;
    confidence: number;
    supporting_papers?: number[];
}

interface Coverage {
    coverage_score: number;
    dimensions?: Record<string, Record<string, number>>;
}

interface MultiAgentVisualizationProps {
    patterns: Pattern[];
    coverage?: Coverage;
    totalPapers: number;
    elapsedTime?: number;
}

/**
 * Visualization component for Multi-Agent research results.
 * Shows cross-cutting patterns, coverage analysis, and statistics.
 */
const MultiAgentVisualization: React.FC<MultiAgentVisualizationProps> = ({
    patterns,
    coverage,
    totalPapers,
    elapsedTime
}) => {
    if (!patterns || patterns.length === 0) {
        return null;
    }

    const coverageScore = coverage?.coverage_score || 0;
    const coverageColor = coverageScore >= 75 ? 'text-green-400' : coverageScore >= 50 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="space-y-6 p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Network className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Multi-Agent Analysis Results</h3>
                    <p className="text-sm text-neutral-400">3-Tier System: DeepSeek + Gemini</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{totalPapers}</div>
                    <div className="text-xs text-neutral-400">Papers Found</div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${coverageColor}`}>{coverageScore.toFixed(0)}%</div>
                    <div className="text-xs text-neutral-400">Coverage</div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{patterns.length}</div>
                    <div className="text-xs text-neutral-400">Patterns</div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{elapsedTime ? `${elapsedTime.toFixed(0)}s` : 'N/A'}</div>
                    <div className="text-xs text-neutral-400">Time</div>
                </div>
            </div>

            {/* Coverage Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Literature Coverage</span>
                    <span className={coverageColor}>{coverageScore.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${coverageScore >= 75 ? 'bg-green-500' : coverageScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${Math.min(100, coverageScore)}%` } as React.CSSProperties}
                    />
                </div>
            </div>

            {/* Patterns */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Cross-Cutting Patterns
                </h4>

                {patterns.map((pattern, index) => (
                    <div
                        key={index}
                        className="bg-neutral-800/50 rounded-lg p-4 border-l-4 border-purple-500"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-white">{pattern.name}</h5>
                            <div className="flex items-center gap-1 text-xs">
                                {pattern.confidence >= 0.7 ? (
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                                )}
                                <span className={pattern.confidence >= 0.7 ? 'text-green-400' : 'text-yellow-400'}>
                                    {(pattern.confidence * 100).toFixed(0)}% confidence
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-neutral-300">{pattern.insight}</p>
                        {pattern.supporting_papers && pattern.supporting_papers.length > 0 && (
                            <div className="mt-2 text-xs text-neutral-500">
                                Supported by {pattern.supporting_papers.length} papers
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Dimensions Coverage (if available) */}
            {coverage?.dimensions && Object.keys(coverage.dimensions).length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        Dimensional Coverage
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(coverage.dimensions).slice(0, 6).map(([dim, values]) => {
                            const totalPapers = Object.values(values).reduce((a, b) => a + b, 0);
                            return (
                                <div key={dim} className="bg-neutral-800/30 rounded-lg p-2">
                                    <div className="text-xs font-medium text-neutral-300 capitalize">
                                        {dim.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-sm text-white">{totalPapers} papers</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiAgentVisualization;
