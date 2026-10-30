"""Phase 1 스모크 테스트: 오른쪽 단맛 뉴런 21개를 자극하고 MN9 반응을 본다.

실행:
    make smoke            # 1회, seed=0
    make repro            # 같은 시드로 두 번 돌려 결과가 같은지 확인
    uv run python phase1_simulation/smoke_test.py --n-run 1 --seed 0 [--check]
"""
import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flysim  # noqa: E402

p = argparse.ArgumentParser()
p.add_argument("--n-run", type=int, default=1)
p.add_argument("--seed", type=int, default=0)
p.add_argument("--n-proc", type=int, default=1)
p.add_argument("--check", action="store_true", help="같은 시드로 두 번 돌려 결과가 같은지 확인")
a = p.parse_args()

sugar = flysim.NEURONS_V630["sugar_R"]
kw = dict(n_run=a.n_run, seed=a.seed, n_proc=a.n_proc, force=True)

flysim.run("smoke_sugarR", sugar, **kw)
print(flysim.summary("smoke_sugarR"))

if a.check:
    flysim.run("smoke_sugarR_again", sugar, **kw)
    d1 = pd.read_parquet(flysim.OUT / "smoke_sugarR.parquet")
    d2 = pd.read_parquet(flysim.OUT / "smoke_sugarR_again.parquet")
    same = d1.sort_values(list(d1.columns)).reset_index(drop=True).equals(
        d2.sort_values(list(d2.columns)).reset_index(drop=True))
    print(f"\n[재현성] 같은 시드 두 번: 스파이크 {len(d1):,}개 vs {len(d2):,}개 → {'완전히 같음 ✅' if same else '다름 ❌'}")
    sys.exit(0 if same else 1)
