import React, { useState, useCallback } from 'react';
import MathInput from './components/MathInput';
import AnalyticalGraph from './components/AnalyticalGraph';
import MathResults from './components/MathResults';

const API_BASE = '/api';

export default function App() {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    const handleAnalyze = useCallback(async (expression) => {
        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const res = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || `Error del servidor (${res.status})`);
            }

            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            setResults(data);

            // Agregar al historial
            setHistory(prev => {
                const newEntry = { expression, timestamp: Date.now() };
                const filtered = prev.filter(h => h.expression !== expression);
                return [newEntry, ...filtered].slice(0, 10);
            });
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError('No se pudo conectar al servidor de cálculo. Asegúrate de que el backend de Python esté ejecutándose en el puerto 8000.');
            } else {
                setError(err.message || 'Error desconocido al analizar la función.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleHistoryClick = (expression) => {
        handleAnalyze(expression);
    };

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Banner de bienvenida */}
            <div className="bg-gradient-to-r from-cyan-600/90 via-blue-600/90 to-purple-600/90 text-white text-center py-2 px-4">
                <p className="text-sm font-semibold tracking-wide">
                    ¡BIENVENIDOS CONTADORES DE LA IUV! GRUPO <span className="font-bold text-yellow-300">LCYF201-26-13F</span>
                </p>
            </div>

            {/* Header */}
            <header className="border-b border-dark-800/50 bg-dark-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/20">
                            <span className="text-white text-xl font-bold" style={{ fontFamily: 'serif' }}>∫</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-dark-100 tracking-tight">
                                Calculador Analítico
                            </h1>
                            <p className="text-xs text-dark-500">
                                Dominio, Recorrido y Asíntotas — Rigor Formal con SymPy
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-dark-800 border border-dark-700 text-xs text-dark-400 font-mono">
                            f: ℝ → ℝ
                        </span>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Sección de entrada */}
                <section className="mb-8">
                    <MathInput
                        onAnalyze={handleAnalyze}
                        isLoading={isLoading}
                    />
                </section>

                {/* Error global */}
                {error && (
                    <section className="mb-8">
                        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-math-rose/10 border border-math-rose/30">
                            <svg className="w-5 h-5 text-math-rose flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-math-rose">Error en el análisis</p>
                                <p className="text-sm text-dark-400 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-dark-500 hover:text-dark-300 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </section>
                )}

                {/* Loading */}
                {isLoading && (
                    <section className="mb-8 flex flex-col items-center justify-center py-16">
                        <div className="loading-glow w-16 h-16 rounded-full border-2 border-accent/30 border-t-accent animate-spin mb-4"></div>
                        <p className="text-dark-400 text-sm">Calculando dominio, recorrido y asíntotas...</p>
                        <p className="text-dark-600 text-xs mt-1">SymPy está procesando la función simbólicamente</p>
                    </section>
                )}

                {/* Resultados */}
                {results && !isLoading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Panel izquierdo: Resultados analíticos */}
                        <div className="space-y-6">
                            <MathResults data={results} />
                        </div>

                        {/* Panel derecho: Gráfica */}
                        <div className="glass-card rounded-xl p-4">
                            <AnalyticalGraph
                                expression={results.expression}
                                asymptotes={results.asymptotes || []}
                                holes={results.holes || []}
                                domain={results.domain}
                            />
                        </div>
                    </div>
                )}

                {/* Estado inicial (sin resultados) */}
                {!results && !isLoading && !error && (
                    <section className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center mb-6">
                            <span className="text-4xl opacity-40">∫</span>
                        </div>
                        <h2 className="text-xl font-semibold text-dark-400 mb-2">
                            Ingresa una función para comenzar
                        </h2>
                        <p className="text-sm text-dark-600 max-w-md">
                            Escribe cualquier función de variable real y el motor simbólico calculará su
                            dominio, recorrido, asíntotas y discontinuidades con rigor matemático formal.
                        </p>

                        {/* Historial */}
                        {history.length > 0 && (
                            <div className="mt-10 w-full max-w-md">
                                <p className="text-xs text-dark-600 uppercase tracking-wider mb-3">
                                    Análisis recientes
                                </p>
                                <div className="space-y-1.5">
                                    {history.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleHistoryClick(h.expression)}
                                            className="w-full text-left px-4 py-2.5 rounded-lg bg-dark-900/50 border border-dark-800 hover:border-accent/30 hover:bg-dark-900 transition-all group"
                                        >
                                            <span className="font-mono text-sm text-dark-300 group-hover:text-accent-light transition-colors">
                                                f(x) = {h.expression}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full">
                            {[
                                { icon: '📐', text: 'Dominio exacto con intervalos y conjuntos' },
                                { icon: '📊', text: 'Recorrido mediante análisis simbólico' },
                                { icon: '📈', text: 'Asíntotas verticales, horizontales y oblicuas' },
                            ].map((tip, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg bg-dark-900/30 border border-dark-800/50">
                                    <span className="text-lg">{tip.icon}</span>
                                    <span className="text-xs text-dark-500 text-center">{tip.text}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-dark-800/30 mt-16">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-dark-600">
                    <span>Calculador Analítico de Funciones — Motor: SymPy + FastAPI</span>
                    <span>Rigor matemático: Análisis Real</span>
                </div>
            </footer>
        </div>
    );
}