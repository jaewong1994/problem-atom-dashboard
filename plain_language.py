"""Readable public wording; preserve the original seminar/source ledgers."""
REPLACEMENTS = (
    ('비음수만으로 엄격한 부호를 보장하지 않음', '함숫값이 0보다 크거나 같다는 조건만으로 적분값의 부호를 정할 수 없음'),
    ('비음수 적분 인수의 부호를 적분 방향으로 판단', '0보다 크거나 같은 함수를 적분할 때 구간 방향으로 부호 판단'),
    ('비음수 피적분의 정적분 부호', '0보다 크거나 같은 함수를 적분할 때의 부호'),
    ('정적분의 부호와 엄격한 증가', '정적분의 부호와 증가 조건'),
    ('비음수 함수', '함숫값이 0보다 크거나 같은 함수'),
    ('비음수 다항식', '값이 0보다 크거나 같은 다항식'),
    ('비음수 가중치는', '적분 안에서 곱하는 함수는 값이 0보다 크거나 같아야 하고,'),
    ('비음수', '0보다 크거나 같은'),
    ('비양수 함수', '함숫값이 0보다 작거나 같은 함수'),
    ('비양수', '0보다 작거나 같은'),
    ('영다항식이 아닌 다항식', '항상 0인 것은 아닌 다항식'),
    ('영다항식이 아니면', '모든 x에서 값이 0인 것은 아니면'),
    ('영다항식', '모든 x에서 값이 0인 다항식'),
    ('모든 양의 길이 구간', '길이가 0보다 큰 모든 구간'),
    ('양의 길이 구간', '길이가 0보다 큰 구간'),
    ('항등적으로 0', '모든 입력에서 0'),
)

def readable(value):
    if isinstance(value,str):
        for old,new in REPLACEMENTS:value=value.replace(old,new)
        return value
    if isinstance(value,list):return [readable(v) for v in value]
    if isinstance(value,dict):return {k:readable(v) for k,v in value.items()}
    return value

def refresh_public(root):
    import json
    for name in ('asset-library.json','promotion-board.json','pilot-review.json','motif-library.json'):
        path=root/name
        if path.exists():
            data=json.loads(path.read_text(encoding='utf-8'))
            cleaned=readable(data)
            if cleaned!=data:path.write_text(json.dumps(cleaned,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
