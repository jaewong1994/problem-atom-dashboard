"""Independent symbolic witness from the first accepted live Sol composition."""
import unittest
import sympy as S


class SessionMathTests(unittest.TestCase):
    def test_inverse_integer_root_sum_and_degenerate_coefficient(self):
        x,p,q,r,total=S.symbols('x p q r total',real=True)
        d=S.diff((x-p)*(x-q)*(x-r),x)
        equation=S.expand(d.subs(x,total))
        expected=r*(p+q-2*total)+3*total**2-2*(p+q)*total+p*q
        self.assertEqual(S.expand(equation-expected),0)
        degenerate=S.simplify(equation.subs(total,(p+q)/2))
        self.assertEqual(S.expand(degenerate+(p-q)**2/4),0)
        # The actual fifth question: both integer roots, or exactly one integer.
        self.assertEqual(S.solve(S.Eq(S.Rational(2,3)*(3+r),4),r),[3])
        self.assertEqual(S.solve(equation.subs({p:0,q:3,total:4}),r),[S.Rational(24,5)])
        self.assertEqual(S.solve(d.subs({p:0,q:3,r:3}),x),[1,3])
        self.assertEqual(S.solve(d.subs({p:0,q:3,r:S.Rational(24,5)}),x),[S.Rational(6,5),4])
        self.assertEqual(5*(1*(1-3)*(1-3)+1*(1-3)*(1-S.Rational(24,5))),58)

    def test_equal_values_cubic_bridge_with_both_leading_signs(self):
        x,k,B,C,p,q=S.symbols('x k B C p q',real=True)
        # The premise p != q is part of the equal_values input type.
        solved_c=-k*(p*p+p*q+q*q)-B*(p+q)
        discriminant=S.discriminant(3*k*x*x+2*B*x+solved_c,x)
        positive_form=4*(B+S.Rational(3,2)*k*(p+q))**2+3*k*k*(p-q)**2
        self.assertEqual(S.expand(discriminant-positive_form),0)
        for leading in [-3,1,5]:
            for left,right in [(-2,1),(0,6),(1,2)]:
                for coefficient in [-10,0,8]:
                    self.assertGreater(discriminant.subs({k:leading,p:left,q:right,B:coefficient}),0)
        # Dropping distinctness permits x^3 and a repeated derivative root.
        self.assertEqual(S.discriminant(3*x*x,x),0)

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
