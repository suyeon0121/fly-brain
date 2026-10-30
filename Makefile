UV ?= uv
PY := $(UV) run python
RUN_MON := bash phase1_simulation/run_monitored.sh
SHIU_REPO := https://github.com/philshiu/Drosophila_brain_model.git

REPORT_OUT ?= outputs/report/fly-brain-report.docx
NODE := bash -c 'source $$HOME/.nvm/nvm.sh >/dev/null 2>&1; exec "$$@"' --

.PHONY: help setup smoke repro smoke-mon report

help:  ## 명령 목록
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

setup:  ## 패키지 설치 + 원본 코드 · 커넥톰 받기 (새 컴퓨터용)
	$(UV) sync && sync
	@test -d external/Drosophila_brain_model || git clone $(SHIU_REPO) external/Drosophila_brain_model

smoke:  ## 스모크 테스트: 단맛 자극 1회 (seed=0)
	$(PY) phase1_simulation/smoke_test.py

repro:  ## 재현성 확인: 같은 시드로 두 번 돌려 결과 비교
	$(PY) phase1_simulation/smoke_test.py --check

smoke-mon:  ## 스모크 테스트 + 시간 · 메모리 기록
	$(RUN_MON) phase1_simulation/smoke_test.py smoke

report:  ## 프로젝트 정리 문서(.docx) 만들기 → $(REPORT_OUT)
	@test -d docs/report/node_modules || (cd docs/report && $(NODE) npm install --silent)
	@mkdir -p $(dir $(REPORT_OUT))
	cd docs/report && $(NODE) node build.js $(abspath $(REPORT_OUT))
