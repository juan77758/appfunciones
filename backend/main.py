"""
API FastAPI para el Calculador Analítico de Funciones.
Endpoints para análisis de funciones reales con SymPy.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import concurrent.futures
import traceback
import signal
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from solver import analyze_function, validate_expression

app = FastAPI(
    title="Calculador Analítico de Funciones",
    description="API para calcular dominio, recorrido, asíntotas y discontinuidades de funciones reales usando SymPy.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
CALCULATION_TIMEOUT = 10


class AnalyzeRequest(BaseModel):
    expression: str = Field(..., description="Expresión matemática en notación SymPy")


class ValidateRequest(BaseModel):
    expression: str = Field(..., description="Expresión matemática a validar")


@app.get("/")
async def root():
    return {
        "name": "Calculador Analítico de Funciones",
        "version": "1.0.0",
        "status": "running",
        "engine": "SymPy",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    expression = req.expression.strip()

    if not expression:
        raise HTTPException(status_code=400, detail="La expresión no puede estar vacía.")

    try:
        future = executor.submit(analyze_function, expression)
        result = future.result(timeout=CALCULATION_TIMEOUT)
    except concurrent.futures.TimeoutError:
        future.cancel()
        return {
            "expression": expression,
            "expression_latex": expression,
            "error": None,
            "warning": "El cálculo excedió el tiempo límite (10s). La función puede ser demasiado compleja.",
            "domain": {
                "interval_latex": r"\text{No determinado — complejidad excesiva}",
                "set_latex": r"\text{No determinado}",
                "formal_latex": r"\text{Cálculo no completado}",
            },
            "range": {
                "interval_latex": r"\text{No determinado — complejidad excesiva}",
                "set_latex": r"\text{No determinado}",
                "formal_latex": r"\text{Cálculo no completado}",
            },
            "asymptotes": [],
            "holes": [],
            "discontinuities": [],
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno en el motor de cálculo: {str(e)}"
        )

    if 'error' in result and result['error']:
        return {
            "expression": expression,
            "expression_latex": expression,
            "error": result['error'],
            "warning": None,
            "domain": None,
            "range": None,
            "asymptotes": [],
            "holes": [],
            "discontinuities": [],
        }

    return result


@app.post("/api/validate")
async def validate(req: ValidateRequest):
    expression = req.expression.strip()

    if not expression:
        return {"valid": True, "error": None}

    try:
        result = validate_expression(expression)
        return result
    except Exception as e:
        return {
            "valid": False,
            "error": f"Error de validación: {str(e)}"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")