import React from 'react';
import katex from 'katex';

/**
 * Renderiza una expresión LaTeX a HTML usando KaTeX
 */
export function renderLatex(latexStr, displayMode = false) {
    if (!latexStr) return '';
    try {
        return katex.renderToString(latexStr, {
            displayMode,
            throwOnError: false,
            trust: true,
            strict: false,
            macros: {
                '\\R': '\\mathbb{R}',
                '\\N': '\\mathbb{N}',
                '\\Z': '\\mathbb{Z}',
                '\\Q': '\\mathbb{Q}',
                '\\C': '\\mathbb{C}',
            }
        });
    } catch (e) {
        return `<span class="text-math-rose">${latexStr}</span>`;
    }
}

/**
 * Componente React inline para renderizar KaTeX
 */
export function KaTeXBlock({ latex, display = false, className = '' }) {
    if (!latex) return null;
    const html = renderLatex(latex, display);
    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}