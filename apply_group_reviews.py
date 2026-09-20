"""Validate and import human group partitions without silently ratifying old text.

The complete partition + revised summary are saved for the operator's existing
refine/merge/ratify workflow. No candidate status is changed by a grouping vote.
"""
import argparse
import json
from pathlib import Path
from build_sandbox import ROOT, build

def validate(payload,catalog):
    if payload.get('schema')!='problem-atom/group-review/1.0':raise ValueError('지원하지 않는 묶음 검토 형식')
    actor=str(payload.get('actor','')).strip()
    if not actor:raise ValueError('검토자 이름 필요')
    known={g['id']:g for g in catalog['groups']};result=[];seen=set()
    for row in payload.get('groups',[]):
        key=row.get('groupId');g=known.get(key)
        if not g or row.get('revision')!=g['revision']:raise ValueError(f'원문 또는 추천이 변경되어 재검토 필요: {key}')
        if key in seen:raise ValueError('같은 묶음의 중복 결정')
        seen.add(key)
        if row.get('actor')!=actor:raise ValueError('검토자 불일치')
        parts=[];members=[]
        for p in row.get('parts',[]):
            ids=p.get('memberIds',[]);proposal=str(p.get('proposal','')).strip();verdict=p.get('verdict')
            if not ids or not proposal or verdict not in {'pending','approve','hold'}:raise ValueError('빈 묶음·정리문 또는 잘못된 검토 상태')
            if verdict=='approve' and '분리 후 정리문을 검토해 주세요.' in proposal:raise ValueError('분리한 묶음의 정리문 작성 필요')
            members.extend(ids);parts.append(dict(memberIds=ids,proposal=proposal,verdict=verdict))
        if len(members)!=len(set(members)) or set(members)!={m['id'] for m in g['members']}:raise ValueError('분리 결과에 누락·중복·외부 항목이 있습니다')
        result.append(dict(groupId=key,revision=g['revision'],actor=actor,parts=parts,at=row.get('at') or payload.get('at','')))
    if not result:raise ValueError('반영할 묶음이 없습니다')
    return result

def run(source,root=ROOT,dry_run=False):
    catalog,_=build(root)
    if (root/'review-catalog.json').exists():
        catalog=json.loads((root/'review-catalog.json').read_text(encoding='utf-8'))
    payload=json.loads(source.read_text(encoding='utf-8-sig'))
    if payload.get('schema')=='problem-atom/review-transfer/1':
        incoming=[]
        for row in payload.get('groups',[]):
            incoming.extend(validate(dict(schema='problem-atom/group-review/1.0',actor=row.get('actor'),groups=[row]),catalog))
        if not incoming: raise ValueError('반영할 검수가 없습니다')
    else:
        incoming=validate(payload,catalog)
    path=root/'group-review-ledger.json'
    ledger=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'groups':[]}
    rows={(r['actor'],r['groupId']):r for r in ledger['groups']}
    for row in incoming:
        old=rows.get((row['actor'],row['groupId']))
        if old and old.get('at','')>row['at']:raise ValueError('더 최신인 검토가 이미 있습니다')
        rows[row['actor'],row['groupId']]=row
    if not dry_run:
        path.write_text(json.dumps({'schema':'problem-atom/group-review-ledger/1.0','groups':list(rows.values())},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return len(incoming)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--dry-run',action='store_true');a=p.parse_args()
    print(f'묶음 검토 {run(a.source,dry_run=a.dry_run)}건 '+('검증 완료' if a.dry_run else '반영 완료')+' · 원본 후보 상태 유지')
