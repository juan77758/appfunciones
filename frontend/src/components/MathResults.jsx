import React, { useState } from 'react';
import { KaTeXBlock } from '../utils/katex.jsx';

// Componente de tarjeta de resultado
function ResultCard({ icon, title, color, children, defaultOpen = true }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const colorClasses = {
        purple: 'border-accent/30 bg-accent/5',
        green: 'border-math-green/30 bg-math-green/5',
        blue: 'border-math-blue/30 bg-math-blue/5',
        amber: 'border-math-amber/30 bg-math-amber/5',
        rose: 'border-math-rose/30 bg-math-rose/5',
    };
    const titleColors = {
        purple: 'text-accent-light',
        green: 'text-math-green',
        blue: 'text-math-blue',
        amber: 'text-math-amber',
        rose: 'text-math-rose',
    };

    return (
        <div className={`rounded-xl border ${colorClasses[color]} backdrop-blur-sm overflow-hidden transition-all duration-300`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <h3 className={`font-semibold text-sm uppercase tracking-wider ${titleColors[color]}`}>
                        {title}
                    </h3>
                </div>
                <svg
                    className={`w-4 h-4 text-dark-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]">
                    {children}
                </div>
            )}
        </div>
    );
}

// Sub-componente para mostrar una notación del dominio/recorrido
function NotationBlock({ label, latex, description }) {
    return (
        <div className="mb-3 last:mb-0">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-medium block mb-1.5">
                {label}
            </span>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-dark-900/60 border border-dark-800">
                <KaTeXBlock latex={latex} display className="text-dark-100" />
            </div>
            {description && (
                <p className="text-xs text-dark-500 mt-1.5 italic">{description}</p>
            )}
        </div>
    );
}

export default function MathResults({ data }) {
    if (!data) return null;

    const { expression, expression_latex, domain, range, asymptotes, holes, discontinuities } = data;

    return (
        <div className="space-y-4">
            {/* Expresión original */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-900/50 border border-dark-800">
                <span className="text-sm text-dark-500 font-medium">f(x) =</span>
                <KaTeXBlock latex={expression_latex || expression} display className="text-xl text-dark-100" />
            </div>

            {/* Dominio */}
            {domain && (
                <ResultCard icon="📐" title="Dominio — D_f" color="purple">
                    <div className="space-y-3">
                        {domain.interval_latex && (
                            <NotationBlock label="Notación de Intervalos" latex={domain.interval_latex} />
                        )}
                        {domain.set_latex && (
                            <NotationBlock label="Notación de Conjuntos" latex={domain.set_latex} />
                        )}
                        {domain.formal_latex && (
                            <NotationBlock label="Descripción Formal" latex={domain.formal_latex} />
                        )}
                    </div>
                </ResultCard>
            )}

            {/* Recorrido */}
            {range && (
                <ResultCard icon="📊" title="Recorrido — Im(f)" color="green">
                    <div className="space-y-3">
                        {range.interval_latex && (
                            <NotationBlock label="Notación de Intervalos" latex={range.interval_latex} />
                        )}
                        {range.set_latex && (
                            <NotationBlock label="Notación de Conjuntos" latex={range.set_latex} />
                        )}
                        {range.formal_latex && (
                            <NotationBlock label="Descripción Formal" latex={range.formal_latex} />
                        )}
                    </div>
                </ResultCard>
            )}

            {/* Asíntotas */}
            {asymptotes && asymptotes.length > 0 && (
                <ResultCard icon="📈" title="Asíntotas" color="blue">
                    <div className="space-y-3">
                        {asymptotes.filter(a => a.type === 'vertical').length > 0 && (
                            <div>
                                <span className="text-xs text-math-blue uppercase tracking-wider font-medium block mb-2">
                                    Verticales
                                </span>
                                <div className="space-y-2">
                                    {asymptotes.filter(a => a.type === 'vertical').map((a, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-900/60 border border-dark-800">
                                            <div className="w-1 h-8 bg-math-rose/50 rounded"></div>
                                            <div>
                                                <div className="text-sm text-dark-200">
                                                    <KaTeXBlock latex={`x = ${a.latex_value || a.value}`} />
                                                </div>
                                                <div className="text-xs text-dark-500 mt-0.5">
                                                    <KaTeXBlock latex={`\\lim_{x \\to ${a.value}^+} f(x) = ${a.right_limit || '\\pm\\infty'}`} />
                                                    {', '}
                                                    <KaTeXBlock latex={`\\lim_{x \\to ${a.value}^-} f(x) = ${a.left_limit || '\\pm\\infty'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {asymptotes.filter(a => a.type === 'horizontal').length > 0 && (
                            <div>
                                <span className="text-xs text-math-blue uppercase tracking-wider font-medium block mb-2">
                                    Horizontales
                                </span>
                                <div className="space-y-2">
                                    {asymptotes.filter(a => a.type === 'horizontal').map((a, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-900/60 border border-dark-800">
                                            <div className="w-1 h-8 bg-math-blue/50 rounded"></div>
                                            <div>
                                                <div className="text-sm text-dark-200">
                                                    <KaTeXBlock latex={`y = ${a.latex_value || a.value}`} />
                                                </div>
                                                <div className="text-xs text-dark-500 mt-0.5">
                                                    {a.direction === 'both' && (
                                                        <KaTeXBlock latex={`\\lim_{x \\to \\pm\\infty} f(x) = ${a.value}`} />
                                                    )}
                                                    {a.direction === 'positive' && (
                                                        <KaTeXBlock latex={`\\lim_{x \\to +\\infty} f(x) = ${a.value}`} />
                                                    )}
                                                    {a.direction === 'negative' && (
                                                        <KaTeXBlock latex={`\\lim_{x \\to -\\infty} f(x) = ${a.value}`} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {asymptotes.filter(a => a.type === 'oblique').length > 0 && (
                            <div>
                                <span className="text-xs text-math-purple uppercase tracking-wider font-medium block mb-2">
                                    Oblicuas
                                </span>
                                <div className="space-y-2">
                                    {asymptotes.filter(a => a.type === 'oblique').map((a, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-900/60 border border-dark-800">
                                            <div className="w-1 h-8 bg-math-purple/50 rounded"></div>
                                            <div>
                                                <div className="text-sm text-dark-200">
                                                    <KaTeXBlock latex={`y = ${a.slope_latex || a.slope}x + ${a.intercept_latex || a.intercept}`} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ResultCard>
            )}

            {/* Discontinuidades */}
            {discontinuities && discontinuities.length > 0 && (
                <ResultCard icon="⚠️" title="Discontinuidades" color="amber">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-dark-500 uppercase tracking-wider border-b border-dark-800">
                                    <th className="text-left py-2 pr-4">Punto</th>
                                    <th className="text-left py-2 pr-4">Tipo</th>
                                    <th className="text-left py-2 pr-4">Lím. Izq.</th>
                                    <th className="text-left py-2 pr-4">Lím. Der.</th>
                                    <th className="text-left py-2">Observación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discontinuities.map((d, i) => (
                                    <tr key={i} className="border-b border-dark-800/50">
                                        <td className="py-2 pr-4">
                                            <KaTeXBlock latex={`x = ${d.latex_point || d.point}`} />
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${d.type === 'evitable' ? 'bg-math-amber/20 text-math-amber' :
                                                d.type === 'esencial_infinito' ? 'bg-math-rose/20 text-math-rose' :
                                                    'bg-math-blue/20 text-math-blue'
                                                }`}>
                                                {d.type === 'evitable' ? 'Evitable' :
                                                    d.type === 'esencial_infinito' ? 'Infinita' :
                                                        d.type === 'esencial_salto' ? 'De salto' : d.type}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-dark-300">
                                            <KaTeXBlock latex={d.left_limit_latex || d.left_limit} />
                                        </td>
                                        <td className="py-2 pr-4 text-dark-300">
                                            <KaTeXBlock latex={d.right_limit_latex || d.right_limit} />
                                        </td>
                                        <td className="py-2 text-dark-400 text-xs">
                                            {d.note}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ResultCard>
            )}

            {/* Agujeros */}
            {holes && holes.length > 0 && (
                <ResultCard icon="🕳️" title="Discontinuidades Evitables (Agujeros)" color="amber">
                    <div className="space-y-2">
                        {holes.map((h, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-900/60 border border-dark-800">
                                <div className="w-3 h-3 rounded-full border-2 border-math-amber bg-dark-950 flex-shrink-0"></div>
                                <div className="text-sm text-dark-200">
                                    <KaTeXBlock latex={`\\left( ${h.latex_x || h.x},\\; ${h.latex_limit || h.limit} \\right)`} />
                                    <span className="text-dark-500 text-xs ml-2">
                                        — El límite existe pero f({h.x}) no está definida
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ResultCard>
            )}

            {/* Advertencia si aplica */}
            {data.warning && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-math-amber/10 border border-math-amber/30">
                    <span className="text-math-amber text-lg">⚠️</span>
                    <div>
                        <p className="text-sm text-math-amber font-medium">Advertencia</p>
                        <p className="text-xs text-dark-400 mt-1">{data.warning}</p>
                    </div>
                </div>
            )}
        </div>
    );
}