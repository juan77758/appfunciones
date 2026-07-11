import React, { useState, useEffect, useRef, useCallback } from 'react';
import { KaTeXBlock } from '../utils/katex.jsx';

const QUICK_BUTTONS = [
    { label: 'x²', insert: 'x^2', tip: 'Cuadrado' },
    { label: 'xⁿ', insert: 'x^()', tip: 'Potencia', cursor: -1 },
    { label: '√', insert: 'sqrt()', tip: 'Raíz cuadrada', cursor: -1 },
    { label: '∛', insert: 'cbrt()', tip: 'Raíz cúbica', cursor: -1 },
    { label: '1/x', insert: '1/x', tip: 'Inverso' },
    { label: '|x|', insert: 'abs()', tip: 'Valor absoluto', cursor: -1 },
    { label: 'sin', insert: 'sin()', tip: 'Seno', cursor: -1 },
    { label: 'cos', insert: 'cos()', tip: 'Coseno', cursor: -1 },
    { label: 'tan', insert: 'tan()', tip: 'Tangente', cursor: -1 },
    { label: 'ln', insert: 'log()', tip: 'Logaritmo natural', cursor: -1 },
    { label: 'log', insert: 'log(,10)', tip: 'Logaritmo base 10', cursor: -1 },
    { label: 'exp', insert: 'exp()', tip: 'Exponencial', cursor: -1 },
    { label: 'asin', insert: 'asin()', tip: 'Arcoseno', cursor: -1 },
    { label: 'atan', insert: 'atan()', tip: 'Arcotangente', cursor: -1 },
    { label: 'π', insert: 'pi', tip: 'Pi' },
    { label: 'e', insert: 'E', tip: 'Número de Euler' },
    { label: '∞', insert: 'oo', tip: 'Infinito' },
    { label: '(', insert: '()', tip: 'Paréntesis', cursor: -1 },
    { label: ')', insert: ')', tip: 'Cerrar paréntesis' },
    { label: '/', insert: '/', tip: 'División' },
    { label: '^', insert: '^', tip: 'Exponente' },
    { label: '·', insert: '*', tip: 'Multiplicación' },
];

const EXAMPLES = [
    { label: '1/(x²−4)', value: '1/(x^2 - 4)' },
    { label: '√(x−1)', value: 'sqrt(x - 1)' },
    { label: 'ln(x+3)/(x−2)', value: 'log(x + 3)/(x - 2)' },
    { label: 'tan(x)', value: 'tan(x)' },
    { label: '(x²−1)/(x−1)', value: '(x^2 - 1)/(x - 1)' },
    { label: '√(4−x²)', value: 'sqrt(4 - x^2)' },
    { label: 'e^(1/x)', value: 'exp(1/x)' },
    { label: 'asin(x)', value: 'asin(x)' },
    { label: '1/x + sin(x)', value: '1/x + sin(x)' },
    { label: '|x|/(x)', value: 'abs(x)/x' },
];

export default function MathInput({ onAnalyze, isLoading, onValidate }) {
    const [expression, setExpression] = useState('');
    const [syntaxError, setSyntaxError] = useState(null);
    const [showExamples, setShowExamples] = useState(false);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Validación en tiempo real con debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!expression.trim()) {
            setSyntaxError(null);
            return;
        }

        debounceRef.current = setTimeout(() => {
            validateExpression(expression);
        }, 500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [expression]);

    const validateExpression = async (expr) => {
        try {
            const res = await fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: expr }),
            });
            const data = await res.json();
            if (!data.valid) {
                setSyntaxError(data.error);
            } else {
                setSyntaxError(null);
            }
        } catch {
            // Si el backend no está disponible, validación básica en frontend
            const basicCheck = basicSyntaxCheck(expr);
            setSyntaxError(basicCheck);
        }
    };

    const basicSyntaxCheck = (expr) => {
        let depth = 0;
        for (const ch of expr) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
            if (depth < 0) return 'Paréntesis de cierre sin apertura.';
        }
        if (depth > 0) return `${depth} paréntesis sin cerrar.`;
        if (/[+\-*/]{3,}/.test(expr.replace(/\s/g, ''))) return 'Operadores consecutivos inválidos.';
        return null;
    };

    const insertAtCursor = useCallback((text, cursorOffset = 0) => {
        const input = inputRef.current;
        if (!input) return;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const before = expression.substring(0, start);
        const after = expression.substring(end);
        const newExpr = before + text + after;
        setExpression(newExpr);

        requestAnimationFrame(() => {
            const newPos = start + text.length + cursorOffset;
            input.setSelectionRange(newPos, newPos);
            input.focus();
        });
    }, [expression]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!expression.trim() || syntaxError || isLoading) return;
        onAnalyze(expression.trim());
    };

    const handleExampleClick = (value) => {
        setExpression(value);
        setShowExamples(false);
        setSyntaxError(null);
        inputRef.current?.focus();
    };

    return (
        <div className="w-full">
            {/* Input principal */}
            <form onSubmit={handleSubmit} className="relative">
                <div className={`
                    relative flex items-center rounded-xl border-2 transition-all duration-300
                    ${syntaxError
                        ? 'border-math-rose/60 shadow-[0_0_15px_rgba(251,113,133,0.15)]'
                        : expression
                            ? 'border-accent/40 shadow-[0_0_15px_rgba(108,99,255,0.15)]'
                            : 'border-dark-700 hover:border-dark-600'
                    }
                    bg-dark-900/80 backdrop-blur-sm
                `}>
                    {/* Prefijo f(x) = */}
                    <div className="flex items-center pl-4 pr-2 text-accent/80 font-mono text-sm select-none">
                        <span className="text-dark-400">f(x)</span>
                        <span className="mx-2 text-dark-500">=</span>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="Ingresa tu función... (ej: 1/(x^2 - 4))"
                        className="flex-1 bg-transparent py-4 px-2 text-lg font-mono text-dark-100 placeholder:text-dark-600 focus:outline-none"
                        autoComplete="off"
                        spellCheck={false}
                        disabled={isLoading}
                    />

                    <button
                        type="submit"
                        disabled={!expression.trim() || syntaxError || isLoading}
                        className={`
                            mr-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200
                            ${!expression.trim() || syntaxError || isLoading
                                ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                                : 'bg-accent hover:bg-accent-light text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95'
                            }
                        `}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Analizando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                Analizar
                            </span>
                        )}
                    </button>
                </div>

                {/* Error de sintaxis */}
                {syntaxError && (
                    <div className="mt-2 flex items-start gap-2 text-math-rose text-sm px-1">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{syntaxError}</span>
                    </div>
                )}
            </form>

            {/* Preview KaTeX */}
            {expression && !syntaxError && (
                <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-900/50 border border-dark-800">
                    <span className="text-dark-500 text-xs font-medium uppercase tracking-wider">Preview:</span>
                    <span className="text-dark-200">
                        f(x) = <KaTeXBlock latex={expression} />
                    </span>
                </div>
            )}

            {/* Botones rápidos */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-dark-500 uppercase tracking-wider font-medium">
                        Operadores rápidos
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowExamples(!showExamples)}
                        className="text-xs text-accent hover:text-accent-light transition-colors"
                    >
                        {showExamples ? 'Ocultar ejemplos' : 'Ver ejemplos →'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {QUICK_BUTTONS.map((btn, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => insertAtCursor(btn.insert, btn.cursor || 0)}
                            disabled={isLoading}
                            className="tooltip px-2.5 py-1.5 rounded-md bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-accent/30 text-sm font-mono text-dark-300 hover:text-accent-light transition-all duration-150 disabled:opacity-40"
                            data-tip={btn.tip}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ejemplos */}
            {showExamples && (
                <div className="mt-3 p-3 rounded-lg bg-dark-900/50 border border-dark-800">
                    <p className="text-xs text-dark-500 mb-2 uppercase tracking-wider font-medium">
                        Funciones de ejemplo
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLES.map((ex, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleExampleClick(ex.value)}
                                className="px-3 py-1.5 rounded-md bg-dark-800 hover:bg-accent/20 border border-dark-700 hover:border-accent/40 text-sm text-dark-300 hover:text-accent-light transition-all duration-150 font-mono"
                            >
                                {ex.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}