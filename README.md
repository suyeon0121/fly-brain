# fly-brain 🪰🧠

초파리 뇌 커넥톰(connectome)을 직접 **돌려 보고**, 뇌 지도를 딥러닝으로 **만들어 보고**, 둘을 이어서 **완주**해 보는 개인 프로젝트입니다.

> 사진 → 지도 → 시뮬레이션

## 로드맵

| Phase | 내용 | 기간 | 상태 |
|---|---|---|---|
| 0 | 환경 준비 (WSL Ubuntu, uv, Python 3.12.10, VS Code) | 2~3일 | ✅ 완료 |
| 1 | 초파리 뇌 시뮬레이션 — FlyWire 커넥톰 + Brian2 LIF 모델 (Shiu et al., 2024) | 1주 | 🟢 진행 중 |
| 2 | 3D U-Net 뉴런 분할 — CREMI 데이터셋, 친화도(affinity) 예측 + watershed | 5~6주 | ⬜ |
| 3 | 미니 커넥톰 — 시냅스 검출 → 연결 그래프 → 시뮬레이션 | 2~3주 | ⬜ |
| 4 | 고도화 (가상 절제 / 시냅스 세기 학습 / 가상 몸 연결 / AI 응용) | 자유 | ⬜ |

## 폴더 구조

```
phase1_simulation/     초파리 뇌 시뮬레이션 실험 (flysim.py: 시드 고정 · 이름 표시 래퍼)
phase2_segmentation/   3D U-Net 뉴런 분할
phase3_connectome/     미니 커넥톰
docs/report/           프로젝트 정리 문서(.docx) 생성 스크립트
external/              외부 원본 코드 (git 제외)
data/, outputs/        데이터 · 결과 (git 제외)
```

## 환경

- WSL2 Ubuntu 26.04, gcc 15
- Python 3.12.10 (uv로 관리)
- 무거운 학습은 Google Colab 사용

```bash
cd ~/project/fly-brain
make setup      # 패키지 설치 + 원본 코드 · 커넥톰 받기
make help       # 명령 목록
```

## 실행

```bash
make smoke      # 단맛 자극 1회 (seed=0)
make repro      # 같은 시드로 두 번 돌려 결과가 같은지 확인
make report     # 프로젝트 정리 문서 만들기 → outputs/report/
```

## 참고 자료

- Dorkenwald et al. (2024). *Neuronal wiring diagram of an adult brain.* Nature — FlyWire
- Shiu et al. (2024). *A Drosophila computational brain model reveals sensorimotor processing.* Nature
- Lappalainen et al. (2024). *Connectome-constrained networks predict neural activity across the fly visual system.* Nature
- CREMI: MICCAI Challenge on Circuit Reconstruction from Electron Microscopy Images
