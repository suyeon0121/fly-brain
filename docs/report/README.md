# 프로젝트 정리 문서

`build.js`가 「초파리 뇌 프로젝트 정리」 Word 문서(.docx)를 만든다. 내용과 서식이 모두 이 파일 안에 있다.

## 만들기

```bash
make report                     # → outputs/report/fly-brain-report.docx
```

처음 한 번은 `docs/report`에서 `npm install`이 필요하다 (`make report`가 알아서 한다). Node는 nvm으로 설치된 것을 쓴다.

## 내용 추가하기

- 실험이 끝나면 `4. Phase 1 실험` 장에 절을 추가한다. 틀: 왜 했나 / 무엇을 했나 / 결과 / 왜 이렇게 나왔나 / 한계 / 넘긴 문제 / 관련 기록
- 목차는 `H1` · `H2`로 추가한 제목에서 자동으로 만들어진다. 아직 안 한 실험은 `PLANNED(2, "...")`로 회색 표시
- 함께 갱신할 곳: `1. 개요`의 목표 표 "지금 값", `2. 프로젝트 흐름`의 실험 흐름 표, `다음 실험 계획` 표

## 미리 보기 (Windows, Word 설치 필요)

`render_preview.ps1`은 PDF 페이지를 PNG로 바꾼다. Word로 docx를 PDF로 내보낸 뒤 사용:

```powershell
.\render_preview.ps1 -Pdf preview.pdf -OutDir . -Pages 1,2,3
```
