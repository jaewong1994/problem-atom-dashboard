"""Compile all seminar assets into a versioned, source-preserving connection registry.

Local: --refresh-sources copies public-safe legacy design records from the vault.
CI: uses the checked-in snapshot. --import validates an extension before saving it.
No imported or executable record is automatically human approved.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def write(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def source_digest(path):
    # Git converts line endings between Windows and the Linux API/build host.
    # A request must keep the same registry identity across those environments.
    canonical=json.dumps(read(path),ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
    return hashlib.sha256(canonical).hexdigest()

def refresh_sources():
    base = ROOT.parent / 'archive/design/seminar-01'
    write(ROOT/'connection-design-sources.json', {
        'conditions': read(base/'conditions.json')['conditions'],
        'skeletons': read(base/'skeletons.json')['skeletons']})

def source_records():
    records = {}
    def add(row, kind, origin, identity=None):
        ident = identity or row.get('id') or row.get('condition_id') or row.get('skeleton_id')
        if not ident:
            raise ValueError('원본 ID 없는 자산')
        # Only already public data or vetted design metadata; never copy filesystem paths.
        previous=records.get(ident)
        views=(previous or {}).get('source_views',[])+[{'origin':origin,'payload':row}]
        # A review snapshot must not overwrite a human-approved source state.
        if previous and previous['origin']=='shared':
            previous['source_views']=views
            return
        records[ident] = {'id': ident, 'name': row.get('name',row.get('title',ident)),
                         'kind':kind,'origin':origin,'source_status':row.get('status',row.get('stage','ai_candidate')),
                         'payload':row,'source_views':views}
    library=read(ROOT/'asset-library.json')
    for row in library['reviewQueue']:
        if row.get('kind') != 'question': add(row,row['kind'],'seminar-01')
    for key in ('entities','questions','families','mockExams'):
        for row in library[key]: add(row,row.get('kind',key),'shared')
    for group in read(ROOT/'review-groups.json')['groups']:
        for row in group['members']: add(row,row['kind'],'seminar-01')
    for recipe in read(ROOT/'motif-library.json')['recipes']:
        add(recipe,'recipe','seminar-01')
        for row in recipe['motifs']: add(row,'motif','seminar-01')
    current=read(ROOT/'composition-catalog.json')
    for row in current['atoms']: add(row,row['kind'],'seminar-02')
    for row in current['recipes']: add(row,'recipe','seminar-02','PA-RECIPE-S02-'+row['id'])
    design=read(ROOT/'connection-design-sources.json')
    for row in design['conditions']: add(row,'condition','seminar-01')
    for row in design['skeletons']: add(row,'skeleton','seminar-01')
    return list(records.values())

# Typed facts refer to one mathematical object, in one assumption scope.
# A label is never used to decide whether two ports can connect.
def fact(code, subject='f'):
    return {'type':code,'subject':'$'+subject}

# Labels are for people; the stable keys alone carry connection identity.
KOREAN = '''difference_integral=F(x)와 F(t)의 차를 포함하는 적분
continuous_weight=적분 안에서 곱하는 함수가 연속
derivative_product=도함수가 F′과 적분의 곱
positive_intervals=길이가 있는 모든 구간에서 적분값이 양수
zero_weight_interval=적분 안의 함수가 구간 전체에서 0
changing_weight_sign=적분 안의 함수가 양수와 음수로 바뀜
integral_sign=적분의 부호가 아래끝 기준 방향으로 결정됨
two_simple_critical_roots=도함수가 서로 다른 두 일차식의 곱
one_extremum_required=극값을 하나로 만드는 조건
finite_parameter_set=조건을 만족하는 유한한 값 목록
admissible_set=끝값 포함 여부가 정해진 허용값 모음
integer_answer=허용되는 정수의 개수 또는 합
signed_absolute=좌우 부호가 바뀌는 인수와 절댓값의 곱
polynomial=다항식
continuous_required=연속이어야 한다는 조건
origin_zero=연결 지점의 값이 0
point_value_defined=연결 지점의 값을 따로 정의함
polynomial_known=다항식의 식이 정해짐
root_multiplicities=근의 위치와 인수가 반복되는 횟수
signed_corners=부호를 붙인 절댓값 함수의 미분불가점
critical_points=도함수가 0이 되는 점 목록
shift_constraints=이동 방향에 대한 조건
candidate_functions=가능한 함수 후보
selection_condition=후보에 대입할 추가 조건
tested_candidates=추가 조건에 대입하고 남은 후보
derivative_known=도함수의 식
anchor_value=한 점에서의 함숫값
normalized_pieces=기준 함숫값을 빼서 만든 두 다항식 조각
value_match=연결 지점에서 값이 같음
slope_match=연결 지점에서 좌우 기울기가 같음
differentiability_required=연결 지점에서 미분가능해야 함
boundary_equations=연결 지점의 값과 기울기를 맞추는 식
separate_claims=보기마다 따로 적용하는 가정
claim_results=가정을 섞지 않고 얻은 보기별 결과
composite_equation=F(x−mF(x))=0 형태의 방정식
two_distinct_roots=바깥 함수의 서로 다른 두 근의 값
nonzero_scale=m이 0이 아님
parallel_intersections=같은 기울기의 직선들과 곡선의 교점 문제
original_composite_family=m=1인 원래 삼차식의 조건 일체
tangent_candidates=접하는 경우에서 얻은 함수 후보
slope_point_condition=지정한 점의 미분계수 조건
known_value_condition=지정한 점의 함숫값 조건
root_lists=여러 식에서 구한 근 목록
distinct_roots=같은 값을 한 번만 센 근 목록
positive_quadratic_factor=항상 양수인 이차식을 곱한 절댓값 식
piecewise_formula=구간에 따라 나눈 식
graph_profile=증감과 끝값 및 극값의 높이
horizontal_problem=수평선과 만나는 점을 세는 문제
requested_count=요구하는 교점 개수
height_set=조건을 만족하는 높이 모음
symmetric_difference=절댓값의 좌우 차를 h로 나눈 극한
one_sided_derivatives=좌미분계수와 우미분계수
finite_jump=서로 다른 유한한 좌우 극한
continuous_factor=곱하는 다른 인수가 연속
product_continuity=곱 전체가 연속이라는 조건
factor_zero=연속인 인수가 해당 점에서 0
positive_shift_root_rule=단순한 근보다 일정 거리 왼쪽에도 근이 필요
finite_polynomial_roots=다항식의 유한한 근 목록
root_shape_candidates=근이 반복되는 모양의 후보
known_interval=한 구간의 함수식
recurrence_relation=다음 구간으로 옮기는 관계식
recurrence_constants=관계식의 정해진 상수
shifted_integral=옮겨진 구간의 정적분
next_interval=다음 구간의 함수식
two_points=서로 다른 두 점
closed_window=길이가 양수인 닫힌구간
window_positions=두 점이 모두 들어가는 구간의 위치
window_limit_bound=개수함수의 좌우 극한 합이 2 이하
window_two_exists=두 점이 모두 들어가는 위치가 존재
root_gap=두 근 사이의 거리
equal_values=서로 다른 두 점에서 함숫값이 같음
cubic_leading=삼차함수의 최고차항 계수
factored_family=공통 함숫값을 뺀 삼차식의 인수 표현
definite_integral_definition=정적분으로 정의한 함수
base_zero=적분의 위끝과 아래끝이 같은 곳의 값 0
opposite_integral_pieces=좌우에서 부호가 다른 정적분 표현
continuity_at_boundary=두 식을 연결한 곳에서 연속
repeated_factor=연결 지점의 인수가 두 번 이상 나타남
piece_roots=각 구간의 식에서 구한 근
piece_domains=각 식이 적용되는 구간
position_velocity=위치와 그 도함수인 속도
time_interval=시간의 범위
distance_definition=이동거리는 속도 절댓값의 적분
turn_times=범위 안에서 방향이 바뀌는 시각
position_values=끝점과 방향이 바뀌는 시각의 위치
distance_result=이동거리와 출발점에서 가장 멀어진 거리
position_family=미정 계수를 포함한 위치식
zero_velocity_time=속도가 0인 시각
position_coefficients=위치식의 계수 조건
same_end_position=출발 위치와 도착 위치가 같음
total_distance=총 이동거리
distance_bound=출발점에서 떨어질 수 있는 거리의 상한
ratio_absolute=절댓값을 원래 식으로 나눈 식
nonzero_domain=분모가 0인 곳을 제외한 범위
sign_expression=양수일 때 1, 음수일 때 −1인 식
absolute_sum=절댓값과 원래 식의 합 또는 차
real_domain=실수에서 식이 정의되는 범위
linear_shear_relation=H(x)=F(x)−x/m로 바꾼 관계
turn_profile=위치 함수의 증감과 함숫값
origin_returns=출발점으로 돌아오는 조건
all_roots_with_multiplicity=반복 횟수까지 포함한 모든 근
root_sum=반복 횟수를 포함한 근의 합
common_value=공통 함숫값
division_by_zero=0으로 나누는 식
constant_cancelled=함숫값의 차에서 사라진 상수
constant_target=사라진 상수의 값을 요구함
jump_unbounded=유한하지 않은 좌우 극한
zero_location_only=값이 0인 위치만 알고 있음'''
TYPES=dict(line.split('=',1) for line in KOREAN.splitlines())
TYPES.update({
    'degree_at_least_two':'다항식의 차수가 2 이상',
    'nonconstant_polynomial':'상수가 아닌 다항식',
    'nonzero_polynomial':'모든 곳에서 0인 다항식이 아님',
    'nonzero_derivative':'도함수가 모든 곳에서 0인 식은 아님',
    'differentiable_function':'다루는 범위에서 미분가능',
    'recurrence_unique_constants':'끝점의 두 조건이 관계식의 두 상수를 하나로 정함',
    'height_identity':'이 매개변수가 높이 자체라는 대응',
    'zero_scale':'합성식의 계수 m이 0',
    'fixed_heights':'교점을 셀 수평선의 높이 목록',
    'level_counts':'정해진 각 높이에서의 교점 개수',
})

def ports(items):
    return [fact(*s.split('@')) for s in items.split()]

TYPES.update({
    'parameter_is_critical_root':'허용값이 이 함수의 도함수가 0이 되는 두 위치와 정확히 일치함',
    'cubic_one_free_root':'서로 다른 두 근과 최고차항 계수가 정해지고 나머지 한 근만 미정인 삼차함수',
    'nonzero_integer_root_sum':'정수인 허용값의 합이 알려져 있고 0이 아님',
    'zero_integer_root_sum':'정수인 허용값의 합이 0임',
})

# 2026-09-21 문법 가교(connection-incoming/seminar-grammar-bridges.json)가 쓰는 정보 종류.
# 원본 문항 10건 재생 회귀(source-witnesses.json)에서 끊긴 자리에만 추가했다.
TYPES.update({
    'separable_parameter_equation':'매개변수를 한쪽으로 분리해 F(x)=k 꼴로 쓸 수 있는 방정식',
    'nonsmooth_count_condition':'미분불가점 또는 불연속점의 개수 조건',
    'root_sum_condition':'서로 다른 근의 합이 주어진 값과 같다는 조건',
    'product_zero_equation':'인수의 곱이 0인 방정식(인수별 근의 합집합으로 푼다)',
    'corner_line_slope':'꺾인점을 지나는 직선의 기울기 조건',
    'strict_position_bound':'범위 안 모든 시각에서 위치의 크기가 상한보다 작음',
    'sign_change_values':'연속함수가 범위 안에서 부호가 다른 두 값을 가짐',
    'interior_zero':'범위 안에 함숫값이 0인 점이 존재',
})

OPS=[]
TYPES.update({'signed_area_difference': '같은 구간의 정적분에서 절댓값 적분을 뺀 식', 'continuous_on_interval': '해당 닫힌구간에서 연속인 함수', 'forward_interval': '아래끝보다 위끝이 큰 적분구간', 'negative_area_identity': '차가 음수 부분 넓이의 −2배라는 관계', 'zero_signed_difference': '정적분과 절댓값 적분의 차가 0', 'negative_interval_sample': '해당 구간에 함숫값이 0보다 작은 점이 있음', 'nonnegative_on_interval': '해당 구간 전체에서 함숫값이 0보다 크거나 같음', 'moving_root_cubic': '두 고정된 근과 움직이는 근으로 나타낸 삼차함수', 'signed_integral_constraints': '이 함수의 정적분·넓이에 관한 매개변수 조건', 'absolute_graph_comparison': '다항식에서 절댓값 그래프를 빼 수평선과 비교하는 식', 'piecewise_polynomial': '유한한 구간별로 다항식인 함수', 'bounded_area_family': '허용 매개변수마다 곡선들이 둘러싸는 구간과 함수 차', 'area_result': '두 그래프 사이의 넓이', 'piecewise_polynomial_definition': '구간·식·끝점 포함 여부가 주어진 조각 다항식', 'right_limit_product': '같은 함수의 우극한과 이동한 우극한의 곱', 'left_limit_product': '같은 함수의 좌극한과 이동한 좌극한의 곱', 'positive_shift': '양수로 주어진 수평 이동 간격', 'endpoint_values': '구간 경계에 실제로 정의된 함숫값', 'boundary_limits': '구간 경계에서의 좌극한과 우극한', 'continuity_report': '경계별 연속 여부와 필요한 조건', 'minimum_result': '최솟값이 있는지와 그 값'})

def op(ident,name,needs,gives,guard,*,kind='step',forbids='',supports=None,work=None,power='representation'):
    OPS.append({'id':ident,'name':name,'kind':kind,'requires':ports(needs),'provides':ports(gives),
                'forbids':ports(forbids),'guard_note':guard,'supports':supports or [ident],
                'review_status':'ai_candidate','contract_status':'encoded','revision':1,
                'work':work or {'algebra':1,'branches':0},
                'influence':{'role':power,'calibrated':False},'curriculum':['수학Ⅱ'],
                'effect':'derive','verification':'연결 조건 검사. 구체 문항의 계산·유일성은 별도 검사.'})

def contracts():
    OPS.clear()
    legacy=[
      ('적분을 미분해 두 인수로 나누기','difference_integral continuous_weight differentiable_function','derivative_product','F(x)−F(t)의 차 구조에만 적용한다.'),
      ('적분값 대신 양수·음수만 남기기','derivative_product positive_intervals','integral_sign','어떤 열린구간 전체에서 0이면 사용할 수 없다.'),
      ('0이 되는 두 위치를 겹쳐 극값 줄이기','integral_sign two_simple_critical_roots one_extremum_required','finite_parameter_set@a','다른 부호 변화 인수가 없고 두 근이 서로 다를 때만 적용한다.'),
      ('좌우로 부호가 바뀌는 곳을 0으로 잇기','signed_absolute polynomial continuous_required point_value_defined','origin_zero','나눗셈이 정의되지 않는 점의 값을 별도로 확인한다.'),
      ('절댓값이 꺾이는 곳과 매끈한 곳 구별하기','signed_absolute root_multiplicities origin_zero point_value_defined','signed_corners','다항식 범위. 일반 절댓값과 부호를 붙인 절댓값을 구분한다.'),
      ('극값이 있는 점을 원점으로 옮기기','critical_points polynomial_known shift_constraints','candidate_functions','가능한 두 이동을 모두 만들며 부호 조건의 효과를 따로 확인한다.'),
      ('같은 함숫값을 빼서 상수 없애기','derivative_known normalized_pieces','piecewise_formula constant_cancelled','사라진 적분상수를 이 식만으로 복원하지 않는다.'),
      ('먼저 값을 맞춘 뒤 기울기 맞추기','normalized_pieces value_match differentiability_required','boundary_equations','두 조각이 다항식일 때. 값 일치만으로 기울기 일치를 주장하지 않는다.'),
      ('보기의 가정을 섞지 않고 따로 풀기','piecewise_formula separate_claims','claim_results','ㄱ의 가정을 ㄴ의 증명으로 가져오지 않는다.'),
      ('합성방정식을 두 직선과의 교점으로 바꾸기','composite_equation two_distinct_roots nonzero_scale','parallel_intersections','직선 기울기는 1/m이다. 나눗셈 전에 m≠0을 확인한다.'),
      ('접하는 경우까지 나눠 함수 후보 만들기','parallel_intersections original_composite_family','tangent_candidates','원문 m=1 조건을 벗어나면 계수 관계를 다시 유도해야 한다.'),
      ('같은 기울기의 점을 모두 후보로 남기기','tangent_candidates slope_point_condition known_value_condition','candidate_functions','기울기가 같다는 이유만으로 같은 접점이라고 할 수 없다.'),
      ('남은 함수마다 조건을 대입해 거르기','candidate_functions selection_condition','tested_candidates','남은 후보가 반드시 하나라고 가정하지 않는다.'),
    ]
    for i,(name,a,b,g) in enumerate(legacy,1):
        op(f'PA-MOTIF-S01-{i:02}',name,a,b,g,forbids='zero_weight_interval changing_weight_sign' if i==2 else '',power='constraint' if i in (3,6,11,13) else 'representation')
    new=[
      ('LEVELS-01','절댓값 안의 부호를 정해 식 나누기','positive_quadratic_factor','piecewise_formula','이차식이 항상 양수인지 먼저 확인한다.'),
      ('LEVELS-02','수평선 높이에 따라 만나는 점 세기','graph_profile horizontal_problem requested_count','height_set','끝점과 접점의 높이를 따로 센다.'),
      ('LEVELS-03','허용된 값 중 정수만 골라내기','admissible_set@a','integer_answer@a','열린 끝과 닫힌 끝을 구분한다.'),
      ('JUMP-01','좌우에서 다가오는 차이를 나누기','symmetric_difference one_sided_derivatives','finite_jump','좌우 미분계수의 합을 구하고 실제로 두 극한이 다른 경우에만 다음 끊김 단계에 넘긴다.'),
      ('JUMP-02','끊기는 곳에 다른 인수의 0 맞추기','finite_jump continuous_factor product_continuity point_value_defined','factor_zero','유한한 서로 다른 좌우 극한일 때의 필요조건이다. 점의 값도 확인한다.'),
      ('JUMP-03','가장 왼쪽 근부터 모양 좁히기','positive_shift_root_rule finite_polynomial_roots','root_shape_candidates','이동량이 양수여야 한다.'),
      ('JUMP-04','겹치는 근을 한 번만 세기','root_lists','distinct_roots','같은 값인지 확인하고 합집합을 만든다.'),
      ('RECURRENCE-01','구간 끝의 값과 기울기로 상수 찾기','known_interval recurrence_relation differentiability_required recurrence_unique_constants','recurrence_constants','끝점 값과 기울기 조건을 실제로 모두 사용한다.'),
      ('RECURRENCE-02','적분 구간을 아는 구간으로 옮기기','known_interval recurrence_relation recurrence_constants','shifted_integral','위끝과 아래끝을 함께 옮긴다.'),
      ('RECURRENCE-03','앞 구간의 식을 다음 구간에 쓰기','known_interval recurrence_relation recurrence_constants','next_interval','중간 구간의 식을 생략하지 않는다.'),
      ('WINDOW-01','두 점이 모두 들어가는 구간 찾기','two_points closed_window','window_positions','닫힌구간의 양끝을 포함한다.'),
      ('WINDOW-02','개수 조건에서 두 근의 간격 찾기','window_positions window_limit_bound window_two_exists','root_gap','개수가 2인 위치가 있다는 조건이 필요하다.'),
      ('WINDOW-03','같은 함숫값을 빼서 인수 만들기','equal_values cubic_leading','factored_family','두 점은 다르고 최고차항 계수는 0이 아니다.'),
      ('WINDOW-04','가능한 식을 모두 대입해 고르기','candidate_functions selection_condition','tested_candidates','추가 조건이 둘 다 허용할 가능성도 남긴다.'),
      ('SIGNED-01','적분의 양끝을 같게 놓아 값 얻기','definite_integral_definition','base_zero','해당 점에서 적분이 정의되어야 한다.'),
      ('SIGNED-02','좌우를 미분한 뒤 연결점 맞추기','opposite_integral_pieces continuity_at_boundary base_zero polynomial','repeated_factor','자료의 다항식 적분 표현과 좌우 연속성을 함께 사용한다.'),
      ('SIGNED-03','구한 근이 실제 적용 구간에 있는지 확인','piece_roots piece_domains','root_lists','이 단계 뒤에 중복을 제거한다.'),
      ('TRAVEL-01','이동거리와 위치 차이 구분하기','position_velocity time_interval','distance_definition','속도 적분과 속도 절댓값 적분을 구분한다.'),
      ('TRAVEL-02','방향이 바뀐 곳에서 거리 나눠 더하기','turn_times position_values time_interval distance_definition','distance_result','시간 범위 안의 방향전환과 끝점을 사용한다.'),
      ('TRAVEL-03','멈춘 시각으로 위치식의 계수 찾기','position_family zero_velocity_time time_interval','position_coefficients','위치식의 도함수에 해당 시각을 대입한다.'),
      ('TRAVEL-04','갔다 돌아온 거리로 최대 거리 제한하기','same_end_position total_distance time_interval','distance_bound','왕복 조건이 없으면 거리의 절반이라는 결론을 낼 수 없다.'),
    ]
    for ident,name,a,b,g in new: op('PA-S02-'+ident,name,a,b,g,forbids='jump_unbounded' if ident=='JUMP-02' else '')
    op('PA-OP-FIXED-LEVELS','주어진 높이에서 만나는 점 세기','graph_profile horizontal_problem fixed_heights','level_counts','정해진 높이의 교점 개수와, 특정 개수를 만드는 높이의 범위를 구하는 일은 별도다.',supports=['PA-S02-LEVELS-02','PA-MOTIF-S01-10'],work={'algebra':1,'branches':1})
    # Symmetric differentiation alone does NOT prove a jump. Keep its consequence conditional.
    j=next(x for x in OPS if x['id']=='PA-S02-JUMP-01')
    j['provides']=ports('one_sided_derivatives')
    j['requires']=ports('symmetric_difference polynomial_known')
    j['guard_note']='좌우 미분계수의 합을 구한다. 끊김 여부는 별도의 좌우 극한 계산이 필요하다.'
    op('PA-CAND-SKL-20260910-033','절댓값을 나눈 식을 1 또는 −1로 바꾸기','ratio_absolute nonzero_domain','sign_expression','분모가 0인 점에는 적용하지 않는다.',forbids='division_by_zero')
    op('PA-CAND-SKL-20260914-001','절댓값의 합과 차를 두 식으로 나누기','absolute_sum real_domain','piecewise_formula','0에서도 식이 정의된다. 절댓값 비율과 별개 원자이다.')
    bridges=[
      ('01','기울어진 직선을 수평선으로 바꾸기','parallel_intersections polynomial_known degree_at_least_two nonzero_scale two_distinct_roots','horizontal_problem@h fixed_heights@h linear_shear_relation@h polynomial_known@h nonconstant_polynomial@h nonzero_polynomial@h','H(x)=F(x)−x/m를 새 함수로 정의한다. F와 H의 성질을 같은 것으로 취급하지 않는다.',['PA-MOTIF-S01-10','PA-S02-LEVELS-02']),
      ('02','알고 있는 다항식에서 증감과 높이 구하기','polynomial_known nonconstant_polynomial','graph_profile critical_points differentiable_function','미분·실근 계산·끝값 대입이 추가된다. 연결 검사 통과가 이 계산의 완료를 뜻하지는 않는다.',['PA-S02-LEVELS-02','PA-S02-TRAVEL-02']),
      ('03','유한한 답 후보를 정수 선택에 넘기기','finite_parameter_set@a','admissible_set@a','유한 집합 그대로 전달한다. 최솟값과 최댓값 사이의 모든 수로 넓히지 않는다.',['PA-MOTIF-S01-03','PA-S02-LEVELS-03']),
      ('04','도함수와 한 점의 값으로 함수 되찾기','derivative_known anchor_value nonzero_derivative','polynomial_known nonconstant_polynomial nonzero_polynomial','도함수는 다항식. 한 점의 값이 없으면 적분상수가 남는다.',['PA-MOTIF-S01-07','PA-S02-LEVELS-02']),
      ('05','허용 높이를 매개변수의 허용값으로 옮기기','height_set','admissible_set@a','a가 높이 자체라는 일대일 대응을 명시한다. a² 등은 별도 역상 계산이 필요하다.',['PA-S02-LEVELS-02','PA-S02-LEVELS-03']),
      ('06','다항식의 근과 반복 횟수 함께 구하기','polynomial_known nonzero_polynomial','root_multiplicities root_lists','근의 위치만 가져와 반복 횟수를 추정하지 않는다. 인수분해 또는 중복근 검사가 필요하다.',['PA-MOTIF-S01-05','PA-S02-JUMP-04']),
      ('07','함수 그래프를 시간에 따른 위치로 읽기','graph_profile time_interval differentiable_function','turn_times position_values position_velocity','같은 함수를 위치로 정의하고 시간 범위를 제한한다. 극값을 시간 밖에서 세지 않는다.',['PA-MOTIF-S01-07','PA-S02-TRAVEL-02']),

    ]
    for ident,name,a,b,g,s in bridges:
        op('PA-BRIDGE-'+ident,name,a,b,g,kind='bridge',supports=s or ['PA-MOTIF-S01-08','PA-S02-RECURRENCE-01'],work={'algebra':2,'branches':1},power='enabler')
    # Relation assertions are explicit inputs, not unconditional bridge effects.
    next(x for x in OPS if x['id']=='PA-BRIDGE-05')['requires'] += [{'type':'height_identity','subject':'$a','object':'$f'}]
    extrema = next(x for x in OPS if x['id']=='PA-MOTIF-S01-03')
    extrema['provides'] += [{'type':'parameter_is_critical_root','subject':'$a','object':'$f'}]
    extrema['revision'] = 2
    next(x for x in OPS if x['id']=='PA-BRIDGE-04')['requires'] += ports('polynomial')
    next(x for x in OPS if x['id']=='PA-MOTIF-S01-10')['forbids'] = ports('zero_scale')
    return OPS

RULES=[
 {'id':'R01','name':'근의 위치만으로 부호 변화나 절댓값 꺾임을 정하지 않기','reason':'x²와 x³도 0에서 값이 0이지만 부호 변화와 절댓값 미분가능성이 다르다.','evidence':'polynomial-parity'},
 {'id':'R02','name':'사라진 상수로 답을 정하지 않기','reason':'F(x)−F(0)에는 F의 상수항이 남지 않는다. 별도 함숫값이 필요하다.','evidence':'constant-cancellation'},
 {'id':'R03','name':'기울기가 같은 점을 접점으로 단정하지 않기','reason':'함숫값도 직선과 같아야 한다.','evidence':'tangent-point'},
 {'id':'R04','name':'좌우에서 값이 이어지는지 먼저 확인하기','reason':'기울기가 같아도 함수값이 다르면 미분가능하지 않다.','evidence':'piece-boundary'},
 {'id':'R05','name':'범위와 함수 대상을 섞지 않기','reason':'다른 함수, 다른 구간, 다른 보기에서 얻은 사실은 자동 전달하지 않는다.','evidence':'subject-scope'},
 {'id':'R06','name':'조건 수만 세어 답이 하나라고 하지 않기','reason':'같은 조건을 다시 쓰거나 이미 성립하는 조건은 후보를 줄이지 않는다.','evidence':'idempotence'},
 {'id':'R07','name':'연결 가능과 문항 완성을 구분하기','reason':'조건 연결 후 식의 존재·정답 유일성·조건 활용·풀이 검산이 필요하다.','evidence':'release-gate'},
]

def presets():
    def facts(codes,subject='F'): return [dict(type=c,subject=subject,scope='main',origin='given') for c in codes.split()]
    def node(i,**bindings):return {'id':i,'bindings':bindings or {'f':'F'},'scope':'main'}
    return [
      {'id':'old-new-lines','name':'합성방정식 → 수평선 교점','description':'1차의 직선 교점 풀이를 2차의 높이별 개수 풀이에 연결합니다.',
       'facts':facts('composite_equation two_distinct_roots nonzero_scale polynomial_known degree_at_least_two'),
       'nodes':[node('PA-MOTIF-S01-10'),node('PA-OP-FIXED-LEVELS',f='H')],
       'bridge_nodes':[node('PA-BRIDGE-01',f='F',h='H'),node('PA-BRIDGE-02',f='H')],
       'bridge_at':1,'target':'PA-OP-FIXED-LEVELS'},
      {'id':'old-new-integers','name':'극값 조건 → 정수 답 고르기','description':'1차의 극값 조건으로 남긴 후보를 2차의 정수 선택으로 넘깁니다.',
       'facts':facts('difference_integral continuous_weight differentiable_function positive_intervals two_simple_critical_roots one_extremum_required'),
       'nodes':[node('PA-MOTIF-S01-01'),node('PA-MOTIF-S01-02'),node('PA-MOTIF-S01-03',f='F',a='a'),node('PA-S02-LEVELS-03',a='a')],
       'bridge_nodes':[node('PA-BRIDGE-03',a='a')],'bridge_at':3,'target':'PA-S02-LEVELS-03'},
      {'id':'old-new-distance','name':'도함수 정보 → 왕복 거리','description':'함수를 복원한 뒤 시간 범위를 정해 새 자료의 이동거리 풀이로 연결합니다.',
       'facts':facts('derivative_known polynomial anchor_value time_interval nonzero_derivative'),
       'nodes':[node('PA-BRIDGE-04'),node('PA-S02-TRAVEL-01'),node('PA-S02-TRAVEL-02')],
       'bridge_nodes':[node('PA-BRIDGE-02'),node('PA-BRIDGE-07')],'bridge_at':1,'target':'PA-S02-TRAVEL-02'},
    ]

def validate_extension(ext, known_records, known_ops, types):
    if ext.get('schema')!='problem-atom/connection-extension/1': raise ValueError('확장 schema 불일치')
    if not re.fullmatch(r'[a-z0-9-]{1,60}',ext.get('id','')): raise ValueError('확장 ID 형식')
    if not isinstance(ext.get('records'),list) or not isinstance(ext.get('operations'),list): raise ValueError('records/operations 배열 필요')
    rids=set(known_records)
    for r in ext['records']:
        if not all(r.get(k) for k in ('id','name','kind','origin')) or r['id'] in rids: raise ValueError('자산 누락 또는 ID 충돌')
        if r.get('source_status','ai_candidate')!='ai_candidate': raise ValueError('신규 반입은 검토 후보로 시작')
        rids.add(r['id'])
    ops=set(known_ops)
    for o in ext['operations']:
        if o.get('id') in ops: raise ValueError('연결 ID 충돌')
        if not all(o.get(k) for k in ('id','name','requires','provides','guard_note','supports')): raise ValueError('연결 계약 필수 필드 누락')
        if o.get('kind') not in ('step','bridge'):raise ValueError('연결 종류 미지원')
        if o.get('review_status')!='ai_candidate' or o.get('contract_status')!='encoded':raise ValueError('자동 승인 금지')
        if o.get('effect')!='derive' or not isinstance(o.get('revision'),int) or o['revision']<1:raise ValueError('연산 또는 판본 누락')
        if not isinstance(o.get('forbids'),list):raise ValueError('금지 조건 배열 필요')
        distinct=o.get('distinct_bindings',[])
        if not isinstance(distinct,list) or any(not isinstance(pair,list) or len(pair)!=2 or pair[0]==pair[1] or any(s not in ('f','h','a') for s in pair) for pair in distinct):raise ValueError('서로 다른 대상 조건 형식 오류')
        if not isinstance(o.get('work'),dict) or any(type(o['work'].get(k)) is not int or o['work'][k]<0 for k in ('algebra','branches')):raise ValueError('계획 작업량 형식 오류')
        if o.get('influence',{}).get('role') not in ('representation','constraint','enabler') or o['influence'].get('calibrated') is not False:raise ValueError('영향 역할 또는 보정 상태 오류')
        if not set(o['supports']) <= rids:raise ValueError('출처 없는 연결')
        for p in o['requires']+o['provides']+o.get('forbids',[]):
            if not {'type','subject'}<=set(p) or set(p)-{'type','subject','object'} or p['type'] not in types or p['subject'] not in ('$f','$h','$a'):raise ValueError('등록하지 않은 입력·출력 형식')
            if 'object' in p and p['object'] not in ('$f','$h','$a'):raise ValueError('대응 대상 형식 오류')
        if any(p in o['requires'] for p in o.get('forbids',[])):raise ValueError('입력과 금지가 충돌')
        if all(p in o['requires'] for p in o['provides']):raise ValueError('새 결과가 없는 자기 순환 연결')
        ops.add(o['id'])

def build():
    records=source_records(); operations=contracts()
    motifs={m['id']:m for r in read(ROOT/'motif-library.json')['recipes'] for m in r['motifs']}
    for o in operations:
        if o['id'] in motifs:o['supports']=[o['id']]+motifs[o['id']]['legacy_atom_refs']
    sources=['asset-library.json','review-groups.json','motif-library.json','composition-catalog.json','connection-design-sources.json']
    extensions=[(p,read(p)) for p in sorted((ROOT/'connection-incoming').glob('*.json'))]
    all_record_ids={r['id'] for r in records}
    for path,ext in extensions:
        for row in ext.get('records',[]):
            if not row.get('id') or row['id'] in all_record_ids:raise ValueError('반입 자산 ID 충돌: '+path.name)
            all_record_ids.add(row['id'])
    for path,ext in extensions:
        # Source references may cross imports regardless of alphabetical filename order.
        own_ids={r['id'] for r in ext['records']}
        validate_extension(ext,all_record_ids-own_ids,{o['id'] for o in operations},TYPES)
        records+=ext['records'];operations+=ext['operations'];sources.append(path.relative_to(ROOT).as_posix())
    ids={r['id'] for r in records}
    for o in operations:
        if not set(o['supports'])<=ids:raise ValueError('참조 자산이 없음: '+o['id'])
    for r in records:
        r['connection_ids']=[o['id'] for o in operations if r['id'] in o['supports']]
        r['integration_status']='contract_linked' if r['connection_ids'] else 'reference_only'
    payload={'schema':'problem-atom/connections/1','version':'connections-1.0','types':TYPES,
      'records':records,'operations':operations,'rules':RULES,'presets':presets(),
      'sources':[{ 'file':s,'sha256':source_digest(ROOT/s)} for s in sources],
      'policy':{'human_approval_unchanged':True,'unknown_is_allowed':False,'auto_publish_items':False,
        'difficulty_calibrated':False,'max_bridge_depth':3,'legacy_studio':'retired'},
      'contradictions':[['positive_intervals','zero_weight_interval'],['nonzero_domain','division_by_zero'],['finite_jump','jump_unbounded'],['nonzero_scale','zero_scale'],['nonnegative_on_interval','negative_interval_sample']],
      'language':read(ROOT/'composition-catalog.json')['language'],
      'ontology':read(ROOT/'composition-catalog.json')['ontology']}
    encoded=json.dumps(payload,ensure_ascii=False,sort_keys=True).encode()
    payload['revision']=hashlib.sha256(encoded).hexdigest()
    write(ROOT/'connection-registry.json',payload)
    print(f'통합 {len(records)}개 기록 · 연결 단계 {len(operations)}개 · 가교 {sum(o["kind"]=="bridge" for o in operations)}개')
    return payload

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh-sources',action='store_true')
    parser.add_argument('--import',dest='import_path')
    args=parser.parse_args()
    if args.refresh_sources:refresh_sources()
    if args.import_path:
        current=build(); ext=read(args.import_path)
        validate_extension(ext,{r['id'] for r in current['records']},{o['id'] for o in current['operations']},current['types'])
        dest=ROOT/'connection-incoming'/(ext['id']+'.json')
        if dest.exists():raise ValueError('기존 반입 파일 덮어쓰기 금지')
        dest.parent.mkdir(exist_ok=True);write(dest,ext)
    build()
