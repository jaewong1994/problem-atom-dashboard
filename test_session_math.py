"""Independent symbolic witness from the first accepted live Sol composition."""
import unittest
import sympy as S


class SessionMathTests(unittest.TestCase):
    def test_integral_extrema_integer_filter(self):
        x, t, a = S.symbols('x t a', real=True)
        derivative = (x-1)*(x-S.sqrt(2))
        f = S.integrate(derivative, x)
        g = S.integrate((f-f.subs(x, t))*(t*t+1), (t, a, x))
        positive_factor = 1 + (x*x+x*a+a*a)/3
        expected = derivative*(x-a)*positive_factor
        self.assertEqual(S.simplify(S.diff(g, x)-expected), 0)
        # This factor is >= 1 everywhere, so it creates no hidden real zeros.
        self.assertEqual(S.expand(positive_factor-(1+(x+a/2)**2/3+a*a/4)), 0)
        # Independently evaluate derivative signs across every possible order,
        # including the two collisions, rather than counting equation roots.
        cases = [-2, 0, 1, (1+S.sqrt(2))/2, S.sqrt(2), 2, 4]
        for value in cases:
            roots = sorted(set([S.Integer(1), S.sqrt(2), S.sympify(value)]), key=float)
            samples = [roots[0]-1] + [(u+v)/2 for u,v in zip(roots, roots[1:])] + [roots[-1]+1]
            signs = [S.sign(S.simplify(S.diff(g,x).subs({a:value,x:p}))) for p in samples]
            self.assertTrue(all(s in [-1,1] for s in signs))
            changes = sum(u!=v for u,v in zip(signs,signs[1:]))
            self.assertEqual(changes, 1 if value in [1,S.sqrt(2)] else 3)
        candidates = [S.Integer(1), S.sqrt(2)]
        self.assertEqual([v for v in candidates if v.is_integer], [1])
        self.assertEqual(sum(v for v in candidates if v.is_integer), 1)


if __name__ == '__main__':
    unittest.main()
