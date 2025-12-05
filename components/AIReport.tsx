import React, { useState, useEffect } from 'react';
import { Novel } from '../types';
import { generateReadingReport } from '../services/geminiService';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
    novels: Novel[];
}

const AIReport: React.FC<Props> = ({ novels }) => {
    const [report, setReport] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const result = await generateReadingReport(novels);
        setReport(result);
        setLoading(false);
    };

    return (
        <div className="p-6 pb-24 min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 flex flex-col items-center">
            <div className="w-full max-w-md text-center">
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Zen AI Insights</h2>
                <p className="text-gray-500 mb-8">Analyze your reading habits and get a personality report.</p>

                {report && (
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl mb-8 text-left border border-purple-100 dark:border-purple-900/30 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                            {report}
                        </p>
                    </div>
                )}

                <button 
                    onClick={handleGenerate}
                    disabled={loading || novels.length === 0}
                    className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {loading ? 'Analyzing...' : 'Generate Report'}
                </button>
                
                {novels.length === 0 && (
                    <p className="text-xs text-red-400 mt-4">Add some novels to your library first!</p>
                )}
            </div>
        </div>
    );
};

export default AIReport;