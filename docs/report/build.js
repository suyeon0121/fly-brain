const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, Footer, PageNumber,
} = require("docx");

const FONT = "Malgun Gothic";
const MONO = "Consolas";
const CONTENT_W = 9638;
const ACCENT = "2E5E8C";
const LIGHT = "EAF1F8";
const CODEBG = "F3F3F3";

function runs(text, opts = {}) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean).map((s) => {
    if (s.startsWith("**")) return new TextRun({ text: s.slice(2, -2), bold: true, font: FONT, ...opts });
    if (s.startsWith("`")) return new TextRun({ text: s.slice(1, -1), font: MONO, size: 19, ...opts });
    return new TextRun({ text: s, font: FONT, ...opts });
  });
}

const out = [];
const P = (t) => out.push(new Paragraph({ children: runs(t), spacing: { after: 120 } }));
// 목차: 제목을 추가할 때 함께 기록하고, 마지막에 문서 앞쪽에 끼워 넣는다
const toc = [];
const PLANNED = (level, text) => toc.push({ level, text, planned: true });
const H1 = (t, brk = false) => { toc.push({ level: 1, text: t }); out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: brk, children: [new TextRun({ text: t, font: FONT })] })); };
const H2 = (t, brk = false) => { toc.push({ level: 2, text: t }); out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, pageBreakBefore: brk, children: [new TextRun({ text: t, font: FONT })] })); };
const H3 = (t) => out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, font: FONT })] }));
const B = (items, level = 0) => items.forEach((it) => {
  if (Array.isArray(it)) return B(it, level + 1);
  out.push(new Paragraph({ numbering: { reference: "bullets", level }, children: runs(it), spacing: { after: 60 } }));
});
const NOTE = (t) => out.push(new Paragraph({
  children: runs(t), spacing: { before: 80, after: 160 }, indent: { left: 200 },
  shading: { type: ShadingType.CLEAR, fill: LIGHT, color: "auto" },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } },
}));
const CODE = (lines) => lines.forEach((l, i) => out.push(new Paragraph({
  children: [new TextRun({ text: l || " ", font: MONO, size: 18 })],
  shading: { type: ShadingType.CLEAR, fill: CODEBG, color: "auto" },
  spacing: { before: i === 0 ? 80 : 0, after: i === lines.length - 1 ? 160 : 0 },
  indent: { left: 200, right: 200 },
})));

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function T(headers, rows, ratios) {
  const total = ratios.reduce((a, b) => a + b, 0);
  const widths = ratios.map((r) => Math.floor((CONTENT_W * r) / total));
  widths[widths.length - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const mk = (txt, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders,
    shading: head ? { type: ShadingType.CLEAR, fill: ACCENT, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(txt).split("\n").map((line) => new Paragraph({
      children: runs(line, head ? { bold: true, color: "FFFFFF", size: 19 } : { size: 19 }),
    })),
  });
  out.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => mk(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => mk(c, i, false)) })),
    ],
  }));
  out.push(new Paragraph({ children: [], spacing: { after: 120 } }));
}

// ═════════════════════════ 제목 ═════════════════════════
out.push(new Paragraph({ children: [new TextRun({ text: "초파리 뇌 프로젝트 정리", font: FONT, size: 44, bold: true, color: ACCENT })], spacing: { after: 80 } }));
out.push(new Paragraph({ children: runs("2026-10-30 기준 · 저장소 `~/project/fly-brain` · GitHub `suyeon0121/fly-brain`", { color: "7F7F7F", size: 19 }), spacing: { after: 240 } }));
const TOC_AT = out.length;

H1("1. 개요", true);
H2("한 줄 요약");
P("초파리 뇌의 배선도(커넥톰)를 그대로 컴퓨터에 옮겨 **뇌를 돌려 보고**, 그 배선도를 만드는 핵심 기술인 **AI 뉴런 분할(3D U-Net)을 직접 만들어 본 뒤**, 둘을 이어서 **\"현미경 사진 → 뇌 지도 → 시뮬레이션\"** 전 과정을 작은 규모로 완주해 보는 개인 프로젝트입니다.");

// ═════════════════════════ 배경 ═════════════════════════
H2("왜 이 프로젝트를 하나 (배경)");
H3("1. 초파리 뇌 전체 지도가 공개됐습니다");
B([
  "2024년 10월 FlyWire 프로젝트가 성체 초파리 뇌 전체의 배선도를 완성했습니다(뉴런 약 14만 개, 시냅스 약 5천만 개, Nature).",
  "누가 누구에게 신호를 보내는지가 전부 공개돼, 누구나 내려받아 쓸 수 있습니다. → **개인 노트북에서도 뇌 전체를 다룰 수 있는 이유**",
]);
H3("2. \"배선도만으로 행동을 예측할 수 있나\"가 실제로 시험되고 있습니다");
B([
  "Shiu et al.(2024)은 배선도를 단순한 뉴런 모델에 그대로 넣었더니, 단맛 신호가 먹는 행동 뉴런을 켜는 등 실제 초파리 반응을 예측했습니다.",
  "2026년 3월 Eon Systems는 이 뇌 모델을 가상 초파리 몸에 연결해, 학습 없이 걷기 · 그루밍 · 설탕에 입 내밀기를 재현했다고 발표했습니다.",
  "→ **Phase 1에서 이 모델을 직접 돌려 보는 이유**",
]);
H3("3. 뇌 지도를 만드는 병목은 AI 분할입니다");
B([
  "배선도는 뇌를 수천 장으로 썰어 전자현미경으로 찍고, AI가 사진에서 뉴런을 따라 그려서 만듭니다.",
  "선충(뉴런 302개)은 사람이 손으로 10년 넘게 걸렸고, 초파리는 딥러닝 없이는 불가능했습니다.",
  "쥐 뇌(뉴런 약 7천만 개)가 아직 안 되는 이유도 계산이 아니라 **지도 제작(AI 분할과 검수)** 때문입니다.",
  "→ **Phase 2에서 3D U-Net 뉴런 분할을 직접 만드는 이유**",
]);
H3("4. 개인 목표");
B([
  "일반적인 이미지 분류와 달리 **3D · 비등방성 · 대용량 · 후처리**까지 다루는 딥러닝 실력 쌓기",
  "결과물(3D 뇌 시각화, 분할 모델)을 블로그 · 포트폴리오로 남기기",
]);

// ═════════════════════════ 어떻게 ═════════════════════════
H2("어떻게 하나 (세 가지 기술)");
T(["기술", "하는 일", "해당 단계"], [
  ["LIF 뉴런 시뮬레이션\n(Brian2)", "배선도의 뉴런 하나하나를 \"물이 새는 양동이\" 모델로 만들고, 특정 뉴런을 자극해 신호가 어떻게 퍼지는지 계산", "Phase 1 (진행 중)"],
  ["3D U-Net 뉴런 분할", "전자현미경 사진 더미에서 뉴런을 3D로 분리 (친화도 예측 → watershed → 합치기)", "Phase 2"],
  ["시냅스 검출 + 그래프", "분할한 뉴런 사이의 시냅스를 찾아 연결 그래프를 만들고, Phase 1 방식으로 시뮬레이션", "Phase 3"],
], [2.2, 5.6, 1.8]);

// ═════════════════════════ 목표 ═════════════════════════
H2("무엇을 달성하려 하나 (목표)");
P("**최종 목표**: \"현미경 사진 → 뇌 지도 → 시뮬레이션\" 파이프라인을 작은 규모로 혼자 완주한다.");
H3("단계별 완료 기준");
T(["단계", "완료 기준", "어떻게 확인하나", "지금 값"], [
  ["Phase 1", "단맛 자극 → MN9 발화 재현, 맛에 따른 차이 확인", "30회 반복 평균 발화율, 원본 예제 · 논문과 비교", "단맛 1회(seed=0): MN9 좌 80Hz · 우 64Hz, 재현 확인"],
  ["Phase 1", "켜진 뉴런을 3D로 확인", "발화율대로 색칠한 3D 뇌", "—"],
  ["Phase 2", "전자현미경 사진 → 색깔별 3D 뉴런", "CREMI 평가 지표(VOI, Adapted Rand Error), 공개 리더보드와 비교", "—"],
  ["Phase 3", "내가 만든 지도로 시뮬레이션", "분할 → 시냅스 → 그래프 → 시뮬레이션이 끝까지 돌아감", "—"],
], [1.3, 3, 3.3, 2]);
H3("실험할 때 기억할 점");
B([
  "**재현성**: 자극이 무작위(포아송)라 실행마다 숫자가 조금씩 다릅니다. 앞으로는 시드를 고정하고 반복 횟수를 함께 적습니다.",
  "**비교 기준**: 항상 원본 예제(example.ipynb)와 논문 결과입니다. \"원본과 같은 반응이 나오는가\"가 기본 확인입니다.",
  "**데이터 버전**: 시뮬레이션은 v630(논문 버전)으로 시작하고, 3D 시각화부터 v783으로 바꿉니다. 버전이 바뀌면 뉴런 ID도 바뀔 수 있습니다.",
]);

// ═════════════════════════ 단계와 지금 위치 ═════════════════════════
H2("단계와 지금 위치");
T(["단계", "기간", "할 일", "결과물", "상태"], [
  ["Phase 0", "2~3일", "환경 준비", "WSL · uv · Python 3.12.10 · GitHub", "완료"],
  ["Phase 1", "약 1주", "초파리 뇌 돌려보기", "맛 비교 그래프, 3D 뇌 시각화", "진행 중"],
  ["Phase 2", "5~6주", "3D U-Net 뉴런 분할", "학습된 분할 모델, 3D 뉴런 시각화", "예정"],
  ["Phase 3", "2~3주", "미니 커넥톰 완주", "내가 만든 연결 그래프 + 시뮬레이션", "예정"],
  ["Phase 4", "자유", "고도화 (가상 실험실 / 학습하는 뇌 / 행동하는 초파리 / AI 응용)", "선택한 트랙의 결과", "선택"],
], [1.2, 1.1, 3, 3.1, 1.2]);
B([
  "현재(2026년 10월 30일): Phase 0 완료, Phase 1의 ① 스모크 테스트 · ② 실행 정리 완료",
  "무거운 학습(Phase 2~)은 Google Colab에서 합니다. 노트북에 NVIDIA GPU가 없습니다.",
]);

// ═════════════════════════ 원본과 다른 점 ═════════════════════════
H2("원본 코드와 실제가 다른 점");
T(["항목", "원본 (Shiu et al.)", "이 프로젝트", "왜"], [
  ["환경 관리", "conda", "uv + venv", "가볍고 sudo 불필요"],
  ["Python", "3.10", "3.12.10", "우분투 시스템 Python(3.14)과 분리, 라이브러리 호환"],
  ["Brian2 · numpy", "2.5.1 · 1.24", "2.10.1 · 2.5", "Python 3.12 지원"],
  ["병렬 수", "코어 전부 (16개)", "4개 예정", "1회 약 3GB × 16 > WSL 메모리 15GB"],
  ["실행 방식", "Jupyter 노트북, `run_exp`", "`flysim.py` 래퍼 + Makefile", "trial별 시드 고정, 실행 설정 JSON 기록, 한 줄 실행"],
  ["데이터 버전", "v630", "v630 → 시각화 때 v783", "3D 모양 데이터가 v783 기준"],
], [1.6, 2, 2.4, 3.6]);

// ═════════════════════════ 흐름 ═════════════════════════
H1("2. 프로젝트 흐름", true);
H2("이 프로젝트가 하려는 것");
B([
  "공개된 초파리 배선도로 뇌를 돌려, **어떤 자극이 어떤 행동 뉴런을 켜는지** 직접 확인합니다.",
  "그 배선도를 만드는 AI(3D U-Net)를 직접 학습시켜, **지도가 어떻게 만들어지는지** 체험합니다.",
  "둘을 이어 **내가 만든 지도로 시뮬레이션**까지 해 봅니다.",
]);
H2("Phase 1 실험 흐름");
PLANNED(2, "Phase 2 · Phase 3 실험 흐름 — 각 Phase 시작 때 추가");
T(["단계", "문제 / 질문", "한 것", "결과", "상태"], [
  ["①", "내 노트북에서 뇌 전체가 돌아가나?", "단맛 자극 1회 (스모크 테스트)", "MN9 81~82Hz, 46초 · 3.1GB", "완료"],
  ["②", "결과가 매번 다르고, 보고 싶은 뉴런이 안 보임", "시드 고정, 자극 뉴런 제외 · 이름 표시, 실행 간소화", "같은 시드 두 번 → 스파이크 13,698개 완전히 일치", "완료"],
  ["③", "3D 모양 데이터와 버전이 다름, 이름 붙은 뉴런이 적음", "v783으로 전환, 세포 유형 주석 연결", "", "다음"],
  ["④", "단맛 말고 다른 맛은?", "단맛 · 쓴맛 · 물 × 30회 비교", "", "예정"],
  ["⑤", "켜진 뉴런은 뇌의 어디에?", "발화율대로 색칠한 3D 뇌", "", "예정"],
  ["⑥", "어떤 뉴런이 꼭 필요한가?", "뉴런을 하나씩 끄는 가상 절제", "", "예정"],
], [0.7, 2.8, 3.1, 2, 1]);
H2("흐름 한 줄");
NOTE("환경을 세웠다 → 단맛을 넣었더니 입 운동 뉴런이 켜졌다(①) → 같은 시드면 같은 결과가 나오게 다듬었다(②) → 버전을 맞춘다(③) → 맛끼리 비교한다(④) → 뇌 위에 그린다(⑤) → 꼭 필요한 뉴런을 찾는다(⑥) → 지도를 직접 만든다(Phase 2)");
H2("이 문서의 구성");
T(["장", "담는 것", "진행하면서 바뀌는 것"], [
  ["1. 개요", "배경 · 기술 · 목표 · 지금 위치 · 원본과 다른 점", "목표의 \"지금 값\", 단계 상태"],
  ["2. 프로젝트 흐름", "실험 흐름 표, 흐름 한 줄", "표의 결과 칸, Phase별 흐름 표 추가"],
  ["3. 기초 개념", "실험을 읽기 위한 용어 (개념 1~4)", "Phase 2부터 개념 5~ 추가"],
  ["4. Phase 1 실험", "실험별 왜 · 무엇 · 결과 · 해석 · 한계 · 넘긴 문제 · 기록", "실험이 끝날 때마다 ②, ③ … 절 추가"],
  ["5. Phase 2 · 3 실험", "3D U-Net 분할, 미니 커넥톰", "각 Phase 시작 때 장으로 채움"],
  ["6. 환경 · 결정 · 문제 해결", "실험이 돌아가는 바탕", "결정 · 문제가 생길 때마다 행 추가"],
  ["7. 참고", "연구 흐름, 쥐 뇌 가능성, 논문과 자료", "새로 읽은 자료 추가"],
], [2.2, 4, 3.4]);

// ═════════════════════════ 개념 ═════════════════════════
H1("3. 기초 개념", true);

H2("개념 1. 커넥톰");
H3("뜻");
B([
  "뇌 안의 **모든 뉴런과, 누가 누구에게 신호를 보내는지(시냅스)를 전부 적은 배선도**입니다.",
  "그래프로 보면 뉴런이 점(노드), 시냅스 연결이 화살표(엣지)입니다.",
  "화살표마다 **연결 세기**(시냅스 개수)와 **부호**(흥분성 + 신호를 켬 / 억제성 − 신호를 끔)가 붙습니다.",
]);
H3("지금 가진 데이터 (파일에서 직접 집계)");
T(["", "v630 (논문 버전)", "v783 (공개 최신)"], [
  ["뉴런", "127,400개", "138,639개"],
  ["연결 (뉴런 쌍)", "14,687,178개", "15,091,983개"],
  ["시냅스 합계", "약 5,279만 개", "약 5,449만 개"],
  ["흥분성 / 억제성 연결", "880만 / 589만", "906만 / 603만"],
], [3, 3.3, 3.3]);
H3("배선도만으로 알 수 없는 것");
B([
  "시냅스의 실제 세기(개수로 추정할 뿐), 전기 시냅스, 도파민 같은 신경조절물질, 학습으로 바뀐 연결",
  "그래서 배선도 기반 모델은 **단순화된 모델**입니다. 초파리는 행동이 타고난 배선에 많이 새겨져 있어서 그래도 잘 맞습니다.",
]);

H2("개념 2. FlyWire와 데이터 버전");
B([
  "성체 초파리 뇌 전체 커넥톰을 만든 프로젝트입니다(프린스턴 세바스찬 승 · 말라 머피, 2024 Nature).",
  "구글의 딥러닝 모델이 뉴런을 자동으로 따라 그리고, 전 세계 연구자와 자원봉사자가 오류를 고쳤습니다.",
  "데이터는 교정되면서 버전이 올라가고, 버전이 바뀌면 **같은 뉴런도 ID가 바뀔 수 있습니다**.",
  [
    "**v630**: Shiu et al. 논문 버전. 지금 시뮬레이션은 이것으로 돌립니다.",
    "**v783**: 공개 최신 버전. 3D 모양(메시) 데이터가 이 기준이라 시각화 때 바꿉니다.",
  ],
  "FlyWire Codex(codex.flywire.ai)에서 뉴런을 3D로 돌려 보고 ID로 검색할 수 있습니다.",
]);

H2("개념 3. LIF 뉴런 모델");
H3("뜻");
B([
  "뉴런을 **물이 새는 양동이**로 보는 가장 단순한 스파이킹 뉴런 모델입니다.",
  [
    "Integrate: 들어오는 신호를 전압으로 모읍니다.",
    "Leaky: 가만히 두면 전압이 서서히 원래대로 돌아갑니다.",
    "Fire: 전압이 문턱을 넘으면 스파이크를 쏘고 리셋됩니다.",
  ],
]);
H3("Shiu et al. 모델에서");
CODE([
  "dv/dt = (v_0 - v + g) / t_mbr     # 막전위",
  "dg/dt = -g / tau                  # 시냅스 입력 (서서히 사라짐)",
  "다른 뉴런이 발화하면 g += w      # w = 시냅스 개수 x 부호 x 0.275mV",
]);
T(["파라미터", "값", "뜻"], [
  ["`v_0`, `v_rst`", "−52mV", "휴지 전위, 리셋 전위"],
  ["`v_th`", "−45mV", "발화 문턱"],
  ["`t_mbr`", "20ms", "막 시간 상수 (얼마나 빨리 새나)"],
  ["`tau`", "5ms", "시냅스 입력이 사라지는 속도"],
  ["`t_rfc` / `t_dly`", "2.2ms / 1.8ms", "불응기 / 신호 전달 지연"],
  ["`w_syn`", "0.275mV", "시냅스 1개당 세기 (자유 파라미터)"],
  ["`r_poi`", "150Hz", "자극 세기 (포아송 입력 빈도)"],
  ["`t_run`, `n_run`", "1초, 30회", "시뮬레이션 길이, 반복 횟수"],
], [2.6, 2, 5]);
H3("자극과 결과 읽기");
B([
  "**자극**: 자극할 뉴런에 평균 150Hz의 무작위(포아송) 입력을 줍니다. 빛으로 뉴런을 켜는 광유전학 실험을 흉내 낸 것입니다.",
  "**무작위라서** 실행마다 결과가 조금씩 다릅니다 → 여러 번 반복해 평균을 내거나 시드를 고정합니다.",
  "**절제(끄기)**: 그 뉴런의 시냅스 가중치를 0으로 만듭니다.",
  "**발화율(Hz)**: 1초 동안 스파이크를 몇 번 쐈는지. 반복의 평균입니다.",
]);

H2("개념 4. 커넥톰 제작 과정");
P("뇌를 얇게 썰어서 → 사진 찍고 → AI가 따라 그리고 → 사람이 검수하고 → 컴퓨터에서 돌립니다.");
T(["단계", "하는 일", "이 프로젝트"], [
  ["1. 썰기 · 2. 촬영", "뇌를 약 40nm 두께로 썰어 전자현미경 촬영 (초파리: 약 7,000장, 사진 약 2천만 장, 약 100TB)", ""],
  ["3. 정렬", "휘고 찢어진 조각을 이어 붙이고 위아래를 맞춤", ""],
  ["4. AI 분할", "픽셀마다 어느 뉴런인지 판별 (3D U-Net, Flood-Filling Network)", "Phase 2"],
  ["5. 시냅스", "시냅스 위치 · 방향, 흥분성 · 억제성 예측", "Phase 3"],
  ["6. 검수", "잘못 붙은 · 끊긴 뉴런 고치기, 세포 유형 이름 붙이기", ""],
  ["7. 그래프 · 8. 시뮬레이션", "뉴런 = 노드, 시냅스 = 엣지 → LIF 모델로 돌리기", "Phase 1"],
], [2.4, 5.6, 1.6]);
H3("3D U-Net 뉴런 분할 (Phase 2 미리 보기)");
B([
  "데이터: CREMI(성체 초파리 뇌, 1250 × 1250 × 125 복셀 덩어리 3개, 해상도 가로세로 4nm · 두께 40nm)",
  "두께 방향 해상도가 10배 낮아서(비등방성) 초반 층은 가로세로로만 줄입니다.",
  "경계 대신 **친화도**(이웃 복셀과 같은 뉴런일 확률)를 예측 → watershed로 작은 조각 → 같은 뉴런끼리 합치기",
  "평가: VOI(잘못 붙음과 잘못 잘림을 따로 봄), Adapted Rand Error(CREMI 공식 지표)",
]);

PLANNED(2, "개념 5~ (3D U-Net · 친화도 · 평가 지표) — Phase 2 시작 때 추가");

// ═════════════════════════ 실험 ═════════════════════════
H1("4. Phase 1 실험", true);

H2("① 스모크 테스트 (단맛 자극 1회)");
H3("왜 했나");
B([
  "30회 반복 실험에 들어가기 전에, **내 노트북에서 뇌 전체(뉴런 12만 개)가 정말 돌아가는지** 확인해야 했습니다.",
  "1회에 걸리는 시간과 메모리를 알아야 병렬 실행 수를 정할 수 있습니다.",
  "원본 예제와 같은 반응(단맛 → MN9)이 나오는지 확인해 설치가 제대로 됐는지 검증하려는 목적도 있었습니다.",
]);
H3("무엇을 했나");
T(["항목", "설정"], [
  ["데이터", "FlyWire v630 (뉴런 127,400개, 논문과 같은 버전)"],
  ["모델", "Shiu et al. LIF 모델, 기본 파라미터 (개념 3 참고)"],
  ["자극", "오른쪽 단맛 감지 뉴런 21개, 150Hz 포아송 입력"],
  ["관찰 대상", "MN9 — 입(주둥이)을 내미는 운동 뉴런"],
  ["반복", "1회 × 1초 (논문 기본은 30회), 시드 없음"],
  ["실행 환경", "Brian2 2.10.1 (C++ 고속 모드), `n_proc=1`"],
], [2, 7.6]);
H3("결과");
T(["항목", "1차 (09-28)", "2차 (10-06, 직접 실행)", "원본 예제 참고값"], [
  ["**MN9 발화율**", "**82.0Hz**", "**81.0Hz**", "—"],
  ["발화한 뉴런", "378개", "376개", "약 400개 (30회 기준)"],
  ["총 스파이크 (1회당)", "13,858개", "13,437개", "약 13,300개 (30회 40만 개 ÷ 30)"],
  ["걸린 시간", "46초", "45초", "—"],
  ["최대 메모리", "약 3.1GB", "—", "—"],
], [2.4, 2, 2.4, 2.8]);
B([
  "단맛 뉴런만 자극했는데 **입 운동 뉴런 MN9가 약 80Hz로 발화**했습니다.",
  "뉴런 12만 개 중 반응한 것은 약 380개, 1회당 스파이크 수도 원본 예제의 설명과 같은 규모입니다. → 설치와 실행이 제대로 됐다고 판단",
]);
H3("왜 이렇게 나왔나");
B([
  "단맛 감지 뉴런에서 나간 흥분성 신호가 배선을 따라 전달되어, 먹는 행동을 담당하는 운동 뉴런까지 도달했습니다. Shiu et al.이 논문에서 보인 \"단맛 → 먹기\" 회로가 학습 없이 배선도만으로 재현된 것입니다.",
  "반응한 뉴런이 380개 정도로 적은 것은, 신호가 뇌 전체로 퍼지지 않고 **특정 경로로만** 전달되기 때문입니다. 억제성 연결도 퍼짐을 막는 역할을 했을 수 있습니다(아직 확인 전).",
  "1차와 2차가 82Hz · 81Hz로 다른 것은 자극이 무작위(포아송)이기 때문입니다.",
]);
H3("한계");
B([
  "1회뿐이라 평균이 아닙니다. 시드가 없어 같은 숫자를 다시 낼 수 없습니다.",
  "\"발화율 상위 10개\"가 전부 **자극한 단맛 뉴런 자신**(150~170Hz)이라, 정작 궁금한 \"새로 켜진 중간 뉴런\"이 보이지 않았습니다.",
  "다른 맛과 비교하지 않아, 82Hz가 큰 값인지 판단할 기준이 없습니다.",
  "배선표만 있고 3D 모양 데이터가 없어 뇌 위에 그릴 수 없습니다.",
]);
H3("넘긴 문제");
B([
  "결과를 믿고 볼 수 있게 → 시드 고정, 자극 뉴런 제외, 뉴런 이름 표시 → **②**",
  "다른 맛과 비교 → **④ 맛 비교**",
  "켜진 뉴런이 어디 있나 → **③ 버전 전환 → ⑤ 3D 시각화**",
  "병렬 실행: 1회 약 3GB라 16개 동시 실행은 불가능 → 4개로 설정",
]);
H3("관련 기록");
B([
  "날짜: 2026-09-28 (1차), 2026-10-06 (2차) / 커밋: 87c8a07(스모크 테스트), 2fcc59e(모니터링 스크립트)",
  "실행: `uv run python phase1_simulation/smoke_test.py`",
  "결과: `outputs/phase1/smoke_sugarR.parquet` / 로그: `outputs/logs/smoke.log`, `smoke.time`, `smoke.mem`",
  "원본 예제: `external/Drosophila_brain_model/example.ipynb`",
]);

H2("② 실행 정리 (시드 고정 · 출력 개선)");
H3("왜 했나");
B([
  "①에서 같은 실험을 두 번 돌렸더니 MN9가 82Hz · 81Hz로 달랐습니다. 시드가 없어 **같은 숫자를 다시 낼 수 없었습니다**.",
  "결과 출력의 \"발화율 상위 10개\"가 전부 자극한 단맛 뉴런 자신이라, **새로 켜진 중간 뉴런**이 보이지 않았습니다.",
  "실행할 때마다 `cd` → 가상환경 → 긴 명령을 치는 게 번거로웠고, 정리 문서를 만드는 스크립트가 임시 폴더에 있었습니다.",
]);
H3("무엇을 했나");
T(["항목", "내용"], [
  ["실행 모듈 `flysim.py`", "원본 코드는 그대로 두고 모델 생성 함수만 가져다 쓰는 래퍼. trial마다 시드를 `seed + trial 번호`로 고정"],
  ["실행 기록", "결과(.parquet) 옆에 설정을 JSON으로 저장: 데이터 버전, 시드, 반복 횟수, 자극 세기, 자극 · 끈 뉴런, 걸린 시간"],
  ["결과 요약", "자극한 뉴런을 빼고 상위 15개 표시. MN9는 좌우 모두 표시. 이름은 감각 뉴런 그룹 · MN9 · SEZ 세포 유형 106종(`sez_neurons.pickle`)으로 붙임"],
  ["뉴런 목록", "논문 그림 노트북(figures.ipynb)에서 단맛 · 쓴맛 · 물 · Ir94e 감각 뉴런 ID를 가져와 정리 (④에서 사용)"],
  ["재현성 확인", "`make repro`: 같은 시드로 두 번 돌려 스파이크가 하나도 안 다른지 비교"],
  ["실행 간소화", "Makefile: `make smoke` · `repro` · `smoke-mon` · `report` · `setup` · `help`"],
  ["문서 스크립트", "정리 문서 생성 스크립트를 저장소 `docs/report/`로 옮김 → `make report`"],
], [2.4, 7.2]);
H3("결과");
T(["항목", "값"], [
  ["**재현성**", "**같은 시드(0)로 두 번 → 스파이크 13,698개 vs 13,698개, 완전히 같음**"],
  ["MN9 좌 / 우", "80.0Hz / 64.0Hz (1회, seed=0)"],
  ["반응한 뉴런", "375개 (자극한 21개 포함 → 새로 켜진 뉴런 354개)"],
  ["새로 켜진 뉴런 최고 발화율", "139Hz (이름 없음, ID 720575940622695448)"],
  ["상위 15개 중 이름이 붙은 뉴런", "6개: tinctoria(2), G2N_1, rattle, usnea, clavicle"],
  ["걸린 시간", "1차 10초, 2차 54초 (같은 설정인데 차이가 큼, 원인 미확인)"],
], [3, 6.6]);
H3("왜 이렇게 나왔나");
B([
  "Brian2의 `seed()`는 파이썬 쪽 난수와 C++로 변환된 코드의 난수를 함께 고정합니다. 그래서 포아송 자극의 타이밍이 매번 같아지고, 결과가 스파이크 하나까지 같아졌습니다.",
  "trial마다 `seed + trial 번호`를 쓰기 때문에, 30회 반복해도 trial끼리는 서로 다른 무작위 입력을 받으면서 전체 실험은 다시 돌려도 같습니다.",
  "자극한 뉴런을 빼자 140Hz 안팎의 중간 뉴런들이 보이기 시작했습니다. 다만 이름 파일이 입 주변(SEZ) 106종만 다뤄서 대부분 이름이 없습니다.",
  "오른쪽 단맛 뉴런을 자극했는데 MN9는 좌우 모두 켜졌고 왼쪽이 더 높았습니다. 왜 그런지는 아직 확인하지 않았습니다.",
]);
H3("한계");
B([
  "이름이 붙은 뉴런이 적습니다. 뇌 전체의 세포 유형 이름(FlyWire 주석)은 아직 연결하지 않았습니다.",
  "여전히 1회 결과입니다. 맛끼리 비교하려면 30회 평균이 필요합니다.",
  "실행 시간이 10초와 54초로 크게 달랐는데 원인을 확인하지 않았습니다.",
  "`fly` 별칭(터미널에서 `fly`만 치면 프로젝트로 이동)은 셸 설정 파일을 고치는 작업이라 직접 추가하기로 했습니다.",
]);
H3("넘긴 문제");
B([
  "이름 붙은 뉴런이 적음 + 3D 모양 데이터와 버전이 다름 → **③ v783 전환과 세포 유형 주석 연결**",
  "30회 평균으로 맛끼리 비교 → **④ 맛 비교** (뉴런 목록은 이번에 준비 완료)",
]);
H3("관련 기록");
B([
  "날짜: 2026-10-30 / 커밋: 03bc91f(실행 모듈), 388dda6(재현성 확인), 8bb702c(문서 스크립트), 3c24592(Makefile), 76d1f10(README)",
  "실행: `make smoke`, `make repro`",
  "결과: `outputs/phase1/smoke_sugarR.parquet` + `smoke_sugarR.json`, `smoke_sugarR_again.*`",
]);
["③ v783 전환", "④ 맛 비교 (단맛 · 쓴맛 · 물)", "⑤ 3D 시각화", "⑥ 가상 절제"].forEach((t) => PLANNED(2, t));

H2("다음 실험 계획 (③~⑥)");
T(["단계", "왜 하나", "무엇을 하나", "확인할 것"], [
  ["③ v783 전환", "3D 모양 데이터가 v783 기준, 이름 붙은 뉴런이 적음", "v783 배선도와 단맛 뉴런 ID로 다시 실행, FlyWire 세포 유형 주석 연결", "①·②와 같은 반응(MN9 발화)이 나오는가, 상위 뉴런 이름"],
  ["④ 맛 비교", "MN9 80Hz가 의미 있는 값인지 비교 기준이 필요", "단맛 · 물 · 쓴맛 각각 30회 + 단맛과 쓴맛 동시 자극(논문 그림 3 방식) → MN9 막대그래프", "단맛 · 물은 MN9를 켜고, 쓴맛은 단맛의 효과를 줄이는가"],
  ["⑤ 3D 시각화", "켜진 뉴런이 뇌의 어디에 있는지 보고 싶음", "발화율대로 색칠한 3D 뇌를 브라우저에서 돌려 보기 (navis, plotly)", "맛마다 켜지는 영역이 다른가"],
  ["⑥ 가상 절제", "어떤 뉴런이 꼭 필요한지 알고 싶음", "중간 뉴런을 하나씩 꺼 보며 MN9 변화 관찰", "MN9를 끄는 핵심 뉴런이 있는가"],
], [1.5, 2.6, 3.2, 2.3]);

// ═════════════════════════ 환경 · 결정 · 문제 해결 ═════════════════════════
H1("5. Phase 2 · 3 실험", true);
NOTE("아직 시작 전입니다. 각 Phase를 시작하면 이 장을 Phase 1 실험과 같은 틀(왜 했나 / 무엇을 했나 / 결과 / 왜 이렇게 나왔나 / 한계 / 넘긴 문제 / 관련 기록)로 채웁니다.");
H2("Phase 2. 3D U-Net 뉴런 분할 (예정)");
T(["주차", "할 일"], [
  ["1주", "CREMI 데이터 열기, 시각화, 2D U-Net 베이스라인"],
  ["2~3주", "3D U-Net + 친화도(affinity) 예측"],
  ["4주", "Watershed + 합치기 → 뉴런 분리"],
  ["5주", "VOI, Adapted Rand Error로 평가하고 튜닝, 리더보드와 비교"],
  ["6주", "Neuroglancer 또는 napari로 3D 시각화"],
], [1.4, 8.2]);
H2("Phase 3. 미니 커넥톰 완주 (예정)");
B([
  "시냅스 검출 모델 추가",
  "내가 분할한 뉴런과 시냅스로 연결 그래프 만들기",
  "그 그래프를 Phase 1 방식으로 시뮬레이션",
]);
H2("Phase 4. 고도화 (선택)");
T(["트랙", "내용"], [
  ["A. 가상 실험실", "뉴런을 하나씩 꺼 보며 핵심 회로 찾기, 논문 결과 재현"],
  ["B. 학습하는 뇌 (추천)", "PyTorch/GPU로 이식 → 시냅스 세기 학습 → 도파민 가소성으로 냄새를 기억하는 초파리"],
  ["C. 행동하는 초파리", "시각 모델(flyvis)과 가상 몸(NeuroMechFly) 연결"],
  ["D. AI 응용", "초파리 배선을 신경망 구조로 써서 성능과 효율 비교"],
], [2.6, 7]);

H1("6. 환경 · 결정 · 문제 해결", true);
H2("환경");
T(["항목", "내용"], [
  ["노트북", "HP EliteBook 8 G1i, Core Ultra 7 255H (16코어), RAM 32GB, Intel Arc 140T 내장 GPU"],
  ["OS", "Windows 11 + WSL2 Ubuntu 26.04 (WSL 메모리 약 15GB)"],
  ["컴파일러", "gcc / g++ 15.2 (`build-essential`) — Brian2 고속 모드에 필요"],
  ["Python", "3.12.10 (uv로 관리). 우분투 시스템 Python 3.14는 건드리지 않음"],
  ["주요 패키지", "brian2 2.10.1, cython, numpy 2.5, pandas 3.0, pyarrow, joblib, matplotlib"],
  ["에디터 · 저장소", "VS Code (WSL 모드) · `~/project/fly-brain` ↔ GitHub `suyeon0121/fly-brain`"],
  ["GPU 학습", "Google Colab (노트북에 CUDA 없음)"],
], [2, 7.6]);
P("**커밋 규칙**: 기능 단위로, `유형: 제목` (feat · fix · refactor · docs · chore). 예: `feat: 단맛 뉴런 자극 스모크 테스트 추가`");

H2("결정 기록");
T(["날짜", "결정", "이유"], [
  ["09-27", "Phase 1을 짧게 먼저, 메인은 Phase 2", "Phase 1은 며칠이면 끝나고 전체 그림을 먼저 볼 수 있음"],
  ["09-27", "conda 대신 uv, Python 3.12.10", "가볍고 sudo 불필요. 3.14는 라이브러리 호환 위험"],
  ["09-28", "데이터 · 외부 코드는 git 제외, 원본 코드는 참조만", "GitHub 100MB 제한, 출처 구분"],
  ["09-28", "병렬 4개", "1회 약 3GB × 16 > WSL 메모리 15GB"],
  ["09-28", "v630으로 시작, 시각화 때 v783", "논문과 비교 가능 / 3D 모양 데이터가 v783 기준"],
  ["10-06", "Docker 쓰지 않음", "uv로 환경 고정 충분. 켜 두면 WSL 메모리를 나눠 씀"],
  ["10-06", "커밋 규칙 도입, 기존 커밋 5개로 재작성", "기능 단위 기록. 예전 기록은 `backup/before-rewrite`에 보관"],
  ["10-06", "폴더를 `~/project/fly-brain`으로 이동", "다른 프로젝트와 같은 곳에서 관리"],
  ["10-30", "원본 `run_exp` 대신 `flysim.py` 래퍼, trial별 시드 `seed + trial`", "원본 코드는 그대로 두면서 재현성 확보"],
  ["10-30", "정리 문서 생성 스크립트를 저장소 `docs/report/`에 보관, `make report`", "임시 폴더는 지워질 수 있음. 문서 변경도 git에 남김"],
], [1, 4.3, 4.3]);

H2("문제 해결");
T(["날짜", "증상", "원인", "해결 / 다음엔"], [
  ["09-28", "설치 직후 import 실패, 13개 패키지 손상", "WSL이 저절로 재시작되며 저장 전 파일이 0바이트로 남음 (재시작 이유는 미확인)", "가상환경 · uv 캐시 · cython 캐시 재생성 / 설치 후 `sync`"],
  ["09-28", "PowerShell에서 WSL 명령이 깨짐", "`wsl.exe`가 `$`와 따옴표를 다르게 해석", "`.sh` 파일로 만들어 실행"],
  ["10-06", "VS Code에 파일이 안 보이고 `Git: Clone`이 없음", "VS Code 자동 업데이트 후 WSL 확장(v0.104.3) 비호환 → 서버가 안 뜸", "WSL 확장 업데이트 → Reload Window"],
  ["10-06", "폴더 이동 후 가상환경 오류", "`.venv`에 예전 절대 경로가 남아 있음", "`.venv` 삭제 후 `uv sync`"],
], [1, 2.6, 3.4, 3]);

// ═════════════════════════ 참고 ═════════════════════════
H1("7. 참고", true);
H2("초파리 뇌 연구 흐름");
T(["시기", "사건"], [
  ["1910년~", "토머스 헌트 모건, 초파리 유전학 시작"],
  ["1960~70년대", "시드니 브레너(선충 선택), 시모어 벤저(초파리 행동 유전학)"],
  ["1986", "선충 뉴런 302개 배선도 완성 (손으로 10년 넘게)"],
  ["2018 · 2020", "초파리 뇌 전체 촬영(FAFB) · 뇌 절반 공개(hemibrain)"],
  ["2024", "FlyWire 뇌 전체 완성, Shiu et al. 뇌 모델, Lappalainen et al. 시각계 모델"],
  ["2025", "초파리 몸 전체 물리 시뮬레이션 (재니리아 + 구글 딥마인드)"],
  ["2026.03", "Eon Systems, 뇌 시뮬레이션을 가상 몸에 연결 (스타트업 자체 발표)"],
], [2, 7.6]);
B([
  "**왜 초파리인가**: 뇌가 작지만 날기 · 길 찾기 · 학습까지 합니다. 선충은 너무 단순하고 쥐는 너무 큽니다. 뉴런 하나를 켜고 끄는 유전자 도구가 잘 갖춰져 있어 모델 예측을 실험으로 확인할 수 있습니다.",
  "**Eon 발표를 볼 때**: 동료 심사 전 발표이고, 2024년 뇌 모델과 2025년 가상 몸을 합친 것에 가깝습니다. \"마음 복제\"가 아니라 \"배선도만으로 기본 행동 재현\"입니다.",
]);
H2("쥐 뇌 에뮬레이션은 가능한가");
NOTE("**컴퓨터는 준비됐는데 지도가 없다.** 실제 배선 그대로의 쥐 뇌 전체를 2년 안에 에뮬레이션하는 것은 매우 어렵습니다.");
B([
  "규모: 뉴런 약 500배(약 7천만 개), 시냅스 약 2,000배(약 1천억 개)",
  "지금까지 최대 성과는 쥐 시각 피질 1mm³(MICrONS). 뇌 전체는 그 수백 배이고, 데이터는 엑사바이트급입니다.",
  "계산과 가상 몸은 준비돼 있지만, 쥐는 학습 의존이 커서 배선만으로는 부족할 수 있습니다.",
  "→ 지도 제작의 핵심인 AI 분할이 이 프로젝트 Phase 2의 주제입니다.",
]);
H2("논문과 자료");
T(["자료", "이 프로젝트와의 관계"], [
  ["Dorkenwald et al. (2024). Neuronal wiring diagram of an adult brain. Nature", "FlyWire 커넥톰 — 모든 실험의 데이터"],
  ["Shiu et al. (2024). A Drosophila computational brain model reveals sensorimotor processing. Nature", "Phase 1에서 돌리는 LIF 모델과 코드"],
  ["Lappalainen et al. (2024). Connectome-constrained networks predict neural activity across the fly visual system. Nature", "Phase 4 — 커넥톰 + 딥러닝 (flyvis)"],
  ["Whole-body physics simulation of fruit fly locomotion (2025). Nature", "Phase 4 — 가상 초파리 몸"],
  ["github.com/philshiu/Drosophila_brain_model", "Phase 1 원본 코드 (external/)"],
  ["codex.flywire.ai", "뉴런 3D 구경, ID 검색"],
  ["CREMI 챌린지 · SNEMI3D", "Phase 2 학습 데이터와 벤치마크"],
  ["eon.systems/updates/embodied-brain-emulation", "배경 — 뇌와 가상 몸 연결"],
], [6, 3.6]);

// ═════════════════════════ 목차 끼워 넣기 ═════════════════════════
const tocParas = [
  new Paragraph({ children: [new TextRun({ text: "목차", font: FONT, size: 30, bold: true, color: ACCENT })], spacing: { before: 120, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 4 } } }),
  ...toc.map((e) => new Paragraph({
    indent: { left: e.level === 1 ? 0 : 440 },
    spacing: { before: e.level === 1 ? 160 : 30, after: 30 },
    children: [new TextRun({
      text: e.planned ? `${e.text}${e.text.includes("추가") ? "" : " (예정)"}` : e.text,
      font: FONT, bold: e.level === 1, size: e.level === 1 ? 23 : 20,
      color: e.planned ? "A6A6A6" : e.level === 1 ? "1F1F1F" : "404040", italics: !!e.planned,
    })],
  })),
  new Paragraph({ spacing: { before: 240 }, children: runs("회색 항목은 진행하면서 채워질 자리입니다.", { color: "7F7F7F", size: 18 }) }),
];
out.splice(TOC_AT, 0, ...tocParas);

// ═════════════════════════ 문서 ═════════════════════════
const doc = new Document({
  creator: "suyeon",
  title: "초파리 뇌 프로젝트 정리",
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, color: ACCENT, font: FONT },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0, keepNext: true,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 27, bold: true, color: "1F1F1F", font: FONT },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, color: ACCENT, font: FONT },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 240 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 800, hanging: 240 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "808080" })] })] }) },
    children: out,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[2], buf);
  console.log("written", process.argv[2], buf.length, "bytes");
});
