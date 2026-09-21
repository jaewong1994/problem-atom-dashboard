"""Render approved-format generated results with the installed math HWPX kit.

This adapter uses its native equation/endnote writer and template, never a new
ZIP/XML document implementation. Output is a review draft, not an approval.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


def prepare_latex(latex):
    """Parse TeX arguments before the legacy converter can discard commands.

    The kit accepts brace-based arguments and silently prints unknown commands.
    Keep this compatibility boundary here, without changing the shared vendor.
    """
    styles = set('displaystyle textstyle scriptstyle scriptscriptstyle limits nolimits displaylimits'.split())
    unary = set('sqrt overline bar vec boxed text mathrm'.split())
    simple = set(('leftarrow Leftarrow rightarrow Rightarrow leqq geqq leq geq le ge '
                  'neq ne times cdot div pm mp infty pi theta alpha beta gamma delta '
                  'lambda mu sigma omega phi psi varepsilon epsilon to in subset cup cap '
                  'therefore because ldots cdots dots log ln sin cos tan sec csc cot '
                  'lim sum prod int max min quad qquad angle triangle choose').split())
    aliases = {'lvert': '|', 'rvert': '|', 'vert': '|', 'mid': '|',
               'lbrace': r'\{', 'rbrace': r'\}'}
    fonts = {'mathbb', 'mathcal', 'mathbf', 'mathit', 'operatorname', 'textrm'}
    # Unsupported font families are not silently flattened: e.g. mathcal F and
    # F may name different objects. Only number-set letters have a known alias.
    pos = 0
    environments = []

    def fail(message):
        raise ValueError(message)

    def space():
        nonlocal pos
        while pos < len(latex) and latex[pos].isspace():
            pos += 1

    def group(end=None, depth=0):
        nonlocal pos
        if depth > 60:
            fail('수식의 중첩이 너무 깊습니다.')
        out = []
        while pos < len(latex):
            if end and latex[pos] == end:
                pos += 1
                return ''.join(out)
            if latex[pos] == '}':
                fail('수식의 중괄호 짝이 맞지 않습니다.')
            out.append(atom(depth + 1))
        if end:
            fail('수식의 중괄호가 닫히지 않았습니다.')
        return ''.join(out)

    def argument(depth):
        nonlocal pos
        space()
        if pos >= len(latex) or latex[pos] in '}^_&':
            fail('수식 명령의 인자가 없습니다.')
        if latex[pos] == '{':
            pos += 1
            return group('}', depth)
        return atom(depth)

    def atom(depth):
        nonlocal pos
        if depth > 60:
            fail('수식의 중첩이 너무 깊습니다.')
        ch = latex[pos]
        pos += 1
        if ch == '{':
            return '{' + group('}', depth) + '}'
        if ch in '^_':
            return ch + '{' + argument(depth) + '} '
        if ch != '\\':
            return ch
        if pos >= len(latex):
            fail('수식 명령이 잘렸습니다.')
        match = re.match(r'[A-Za-z]+|.', latex[pos:], re.S)
        cmd = match.group()
        pos += len(cmd)
        if cmd in styles:
            return ' '
        if cmd in aliases:
            return aliases[cmd]
        if cmd in {'frac', 'dfrac', 'tfrac', 'binom'}:
            return '\\' + ('binom' if cmd == 'binom' else 'frac') + '{' + argument(depth) + '}{' + argument(depth) + '}'
        if cmd == 'sqrt':
            space()
            index = ''
            if pos < len(latex) and latex[pos] == '[':
                pos += 1
                index = '[' + group(']', depth) + ']'
            return r'\sqrt' + index + '{' + argument(depth) + '}'
        if cmd in unary:
            return '\\' + cmd + '{' + argument(depth) + '}'
        if cmd in fonts:
            inner = argument(depth).strip()
            if cmd == 'mathbb' and re.fullmatch('[RNZQC]', inner):
                return r'\mathrm{' + inner + '}'
            if cmd == 'textrm':
                return r'\mathrm{' + inner + '}'
            fail('한글 출력에서 지원하지 않는 수식 명령: \\' + cmd)
        if cmd in {'begin', 'end'}:
            env = argument(depth)
            if env != 'cases':
                fail('한글 출력에서 지원하지 않는 수식 환경: ' + env)
            if cmd == 'begin':
                environments.append(env)
            elif not environments or environments.pop() != env:
                fail('수식 환경의 시작과 끝이 맞지 않습니다.')
            return '\\' + cmd + '{cases}'
        if cmd == '\\':
            if not environments:
                fail('수식 안 줄바꿈은 cases 환경에서만 지원합니다.')
            return r'\\'
        if cmd in {'left', 'right', 'middle', 'big', 'Big', 'bigg', 'Bigg',
                   'bigl', 'bigr', 'Bigl', 'Bigr', 'biggl', 'biggr', 'Biggl', 'Biggr'}:
            # Retain delimiter commands; the kit pairs/stretchs their glyphs.
            return '\\' + cmd + ' '
        if cmd in simple:
            return '\\' + cmd + ' '
        if cmd in {'{', '}', '|', '!', ',', ';', ':', ' '}:
            return '\\' + cmd
        fail('한글 출력에서 지원하지 않는 수식 명령: \\' + cmd)

    result = group()
    if environments:
        fail('수식 환경이 닫히지 않았습니다.')
    return result


def build(items, output, skills):
    math_root = Path(skills) / 'math-ocr-hwpx'
    sys.path[:0] = [str(math_root / 'scripts'), str(Path(skills) / 'korean-hwp-math-typesetting/scripts')]
    import equation_bridge as bridge
    import latex_hwpx_writer as writer
    import normalize_math as normalizer
    from check_hwpx_math import check_xml
    template = math_root / 'assets/hwpx_template'
    writer._note_num[0] = 0
    writer._eq_id[0] = 50000
    writer._p_id[0] = 80000

    def paragraphs(lines):
        out = []
        for original in lines:
            if not isinstance(original, str) or len(original) > 50000:
                raise ValueError('본문과 해설의 길이 또는 형식이 다릅니다.')
            if re.search(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', original):
                raise ValueError('수식에 제어문자가 있습니다. LaTeX 역슬래시를 확인하세요.')
            # Student-facing content only; internal titles/roles never enter here.
            original = re.sub(r'\[\s*\d+\s*점\s*\]|^\s*\d+\s*점\s*$', '', original)
            original = re.sub(r'^\s*(?:#{1,6}\s+|\d+[.)]\s+)', '', original)
            original = original.replace('**', '')
            segments = []
            def flush():
                nonlocal segments
                if segments:
                    out.append({'paraPr': '1', 'segs': segments})
                    segments = []
            for kind, value in bridge.split_math(original):
                chunks = [(kind, value)] if kind == 'math' else bridge.split_math(normalizer.wrap_math_phrases(value))
                for k, text in chunks:
                    if k == 'text':
                        if '$' in text or '\\' in text:
                            raise ValueError('닫히지 않은 수식 또는 지원하지 않는 수식 구분자가 있습니다.')
                        for index, part in enumerate(text.split('\n')):
                            if index:
                                flush()
                            if part:
                                segments.append(('t', part, '1'))
                    else:
                        if re.search(r'\\(?:includegraphics|href|url|html|input|def|newcommand)\b', text):
                            raise ValueError('그림·외부 명령은 한글 출력에서 지원하지 않습니다.')
                        # Ordinary Korean prose between two complete formulas is text.
                        parts = re.split(r'\\text\{([가-힣 ]+)\}', text) if '\\begin' not in text else [text]
                        for part_index, part in enumerate(parts):
                            if part_index % 2:
                                segments.append(('t', ' ' + part.strip() + ' ', '1'))
                                continue
                            part = re.sub(r'^\s*(?:\\q?quad\s*)+|(?:\\q?quad\s*)+$', '', part).strip()
                            if not part:
                                continue
                            # \, is a TeX spacing command, never a printed list comma.
                            part = prepare_latex(part).replace(r'\,', r'\;')
                            for i, phrase in enumerate(normalizer.split_list_commas(part)):
                                if i:
                                    segments.append(('t', ', ', '1'))
                                script = bridge.latex_to_hwp_script(normalizer.normalize_latex(phrase.replace('\n', ' ')))
                                if not script.strip():
                                    raise ValueError('빈 수식으로 변환된 구절이 있습니다.')
                                if re.search(r'\b(?:frac|dfrac|tfrac|begin|end|includegraphics|displaystyle|textstyle|mathbb|limits)\b', script):
                                    raise ValueError('변환되지 않은 LaTeX 명령이 남았습니다. 수식을 확인하세요.')
                                segments.append(('eq', script))
            flush()
        return out

    document = []
    for item in items:
        body = paragraphs(item['question'])
        notes = paragraphs(['[정답] ' + item['answer'], *item['solution']])
        if notes:
            notes[0]['segs'].insert(0, ('t', ' ', '1'))
        if not body or not notes:
            raise ValueError('본문 또는 해설이 비어 있습니다.')
        # One native note anchor serves as the problem number.
        body[0]['segs'][:0] = [('endnote', notes), ('t', ' ', '1')]
        document.append(body)
    prefix = (template / 'first_para_prefix.xml').read_text(encoding='utf-8')
    blocks = []
    for index, problem in enumerate(document):
        for p_index, para in enumerate(problem):
            if index == 0 and p_index == 0:
                para = dict(para, segs=[('raw', prefix), *para['segs']])
            xml = writer.para_xml(para)
            if index and p_index == 0:
                xml = xml.replace('columnBreak="0"', 'columnBreak="1"', 1)
            blocks.append(xml)
    # Move native endnotes to a fresh page after the problem columns.
    blocks.append(writer.para_xml({'paraPr': '1', 'segs': []}).replace('pageBreak="0"', 'pageBreak="1"', 1))
    section = writer.SECTION_HEAD + ''.join(blocks) + '</hs:sec>'
    errors = check_xml(section)
    if errors:
        raise ValueError('수식 조판 검사 실패: ' + ', '.join(errors))
    hp = '{http://www.hancom.co.kr/hwpml/2011/paragraph}'
    root = ET.fromstring(section)
    if len(list(root.iter(hp + 'endNote'))) != len(items):
        raise ValueError('문항과 해설 미주 개수가 다릅니다.')
    writer.package(str(template), section, str(output))
    with zipfile.ZipFile(output) as archive:
        if archive.testzip():
            raise ValueError('한글 패키지 검사 실패')
    return {'questions': len(items), 'endnotes': len(items), 'equations': len(list(root.iter(hp + 'equation')))}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('output')
    parser.add_argument('--skills', required=True)
    args = parser.parse_args()
    try:
        data = json.loads(Path(args.input).read_text(encoding='utf-8'))
        if not isinstance(data.get('items'), list) or not 1 <= len(data['items']) <= 20:
            raise ValueError('문항 수는 1~20개여야 합니다.')
        print(json.dumps(build(data['items'], Path(args.output), Path(args.skills))))
    except Exception as exc:
        print('EXPORT: ' + str(exc), file=sys.stderr)
        sys.exit(1)
