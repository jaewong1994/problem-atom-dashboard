(function(root,factory){const api=typeof module==='object'?factory(require('./connection-engine.js'),require('./composition-planner.js'),require('./composition-graph.js'),require('./judgment-bundles.js')):factory(root.PAConnections,root.PAPlanner,root.PAGraph,root.PABundles);if(typeof module==='object')module.exports=api;else root.PAAuthoring=api;})(typeof globalThis!=='undefined'?globalThis:this,(Connections,P,G,B)=>{
 'use strict';
 const VERSION=1,REVISION='judgment-authoring-20260921',clone=x=>JSON.parse(JSON.stringify(x));
 // Production descriptions, not new ontology nodes or ratified classifications.
 // The mathematical requires/provides/forbids contracts remain the authority.
 const stages={translate:'조건을 읽는 생각',judge:'후보를 좁히는 판단',calculate:'필요한 계산',bridge:'정보를 이어 쓰기',finish:'답을 확정하기'};
 const profiles={};
 function add(prefix,rows){for(const [suffix,stage,signal,decision,action,pitfall]of rows)profiles[prefix+suffix]={stage,signal,decision,action,pitfall};}
 add('PA-S03-',[["AREA-01", "translate", "같은 구간의 정적분과 절댓값 적분을 비교한다", "차가 음수 부분 넓이를 나타내는지 확인한다", "함수가 음수인 부분만 남겨 넓이 차로 바꾼다", "다른 구간의 적분끼리 이 항등식을 적용하지 않는다"], ["AREA-02", "judge", "정적분과 넓이의 차가 영이다", "음수인 점이 있으면 어떤 모순이 생기는지 본다", "연속성을 이용해 구간 전체의 부호를 판단한다", "적분이 양수라는 사실과 함수가 항상 양수라는 사실을 구별한다"], ["AREA-03", "judge", "근의 위치에 따라 절댓값 적분이 달라진다", "움직이는 근이 적분구간을 지나는 때를 나눈다", "각 경우의 적분 조건을 풀어 매개변수 범위를 구한다", "고정된 근뿐 아니라 모든 적분구간 끝점을 함께 비교한다"], ["V-01", "translate", "절댓값 그래프와 다항함수의 교점을 센다", "두 함수의 차를 수평선과 비교한다", "절댓값 경계에서 식과 적용 구간을 나눈다", "원래 함수와 변형한 함수의 이름과 성질을 섞지 않는다"], ["GRAPH-01", "calculate", "조각마다 다른 다항식이 주어져 있다", "각 식이 실제로 적용되는 범위를 확인한다", "미분과 경계 비교로 전 구간의 개형을 정한다", "구간 밖의 미분계수 영인 점을 극값으로 채택하지 않는다"], ["V-02", "judge", "교점 개수에서 허용된 높이를 찾았다", "모든 후보가 어떤 영역을 둘러싸는지 비교한다", "실제 교점을 다시 구해 넓이 계산에 전달한다", "교점 두 개를 바로 접점 조건으로 바꾸지 않는다"], ["AREA-04", "calculate", "곡선들이 둘러싸는 모든 구간을 알고 있다", "위아래 순서와 식의 경계를 함께 확인한다", "구간별 넓이를 적분하고 모든 영역을 더한다", "후보가 여러 개이면 답이 같은지 따로 검산한다"], ["LIMIT-01", "translate", "우극한 두 개의 곱으로 새 함수가 정의된다", "이동 전후의 경계와 오른쪽 식을 확인한다", "전체 경계를 정렬해 구간별 식과 경계값을 만든다", "이동 간격이 달라지면 겹침 구간도 다시 나눈다"], ["LIMIT-03", "translate", "좌극한 두 개의 곱으로 새 함수가 정의된다", "이동 전후의 경계와 왼쪽 식을 확인한다", "전체 경계를 정렬해 구간별 식과 경계값을 만든다", "우극한에서 얻은 끝점 포함 여부를 그대로 가져오지 않는다"], ["LIMIT-02", "judge", "구간별 함수의 연속 여부를 묻는다", "좌우 극한과 실제 값 세 가지를 비교한다", "각 경계가 이어질 조건을 따로 구한다", "다른 보기의 추가 가정을 함께 사용하지 않는다"], ["MIN-01", "judge", "끝점을 포함하지 않는 조각이 있는 함수이다", "다가가는 값이 실제로 얻어지는지 확인한다", "극값과 경계값을 전 구간에서 비교한다", "한 조각에서 감소한다고 전 구간의 최솟값을 결론내리지 않는다"]]);
 add('PA-MOTIF-S01-',[
  ['01','translate','적분 안에 두 함숫값의 차가 있다','적분값보다 도함수의 모양을 먼저 본다','적분식을 미분하고 공통 인수를 묶는다','적분을 전개하면 더 쉽게 끝나는지 비교한다'],
  ['02','judge','적분 안의 함수가 각 구간에서 양수인 적분값을 만든다','정확한 값 대신 부호만으로 충분한지 판단한다','적분 방향으로 양수·음수를 정한다','적분 안의 함수가 부호를 바꾸면 같은 판단을 적용하지 않는다'],
  ['03','judge','극값이 하나라는 조건과 부호를 바꾸는 두 근이 있다','근이 겹쳐 부호 변화가 사라지는 경우를 찾는다','매개변수와 두 근의 위치를 비교한다','핵심을 쓰기 전에 매개변수의 답을 조건으로 주지 않는다'],
  ['04','judge','절댓값에 붙은 부호가 연결점 양쪽에서 바뀐다','연속이 되려면 무엇이 0이어야 하는지 찾는다','좌우 극한과 그 점의 값을 맞춘다','연결점에 따로 정한 함숫값을 빠뜨리지 않는다'],
  ['05','judge','절댓값 안의 근마다 인수가 반복되는 횟수가 다르다','0이 되는 곳과 실제로 꺾이는 곳을 구별한다','각 근의 좌우 기울기를 비교한다','모든 근에서 부호가 바뀐다고 가정하지 않는다'],
  ['06','translate','극값이 있는 위치와 평행이동 조건이 있다','기준점을 옮겨 같은 모양끼리 비교한다','좌표를 옮겨 가능한 함수식을 만든다','이동 방향과 허용 범위를 보존한다'],
  ['07','calculate','함숫값의 차가 필요하고 공통 상수는 모른다','상수를 따로 구할 필요가 있는지 판단한다','두 함숫값을 빼 공통 상수를 없앤다','필요 없는 상수를 구하는 계산을 덧붙이지 않는다'],
  ['08','judge','서로 다른 두 식이 한 점에서 미분가능해야 한다','값을 먼저 맞추고 기울기를 맞춘다','연속 조건과 미분계수 조건을 차례로 세운다','기울기만 같다고 미분가능하다고 결론내리지 않는다'],
  ['09','finish','각 보기가 서로 다른 가정을 준다','어느 가정이 어느 보기에만 쓰이는지 나눈다','보기마다 조건을 따로 적용한다','다른 보기의 가정을 가져와 쓰지 않는다'],
  ['10','translate','함수 안에 함수가 들어간 방정식이 있다','바깥 함수의 근으로 안쪽 식의 값을 나눈다','직선과 함수 그래프의 교점 문제로 바꾼다','단순 인수분해만으로 핵심 판단을 우회할 수 있는지 확인한다'],
  ['11','judge','교점의 개수에 제한이 있다','가로지르는 경우와 접하는 경우를 나눈다','접점에서 생기는 함수 후보를 남긴다','접점을 서로 다른 교점 두 개로 세지 않는다'],
  ['12','judge','기울기 조건과 함숫값 조건이 함께 있다','같은 기울기의 모든 점을 후보로 남긴다','후보에 함숫값 조건을 적용한다','한 접점만 선택해 나머지 가능성을 놓치지 않는다'],
  ['13','finish','함수 후보 여러 개와 마지막 조건이 있다','어느 후보가 모든 조건을 만족하는지 판단한다','남은 후보를 원래 조건에 대입한다','이미 후보가 하나뿐이면 선별을 추론으로 세지 않는다']
 ]);
 add('PA-S02-',[
  ['LEVELS-01','translate','절댓값 안에 항상 양수인 인수가 있다','부호를 정하는 인수만 남긴다','경계를 나눠 구간별 식으로 쓴다','0인 경계의 포함 여부를 확인한다'],
  ['LEVELS-02','judge','수평선과의 교점 개수가 정해져 있다','극값의 높이를 지날 때 교점 수가 어떻게 달라지는지 본다','가능한 높이의 범위와 끝점을 찾는다','접하는 높이를 열린 구간과 같이 처리하지 않는다'],
  ['LEVELS-03','finish','조건을 만족하는 실수 후보가 정리됐다','정수 조건이 제외하는 후보를 찾는다','남은 정수의 개수나 합을 구한다','모든 후보가 정수라면 정수 조건이 장식인지 확인한다'],
  ['JUMP-01','translate','한 점의 좌우 함숫값 차를 나눈 극한이 있다','좌우 기울기를 따로 읽는다','두 미분계수를 구하고 필요한 방식으로 합친다','양쪽 기울기의 합을 미분가능 조건과 혼동하지 않는다'],
  ['JUMP-02','judge','한 인수가 끊겨도 두 인수의 곱은 연속이다','다른 인수가 끊김을 없애는 조건을 찾는다','서로 다른 유한한 좌우 극한에 0을 맞춘다','유한한 극한이라는 전제와 점의 값을 확인한다'],
  ['JUMP-03','judge','한 근이 있으면 일정 간격 떨어진 곳도 근이어야 한다','가장 작은 근에서 모순이 생기는 배치를 지운다','근의 위치와 반복되는 횟수의 후보를 좁힌다','근이 끝없이 생기는 경우를 유한한 다항식에 허용하지 않는다'],
  ['JUMP-04','finish','여러 식에서 나온 해가 겹칠 수 있다','중복된 해를 구별한다','서로 다른 해를 한 번씩 센다','같은 해를 식마다 다시 세지 않는다'],
  ['RECURRENCE-01','judge','한 구간의 식과 다음 구간으로 이어지는 관계가 있다','구간 경계에서 값과 기울기를 맞춘다','남은 상수를 정한다','상수가 유일하게 결정되는 조건인지 확인한다'],
  ['RECURRENCE-02','calculate','적분할 구간의 식을 다른 구간에서 알고 있다','계산할 수 있는 구간으로 옮긴다','치환과 구간 관계를 이용해 정적분을 구한다','계산량만 늘리는 반복 이동을 피한다'],
  ['RECURRENCE-03','calculate','이웃 구간의 식을 연결하는 관계가 정해졌다','이미 아는 구간에서 다음 구간을 만든다','변수와 구간을 함께 옮겨 식을 쓴다','옮긴 식의 적용 구간을 보존한다'],
  ['WINDOW-01','translate','움직이는 닫힌구간에 두 점이 함께 들어가야 한다','두 포함 조건을 동시에 만족시킨다','구간의 시작점 범위를 부등식으로 정리한다','끝점에 놓이는 경우를 빠뜨리지 않는다'],
  ['WINDOW-02','judge','구간 안의 근 개수와 두 근이 함께 들어가는 때를 안다','구간 길이와 두 근의 간격을 비교한다','개수 조건을 근 사이 거리로 바꾼다','두 근이 함께 들어가는 경우가 실제 존재하는지 확인한다'],
  ['WINDOW-03','translate','삼차함수의 서로 다른 두 함숫값이 같다','같은 값을 빼 두 근을 만든다','두 인수를 포함하는 함수의 형태로 쓴다','남은 인수나 계수가 이미 결정됐다고 가정하지 않는다'],
  ['WINDOW-04','finish','가능한 함수식과 추가 조건이 있다','추가 조건이 후보를 실제로 줄이는지 본다','각 후보를 대입해 남는 식을 고른다','추가 조건이 없어도 같은 답인지 비교한다'],
  ['SIGNED-01','translate','적분의 아래끝과 위끝을 같게 만들 수 있다','구간 길이가 0인 곳의 값을 먼저 찾는다','정의식에 기준점을 대입한다','적분값이 0인 모든 점을 찾았다고 확대하지 않는다'],
  ['SIGNED-02','judge','구간별 적분식이 한 점에서 이어진다','연결 조건을 함수값과 도함수값으로 읽는다','반복해서 들어가는 인수를 찾는다','연속 조건만으로 기울기까지 같다고 가정하지 않는다'],
  ['SIGNED-03','finish','구간별 식을 풀어 후보 근을 얻었다','근이 그 식의 적용 구간에 있는지 확인한다','구간 밖 해를 제외한다','경계의 등호를 빠뜨리지 않는다'],
  ['TRAVEL-01','translate','위치와 시간 구간이 주어지고 이동거리를 묻는다','위치 차이와 실제 움직인 거리를 구별한다','속도의 절댓값을 적분하는 식을 세운다','도착점과 출발점의 차이만 구하지 않는다'],
  ['TRAVEL-02','calculate','방향이 바뀌는 시각과 그때의 위치를 안다','방향이 일정한 구간으로 나눈다','구간별 위치 차이의 절댓값을 더한다','속도가 0인 모든 시각을 방향 전환으로 보지 않는다'],
  ['TRAVEL-03','calculate','위치식에 미지수가 있고 멈추는 시각을 안다','멈춘 시각의 속도를 0으로 둔다','위치식을 미분해 계수를 정한다','멈춤과 방향 전환을 동일시하지 않는다'],
  ['TRAVEL-04','judge','출발점으로 돌아오고 총 이동거리를 안다','왕복에 필요한 거리를 먼저 확보한다','출발점에서 떨어질 수 있는 거리의 한계를 찾는다','최대값이 실제 달성되는지 별도로 확인한다'],
  ['TRAVEL-05','judge','이동거리가 상한의 두 배인데 상한에 닿지 않는다','방향 전환 횟수의 상한으로 경로를 나눈다','두 번째 전환이 반대쪽으로 넘어가야 함을 보여 부호 변화를 얻는다','전환 횟수 상한이 없는 위치식에 같은 결론을 쓰지 않는다']
 ]);
 add('PA-BRIDGE-',[
  ['01','bridge','기울기가 같은 직선들과 곡선의 교점을 세려 한다','기울어진 부분을 함수에서 빼 높이 비교로 바꾼다','새 함수와 원래 함수의 관계를 기록한다','새 함수의 높이와 원래 함수의 높이를 섞지 않는다'],
  ['02','calculate','다항식의 식을 알고 그래프의 모양이 필요하다','도함수의 부호가 바뀌는 곳을 찾는다','미분·부호 비교·함숫값 계산을 한다','도함수가 0인 모든 점이 극값인 것은 아니다'],
  ['03','bridge','가능한 매개변수가 유한한 목록으로 나왔다','이 목록을 그대로 다음 선별에 쓴다','정수 선택 단계에 후보를 전달한다','후보 전달 자체를 새 추론이나 계산으로 세지 않는다'],
  ['04','calculate','도함수와 한 점의 함숫값을 안다','적분상수를 한 점의 값으로 정한다','원래 다항식의 식을 구한다','적분상수를 빠뜨리지 않는다'],
  ['05','bridge','허용된 높이와 매개변수의 대응이 정해져 있다','두 대상이 정확히 같은 값을 나타내는지 확인한다','높이 범위를 매개변수 범위로 옮긴다','다른 함수나 다른 범위에 그대로 넘기지 않는다'],
  ['06','calculate','다항식의 식에서 근의 정보를 얻으려 한다','근의 위치와 반복되는 인수를 함께 본다','인수분해해 근과 반복 횟수를 구한다','영다항식에 유한한 근 목록을 적용하지 않는다'],
  ['07','bridge','함수 그래프와 시간 구간이 주어져 있다','같은 함수를 시간에 따른 위치로 읽는다','방향 전환 시각과 위치를 연결한다','시간 범위 밖의 극값을 이동거리에 쓰지 않는다'],
  ['08','judge','삼차함수가 서로 다른 두 점에서 같은 값을 갖는다','도함수의 두 서로 다른 근이 필요한지 판단한다','그래프가 오르내리는 모양을 제한한다','두 점 사이의 평균변화율과 도함수를 연결해 논증한다'],
  ['09','judge','정수 후보의 합과 함수의 형태를 함께 안다','정수 후보가 한 개인 경우와 두 개인 경우를 나눈다','각 경우를 함수 조건에 되돌려 후보를 만든다','가능한 경우를 빠뜨리거나 조건의 결론을 미리 주지 않는다']
 ]);
 add('PA-GRAMMAR-',[
  ['01','bridge','매개변수가 방정식 한쪽에 혼자 남는다','실근 개수를 수평선 교점 개수로 읽을 수 있는지 본다','F(x)=k 꼴로 정리하고 k가 높이 자체임을 적는다','k가 제곱 등으로 들어간 경우를 그대로 높이로 쓰지 않는다'],
  ['02','bridge','구간별 다항식 조각이 있고 개형이 필요하다','조각마다 증감을 잡고 이음점의 연속을 확인한다','조각별 미분·극값 높이·이음점 값 비교를 한다','이음점의 값이 다른데 이어진 그래프로 그리지 않는다'],
  ['03','bridge','절댓값의 좌우 미분계수 합과 근의 반복 횟수를 안다','어느 근에서 실제로 끊기는지 판단한다','단순근에서만 유한한 끊김이 생긴다고 정리한다','중근에서 끊긴다고 가정하지 않는다'],
  ['04','bridge','끊기는 점마다 다른 인수가 0이어야 한다','점별 조건을 근 배치의 전역 규칙으로 바꾼다','단순근마다 일정 거리 왼쪽에도 근이 있어야 함을 적는다','규칙을 세우기 전에 특정 함수식을 가정하지 않는다'],
  ['05','bridge','꺾임 개수 조건과 꺾이는 자리를 안다','어느 근이 원점에 놓이고 어느 근이 겹쳐야 하는지 판단한다','개수 조건을 이동량 제약으로 적는다','원점의 근을 꺾임으로 세지 않는다'],
  ['06','bridge','근의 위치와 반복 횟수 모양이 정해졌다','함수식을 쓰려면 최고차항 계수가 필요한지 확인한다','근 모양에 최고차항 계수를 붙여 함수족을 만든다','미정 매개변수를 임의의 값으로 고정하지 않는다'],
  ['07','bridge','도함수 두 근의 간격과 미정 인수를 포함한 식이 있다','간격 조건이 미정 인수의 방정식이 되는지 본다','판별식으로 방정식을 세워 후보를 만든다','후보가 하나뿐이라고 단정하지 않는다'],
  ['08','bridge','이음점의 값·기울기 방정식이 있다','매개변수의 다항방정식으로 풀 수 있는지 본다','근을 모두 목록으로 남긴다','양수 조건 같은 선택을 이 단계에서 미리 적용하지 않는다'],
  ['09','bridge','곱이 0인 방정식과 함수 후보식이 있다','인수별로 근을 모을 수 있는지 본다','각 인수의 근 목록을 후보식으로 적는다','겹치는 근을 여기서 지우거나 다른 함수의 근과 섞지 않는다'],
  ['10','bridge','서로 다른 근의 목록과 합 조건이 있다','기준점에서의 거리로 합을 읽을 수 있는지 본다','합=평균×개수로 매개변수의 일차방정식을 만든다','겹침 제거 전의 목록으로 합을 계산하지 않는다'],
  ['11','bridge','적분으로 정의된 조각과 그 식이 정해졌다','문제가 묻는 함수가 피적분함수인지 확인한다','조각을 미분해 원래 함수의 조각식과 이음점 좌우 미분계수를 얻는다','적분 정의 함수와 피적분함수를 같은 대상으로 두지 않는다'],
  ['12','bridge','꺾인점의 좌우 기울기와 지나는 직선의 기울기를 안다','직선이 좌우 조각과 각각 어느 쪽에서 만나는지 판단한다','기울기 대소로 교점 개수를 센다','꺾인점 자체의 교점을 빠뜨리거나 두 번 세지 않는다'],
  ['13','bridge','연속함수가 범위 안에서 부호가 다른 두 값을 가진다','사잇값 정리를 쓸 수 있는지 확인한다','두 시각 사이에 0이 있음을 적는다','부호가 다른 시각이 범위 밖에 있으면 쓰지 않는다'],
  ['14','bridge','추가 조건 뒤에 후보가 하나 남았다','함수가 정해졌는지, 둘 이상 남았는지 확인한다','정해진 식을 다음 질문의 시작 조건으로 넘긴다','후보가 둘 이상인데 하나로 단정하지 않는다'],
  ['15','bridge','다항식의 식이 정해졌다','근의 유한성과 도함수 식이 바로 따라오는지 본다','다항식·유한 근·도함수 식을 다음 단계에 준다','근의 위치·반복 횟수까지 안다고 가정하지 않는다']
 ]);
 add('',[
  ['PA-OP-FIXED-LEVELS','finish','그래프의 모양과 비교할 높이들을 안다','각 높이에서 만나는 점을 센다','높이별 교점 개수를 정리한다','접점과 중복된 해를 한 번씩 센다'],
  ['PA-CAND-SKL-20260910-033','translate','절댓값을 원래 식으로 나눈 꼴이 있다','분모가 0인 곳을 제외하고 부호를 나눈다','식을 1 또는 −1로 바꾼다','분모가 0인 곳을 그대로 포함하지 않는다'],
  ['PA-CAND-SKL-20260914-001','translate','절댓값과 원래 식의 합이나 차가 있다','원래 식의 부호에 따라 나눈다','각 구간에서 절댓값을 풀어 쓴다','0이 되는 경계에서도 두 식의 값을 확인한다']
 ]);
 function profile(id){return profiles[id]||null;}
 function startOptions(registry,id){const seed=B.seed(registry,id);return {seed,hasQuestion:routes(seed.plan,registry,seed.coreId).length>0,bundles:B.catalog.filter(b=>b.members.includes(id)).map(b=>({id:b.id,name:b.name}))};}
 function routes(plan,registry,coreId){return P.targets(G.compile(plan,registry).plan,registry,coreId).filter(c=>c.route.every(n=>profile(n.id)));}
 function routeKey(choice){return P.key(choice.target);}
 function descendants(edges,from,to){const seen=new Set();function visit(id){if(id===from)return true;if(seen.has(id))return false;seen.add(id);return edges.filter(e=>e.to===id).some(e=>visit(e.from));}return visit(to);}
 // A next choice must both consume the selected branch and lead to the chosen question.
 // Merely fitting a broad role or sharing a subject name is insufficient.
 function next(plan,registry,coreId,target,focus=null,knownRoutes=null){
  if(!target||!coreId)return [];
  const p=G.compile(plan,registry).plan,choice=(knownRoutes||routes(p,registry,coreId)).find(c=>routeKey(c)===P.key(target));
  if(!choice?.route.length)return [];
  const engine=Connections.create(registry),current=engine.run(p);if(current.status!=='connected')return [];
  const full={...p,nodes:[...p.nodes,...choice.route]},fullGraph=G.compile(full,registry),audit=P.analyze(fullGraph.plan,registry,coreId,target);
  if(!audit.coreConnected||!audit.goalReady)return [];
  const selected=new Set(p.nodes.map(n=>n.id)),items=[];
  for(const n of choice.route){
   if(!profile(n.id)||selected.has(n.id)||audit.unused.includes(n.id))continue;
   const check=engine.inspect(current.facts,n);if(check.status!=='direct'||check.redundant)continue;
   if(focus&&!descendants(fullGraph.edges,focus,n.id))continue;
   let last=n,bundle=[n];
   // Pure transfers are useful contracts, but not a separate authoring decision.
   if(['PA-BRIDGE-03','PA-BRIDGE-05'].includes(n.id)){
    const after=engine.apply(current.facts,n).facts;
    const consumer=choice.route.find(candidate=>candidate.id!==n.id&&fullGraph.edges.some(e=>e.from===n.id&&e.to===candidate.id)&&profile(candidate.id)&&engine.inspect(after,candidate).status==='direct');
    if(consumer){bundle.push(consumer);last=consumer;}
   }
   items.push({id:last.id,node:clone(last),nodes:clone(bundle),target:clone(target),via:fullGraph.inputs[n.id].filter(i=>i.source&&i.source!=='@start').map(clone),profile:profile(last.id)});
  }
  return items;
 }
 function attach(plan,registry,coreId,target,item,focus=null){const fresh=next(plan,registry,coreId,target,focus).find(r=>r.id===item.id&&JSON.stringify(r.nodes)===JSON.stringify(item.nodes));if(!fresh)throw Error('구성이 달라졌습니다. 현재 질문에 필요한 연결을 다시 고르세요.');return G.compile({...clone(plan),nodes:[...clone(plan.nodes),...clone(fresh.nodes)]},registry).plan;}
 function complete(plan,registry,coreId,target){const fresh=routes(plan,registry,coreId).find(c=>routeKey(c)===P.key(target));if(!fresh)throw Error('현재 조건으로 이 질문을 완성할 수 없습니다.');return G.compile({...clone(plan),nodes:[...clone(plan.nodes),...clone(fresh.route)]},registry).plan;}
 function blueprint(plan,registry,coreId=null,target=null){
  const g=G.compile(plan,registry),operations=new Map(registry.operations.map(o=>[o.id,o]));
  const steps=g.plan.nodes.map(n=>{const p=profile(n.id),o=operations.get(n.id);return {id:n.id,bindings:clone(n.bindings),scope:n.scope,core:n.id===coreId,...(p?clone(p):{stage:'unreviewed',action:o.name}),inputs:g.inputs[n.id],outputs:o.provides.map(port=>({type:port.type,subject:n.bindings[port.subject.slice(1)],scope:n.scope,...(port.object?{object:n.bindings[port.object.slice(1)]}:{})}))};});
  return {schema:'problem-atom/authoring-blueprint/1',revision:REVISION,bundle_version:1,classification:'production_guidance_not_ontology_approval',target:clone(target),bundles:B.groups(plan,registry),steps,joins:g.edges.filter(e=>e.from!=='@start'),review:['묶음 안의 각 판단을 빼도 같은 답을 얻는가?','더 쉬운 풀이로 선택한 판단을 건너뛸 수 있는가?','각 조건은 후보를 어디서 줄이거나 어떤 정보를 결정하는가?','계산을 늘린 것과 새로운 판단을 요구한 것을 구분했는가?']};
 }
 // Rank is a diagram position, never a difficulty score. Independent branches share a row.
 function layers(plan,registry){const g=G.compile(plan,registry),rank=new Map([['@start',0]]),rows=[];for(const n of g.plan.nodes){const parents=g.edges.filter(e=>e.to===n.id).map(e=>e.from),level=1+Math.max(0,...parents.map(p=>rank.get(p)||0));rank.set(n.id,level);(rows[level-1]||=([])).push(n.id);}return {graph:g,rows:rows.filter(Boolean)};}
 return {VERSION,REVISION,stages,profiles,profile,startOptions,routes,next,attach,complete,blueprint,layers,descendants};
});
