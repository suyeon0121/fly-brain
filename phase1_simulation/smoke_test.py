"""Phase 1 스모크 테스트.

1) Brian2 C++(Cython) 코드 생성이 동작하는지 확인
2) 단맛 뉴런 자극 실험을 1회(trial)만 돌려 시간과 결과 확인

실행: cd ~/fly-brain && .venv/bin/python phase1_simulation/smoke_test.py
"""
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHIU = ROOT / "external" / "Drosophila_brain_model"
sys.path.insert(0, str(SHIU))

import brian2 as b2

# 1) C++ 코드 생성 확인
b2.prefs.codegen.target = "cython"
t0 = time.time()
g = b2.NeuronGroup(10, "dv/dt = -v / (10*ms) : 1")
b2.run(1 * b2.ms)
print(f"[1] Brian2 {b2.__version__} cython 코드 생성 OK ({time.time() - t0:.1f}s, 첫 실행은 컴파일 포함)")

# 2) 단맛 뉴런 자극, 1회만
from model import run_exp, default_params
import utils as utl

params = dict(default_params)
params["n_run"] = 1

# example.ipynb의 오른쪽 단맛 감지 뉴런 21개 (FlyWire v630 ID)
neu_sugar = [
    720575940624963786, 720575940630233916, 720575940637568838, 720575940638202345,
    720575940617000768, 720575940630797113, 720575940632889389, 720575940621754367,
    720575940621502051, 720575940640649691, 720575940639332736, 720575940616885538,
    720575940639198653, 720575940620900446, 720575940617937543, 720575940632425919,
    720575940633143833, 720575940612670570, 720575940628853239, 720575940629176663,
    720575940611875570,
]
ID_MN9 = 720575940660219265  # 입(proboscis) 운동 뉴런 MN9

res_dir = ROOT / "outputs" / "phase1"
res_dir.mkdir(parents=True, exist_ok=True)

run_exp(
    exp_name="smoke_sugarR",
    neu_exc=neu_sugar,
    params=params,
    path_res=res_dir,
    path_comp=SHIU / "2023_03_23_completeness_630_final.csv",
    path_con=SHIU / "2023_03_23_connectivity_630_final.parquet",
    n_proc=1,
    force_overwrite=True,
)

df_spike = utl.load_exps([res_dir / "smoke_sugarR.parquet"])
df_rate, _ = utl.get_rate(df_spike, t_run=params["t_run"], n_run=params["n_run"])
df_rate = df_rate.sort_values("smoke_sugarR", ascending=False)

print(f"[2] 총 스파이크 {len(df_spike):,}개, 발화한 뉴런 {len(df_rate):,}개")
mn9 = df_rate["smoke_sugarR"].get(ID_MN9, 0.0)
print(f"    MN9(입 운동 뉴런) 발화율: {float(mn9):.1f} Hz")
print("    발화율 상위 10개 뉴런:")
print(df_rate.head(10).to_string())
