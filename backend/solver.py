"""
Módulo de análisis matemático formal usando SymPy.
Calcula dominio, recorrido, asíntotas y discontinuidades de funciones reales.
"""

import sympy as sp
from sympy import (
    Symbol, S, oo, pi, E, sqrt, log, exp, sin, cos, tan,
    asin, acos, atan, Abs, Rational, latex, simplify,
    limit, solveset, Interval, Union, EmptySet, FiniteSet,
    Intersection, Complement, Reals, ImageSet, Lambda,
    symbols, Function, Eq, solve, factor, cancel, apart,
    calculus, Piecewise, And, Or
)
from sympy.calculus.util import continuous_domain, function_range
from sympy.core.function import AppliedUndef
from sympy.sets.sets import Set
import traceback
import signal
import sys


class TimeoutError(Exception):
    pass


def timeout_handler(signum, frame):
    raise TimeoutError("Cálculo excedió el tiempo límite")


def parse_expression(expr_str: str):
    """Parsea una expresión string a un objeto SymPy con validación."""
    x = Symbol('x')
    
    # Preprocesamiento: reemplazos de notación común
    expr_str = expr_str.strip()
    # Convert ^ to ** (SymPy uses ** for exponentiation)
    expr_str = expr_str.replace('^', '**')
    
    # Diccionario de funciones permitidas
    local_dict = {
        'x': x,
        'X': x,
        'pi': pi,
        'PI': pi,
        'Pi': pi,
        'e': E,
        'E': E,
        'sin': sin,
        'cos': cos,
        'tan': tan,
        'asin': asin,
        'arcsin': asin,
        'acos': acos,
        'arccos': acos,
        'atan': atan,
        'arctan': atan,
        'sqrt': sqrt,
        'cbrt': lambda expr: expr ** (sp.Rational(1, 3)),
        'abs': Abs,
        'Abs': Abs,
        'log': log,
        'ln': log,
        'exp': exp,
        'oo': oo,
        'inf': oo,
        'infinity': oo,
    }
    
    try:
        expr = sp.sympify(expr_str, locals=local_dict)
        return expr, x
    except Exception as e:
        raise ValueError(f"Expresión no válida: {str(e)}")


def compute_domain(expr, x):
    """Calcula el dominio natural de la función sobre los reales."""
    try:
        domain_set = continuous_domain(expr, x, domain=Reals)
        return domain_set
    except Exception as e:
        # Fallback: intentar análisis manual
        return _manual_domain(expr, x)


def _manual_domain(expr, x):
    """Análisis manual del dominio cuando SymPy falla."""
    domain = Reals
    
    # Denominadores
    numer, denom = sp.fraction(expr)
    if denom != 1:
        singularities = solveset(denom, x, domain=Reals)
        if singularities != EmptySet:
            domain = Complement(domain, singularities)
    
    # Raíces pares
    for atom in expr.atoms(sp.Pow):
        base, exp_val = atom.as_base_exp()
        if exp_val.is_rational and exp_val.q == 2:
            ineq = solveset(base >= 0, x, domain=Reals)
            domain = Intersection(domain, ineq)
    
    # Logaritmos
    for func in expr.atoms(sp.log):
        if len(func.args) == 1:
            ineq = solveset(func.args[0] > 0, x, domain=Reals)
            domain = Intersection(domain, ineq)
    
    # arcsin, arccos
    for func in expr.atoms(sp.asin, sp.acos):
        if len(func.args) == 1:
            ineq = solveset(And(func.args[0] >= -1, func.args[0] <= 1), x, domain=Reals)
            domain = Intersection(domain, ineq)
    
    return domain


def compute_range(expr, x):
    """Calcula el recorrido (imagen) de la función."""
    try:
        range_set = function_range(expr, x, domain=Reals)
        return range_set
    except Exception:
        return S.Reals  # Fallback


def set_to_interval_latex(domain_set):
    """Convierte un conjunto SymPy a notación de intervalos en LaTeX."""
    if domain_set == Reals:
        return r"\mathbb{R}"
    if domain_set == EmptySet:
        return r"\emptyset"
    
    if isinstance(domain_set, Union):
        parts = []
        for arg in domain_set.args:
            parts.append(interval_to_latex(arg))
        return r" \cup ".join(parts)
    
    if isinstance(domain_set, Complement):
        # Intentar representar como unión de intervalos
        return _complement_to_intervals_latex(domain_set)
    
    if isinstance(domain_set, Intersection):
        # Intentar simplificar
        return _intersection_to_latex(domain_set)
    
    if isinstance(domain_set, Interval):
        return interval_to_latex(domain_set)
    
    if isinstance(domain_set, FiniteSet):
        elements = sorted(domain_set.args, key=lambda e: float(e))
        inner = ", ".join([latex(e) for e in elements])
        return r"\{" + inner + r"\}"
    
    # Fallback
    try:
        return latex(domain_set)
    except:
        return str(domain_set)


def interval_to_latex(interval):
    """Convierte un Interval a LaTeX."""
    if isinstance(interval, Interval):
        left = r"(" if interval.left_open else r"["
        right = r")" if interval.right_open else r"]"
        a = r"-\infty" if interval.start == -oo else latex(interval.start)
        b = r"+\infty" if interval.end == oo else latex(interval.end)
        return f"{left}{a}, {b}{right}"
    return latex(interval)


def _complement_to_latex(comp):
    """Intenta convertir Complement a LaTeX legible."""
    try:
        return latex(comp)
    except:
        return str(comp)


def _complement_to_intervals_latex(comp):
    """Convierte Complement a representación de intervalos."""
    try:
        # Si es R menos un conjunto finito
        base = comp.args[0]
        removed = comp.args[1]
        
        if base == Reals and isinstance(removed, FiniteSet):
            elements = sorted([float(e) for e in removed.args])
            parts = []
            current = -oo
            for e in sorted(elements):
                e_sym = sp.nsimplify(e)
                parts.append(f"({latex(current)}, {latex(e_sym)})")
                current = e_sym
            parts.append(f"({latex(current)}, +\\infty)")
            return " \\cup ".join(parts)
        
        if base == Reals and isinstance(removed, Interval):
            start = removed.start
            end = removed.end
            if not removed.left_open and not removed.right_open:
                return f"(-\\infty, {latex(start)}) \\cup ({latex(end)}, +\\infty)"
        
        return latex(comp)
    except:
        return str(comp)


def _intersection_to_latex(inter):
    """Convierte Intersection a LaTeX."""
    try:
        # Intentar simplificar a un solo intervalo
        simplified = inter
        if isinstance(simplified, Intersection):
            parts = [p for p in simplified.args]
            intervals = [p for p in parts if isinstance(p, Interval)]
            if len(intervals) == 1:
                return interval_to_latex(intervals[0])
        return latex(inter)
    except:
        return str(inter)


def set_to_set_latex(domain_set):
    """Genera notación de conjuntos {x ∈ R | ...}."""
    if domain_set == Reals:
        return r"\{x \in \mathbb{R}\}"
    if domain_set == EmptySet:
        return r"\emptyset"
    
    if isinstance(domain_set, Interval):
        if not domain_set.left_open and not domain_set.right_open:
            if domain_set.start == -oo and domain_set.end == oo:
                return r"\{x \in \mathbb{R}\}"
        a = r"-\infty" if domain_set.start == -oo else latex(domain_set.start)
        b = r"+\infty" if domain_set.end == oo else latex(domain_set.end)
        
        conditions = []
        if domain_set.start != -oo:
            op = r"\leq" if not domain_set.left_open else r"<"
            conditions.append(f"{a} {op} x")
        if domain_set.end != oo:
            op = r"\leq" if not domain_set.right_open else r"<"
            conditions.append(f"x {op} {b}")
        
        condition = r" \land ".join(conditions)
        return r"\{x \in \mathbb{R} \mid " + condition + r"\}"
    
    try:
        return r"\{x \in \mathbb{R} \mid " + latex(sp.contains(Symbol('x'), domain_set)) + r"\}"
    except:
        return set_to_interval_latex(domain_set)


def set_to_formal_latex(domain_set):
    """Genera descripción formal con cuantificadores."""
    if domain_set == Reals:
        return r"\forall x \in \mathbb{R},\; f(x) \text{ está definida}"
    if domain_set == EmptySet:
        return r"\nexists x \in \mathbb{R} \mid f(x) \text{ está definida}"
    
    interval_str = set_to_interval_latex(domain_set)
    return r"\forall x \in " + interval_str + r",\; f(x) \in \mathbb{R}"


def find_singularity_points(expr, x):
    """Encuentra puntos de singularidad (excluidos del dominio)."""
    singularities = set()
    
    # Usar la expresión original (NO simplify) para no cancelar factores comunes
    numer, denom = sp.fraction(expr)
    
    # Singularidades por denominador
    if denom != 1:
        try:
            sols = solveset(denom, x, domain=Reals)
            if isinstance(sols, FiniteSet):
                for s in sols:
                    if s.is_real:
                        singularities.add(s)
        except:
            pass
    
    return singularities


def classify_discontinuity(expr, x, point):
    """Clasifica el tipo de discontinuidad en un punto."""
    result = {
        'point': float(point),
        'latex_point': latex(point),
        'type': None,
        'left_limit': None,
        'right_limit': None,
        'left_limit_latex': None,
        'right_limit_latex': None,
        'note': ''
    }
    
    try:
        lim_left = limit(expr, x, point, '-')
        lim_right = limit(expr, x, point, '+')
        
        result['left_limit_latex'] = latex(lim_left)
        result['right_limit_latex'] = latex(lim_right)
        
        # Verificar si el límite es infinito
        if lim_left == oo or lim_left == -oo or lim_right == oo or lim_right == -oo:
            result['type'] = 'esencial_infinito'
            result['left_limit'] = latex(lim_left)
            result['right_limit'] = latex(lim_right)
            result['note'] = 'Asíntota vertical'
        elif lim_left == lim_right:
            # El límite existe → discontinuidad evitable
            result['type'] = 'evitable'
            result['left_limit'] = latex(lim_left)
            result['right_limit'] = latex(lim_right)
            result['note'] = f'Agujero: lim = {latex(lim_left)}'
        else:
            # Límites laterales diferentes → salto
            result['type'] = 'esencial_salto'
            result['left_limit'] = latex(lim_left)
            result['right_limit'] = latex(lim_right)
            result['note'] = f'Salto: |Δ| = {latex(simplify(Abs(lim_right - lim_left)))}'
    except Exception:
        result['type'] = 'esencial_infinito'
        result['left_limit_latex'] = r'\pm\infty'
        result['right_limit_latex'] = r'\pm\infty'
        result['note'] = 'No se pudo evaluar el límite'
    
    return result


def find_asymptotes(expr, x):
    """Encuentra todas las asíntotas de la función."""
    asymptotes = []
    singularity_points = find_singularity_points(expr, x)
    
    # Asíntotas verticales
    for point in singularity_points:
        try:
            lim_right = limit(expr, x, point, '+')
            lim_left = limit(expr, x, point, '-')
            
            is_va = False
            if lim_right in (oo, -oo) or (hasattr(lim_right, 'is_infinite') and lim_right.is_infinite):
                is_va = True
            if lim_left in (oo, -oo) or (hasattr(lim_left, 'is_infinite') and lim_left.is_infinite):
                is_va = True
            
            if is_va:
                asymptotes.append({
                    'type': 'vertical',
                    'value': float(point),
                    'latex_value': latex(point),
                    'left_limit': latex(lim_left),
                    'right_limit': latex(lim_right),
                })
        except:
            asymptotes.append({
                'type': 'vertical',
                'value': float(point),
                'latex_value': latex(point),
                'left_limit': r'-\infty',
                'right_limit': r'+\infty',
            })
    
    # Asíntotas horizontales
    try:
        lim_pos = limit(expr, x, oo)
        lim_neg = limit(expr, x, -oo)
        
        has_ha = False
        
        if lim_pos.is_finite and lim_pos.is_real:
            asymptotes.append({
                'type': 'horizontal',
                'value': float(lim_pos),
                'latex_value': latex(lim_pos),
                'direction': 'positive',
            })
            has_ha = True
        
        if lim_neg.is_finite and lim_neg.is_real:
            if has_ha and float(lim_neg) == float(lim_pos):
                # Mismo valor, actualizar dirección
                asymptotes[-1]['direction'] = 'both'
            else:
                asymptotes.append({
                    'type': 'horizontal',
                    'value': float(lim_neg),
                    'latex_value': latex(lim_neg),
                    'direction': 'negative',
                })
        
        # Asíntota oblicua si no hay horizontal
        if not has_ha and lim_pos not in (oo, -oo) and not lim_pos.is_finite:
            try:
                m = limit(expr / x, x, oo)
                if m.is_finite and m != 0:
                    b = limit(expr - m * x, x, oo)
                    if b.is_finite:
                        asymptotes.append({
                            'type': 'oblique',
                            'slope': float(m),
                            'intercept': float(b),
                            'slope_latex': latex(m),
                            'intercept_latex': latex(b),
                        })
            except:
                pass
    except:
        pass
    
    return asymptotes


def find_holes(expr, x):
    """Encuentra discontinuidades evitables (agujeros)."""
    holes = []
    singularity_points = find_singularity_points(expr, x)
    
    for point in singularity_points:
        try:
            lim_val = limit(expr, x, point)
            if lim_val.is_finite and lim_val.is_real:
                holes.append({
                    'x': float(point),
                    'limit': float(lim_val),
                    'latex_x': latex(point),
                    'latex_limit': latex(lim_val),
                })
        except:
            pass
    
    return holes


def analyze_function(expr_str: str) -> dict:
    """
    Función principal de análisis.
    Retorna un diccionario con toda la información analítica.
    """
    try:
        expr, x = parse_expression(expr_str)
    except ValueError as e:
        return {'error': str(e)}
    
    result = {
        'expression': expr_str,
        'expression_latex': latex(expr),
        'domain': None,
        'range': None,
        'asymptotes': [],
        'holes': [],
        'discontinuities': [],
        'warning': None,
    }
    
    # Dominio
    try:
        domain_set = compute_domain(expr, x)
        result['domain'] = {
            'interval_latex': set_to_interval_latex(domain_set),
            'set_latex': set_to_set_latex(domain_set),
            'formal_latex': set_to_formal_latex(domain_set),
        }
    except Exception as e:
        result['warning'] = f"No se pudo calcular el dominio exacto: {str(e)}"
        result['domain'] = {
            'interval_latex': r"\mathbb{R}",
            'set_latex': r"\{x \in \mathbb{R}\}",
            'formal_latex': r"\forall x \in \mathbb{R},\; f(x) \in \mathbb{R}",
        }
    
    # Recorrido
    try:
        range_set = compute_range(expr, x)
        result['range'] = {
            'interval_latex': set_to_interval_latex(range_set),
            'set_latex': f"\\{{y \\in \\mathbb{{R}} \\mid y \\in {latex(range_set)}\\}}",
            'formal_latex': f"\\text{{Im}}(f) = {latex(range_set)}",
        }
    except Exception as e:
        result['range'] = {
            'interval_latex': r"\mathbb{R}",
            'set_latex': r"\{y \in \mathbb{R}\}",
            'formal_latex': r"\text{No se pudo determinar el recorrido exacto}",
        }
    
    # Asíntotas
    try:
        result['asymptotes'] = find_asymptotes(expr, x)
    except Exception:
        pass
    
    # Agujeros
    try:
        result['holes'] = find_holes(expr, x)
    except Exception:
        pass
    
    # Discontinuidades (tabla completa)
    singularity_points = find_singularity_points(expr, x)
    for point in singularity_points:
        try:
            disc = classify_discontinuity(expr, x, point)
            result['discontinuities'].append(disc)
        except:
            pass
    
    return result


def validate_expression(expr_str: str) -> dict:
    """Valida si una expresión es sintácticamente correcta."""
    try:
        expr, x = parse_expression(expr_str)
        
        # Verificar que tiene la variable x
        free_vars = expr.free_symbols
        if x not in free_vars and not expr.is_number:
            return {'valid': True, 'warning': 'La expresión no contiene la variable x'}
        
        return {'valid': True}
    except ValueError as e:
        return {'valid': False, 'error': str(e)}
    except Exception as e:
        return {'valid': False, 'error': f"Error de sintaxis: {str(e)}"}