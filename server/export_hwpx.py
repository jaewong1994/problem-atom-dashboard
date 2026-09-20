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


def explicit_fractions(latex):
    """Expand TeX's one-token arguments before the kit's brace-based parser.

    In particular, \\frac a2 is legal TeX but the native converter expects
    \\frac{a}{2}. Fail rather than silently turn an incomplete macro into text.
    """
    pattern = re.compile(r'\\(?:dfrac|tfrac|frac)(?![A-Za-z])')
    def argument(text, pos):
        while pos < len(text) and text[pos].isspace():
            pos += 1
        if pos >= len(text):
            raise ValueError('분수의 분자 또는 분모가 없습니다.')
        if text[pos] == '{':
            start = pos + 1
            depth = 1
            pos += 1
            while pos < len(text):
                if text[pos] == '\\':
                    pos += 2
                    continue
                if text[pos] == '{':
                    depth += 1
                elif text[pos] == '}':
                    depth -= 1
                    if depth == 0:
                        return text[start:pos], pos + 1
                pos += 1
            raise ValueError('분수의 중괄호가 닫히지 않았습니다.')
        if text[pos] == '\\':
            m = re.match(r'\\[A-Za-z]+|\\.', text[pos:])
            if not m:
                raise ValueError('분수의 수식 명령이 잘렸습니다.')
            return m.group(), pos + len(m.group())
        return text[pos], pos + 1
    text = latex
    for match in list(pattern.finditer(text))[::-1]:
        numerator, pos = argument(text, match.end())
        denominator, end = argument(text, pos)
        text = text[:match.start()] + r'\frac{' + numerator + '}{' + denominator + '}' + text[end:]
    return text


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
                            part = explicit_fractions(part).replace(r'\,', r'\;')
                            for i, phrase in enumerate(normalizer.split_list_commas(part)):
                                if i:
                                    segments.append(('t', ', ', '1'))
                                script = bridge.latex_to_hwp_script(normalizer.normalize_latex(phrase.replace('\n', ' ')))
                                if not script.strip():
                                    raise ValueError('빈 수식으로 변환된 구절이 있습니다.')
                                if re.search(r'\b(?:frac|dfrac|tfrac|begin|end|includegraphics)\b', script):
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
