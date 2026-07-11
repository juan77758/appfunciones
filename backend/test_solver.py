"""Test script for the solver module."""
from solver import analyze_function
import json

# Test 1: 1/(x^2 - 4)
result = analyze_function('1/(x^2 - 4)')
print("=== Test 1: 1/(x^2 - 4) ===")
print(json.dumps(result, indent=2, default=str))
print()

# Test 2: sqrt(x - 1)
result = analyze_function('sqrt(x - 1)')
print("=== Test 2: sqrt(x - 1) ===")
print(json.dumps(result, indent=2, default=str))
print()

# Test 3: ln(x+3)/(x-2)
result = analyze_function('log(x + 3)/(x - 2)')
print("=== Test 3: log(x+3)/(x-2) ===")
print(json.dumps(result, indent=2, default=str))
print()

# Test 4: (x^2-1)/(x-1)
result = analyze_function('(x^2 - 1)/(x - 1)')
print("=== Test 4: (x^2-1)/(x-1) ===")
print(json.dumps(result, indent=2, default=str))