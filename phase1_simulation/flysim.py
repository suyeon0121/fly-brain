"""Shiu et al. 초파리 뇌 모델을 시드 고정 · 이름 표시와 함께 돌리는 얇은 래퍼.

원본 코드(external/Drosophila_brain_model)는 수정하지 않고, 모델 생성 함수만 가져다 쓴다.
원본 run_exp와 달라진 점:
- trial마다 시드를 고정한다 (seed + trial 번호) → 같은 설정이면 같은 결과
- 실행 설정(버전 · 시드 · 반복 · 자극 세기)을 결과 옆에 JSON으로 남긴다
- 결과 요약에서 자극한 뉴런을 빼고, 알려진 뉴런에 이름을 붙인다
"""
import json
import pickle
import sys
import time
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SHIU = ROOT / "external" / "Drosophila_brain_model"
OUT = ROOT / "outputs" / "phase1"
sys.path.insert(0, str(SHIU))

import brian2 as b2  # noqa: E402
from joblib import Parallel, delayed  # noqa: E402
from model import create_model, default_params, poi, silence  # noqa: E402

b2.prefs.codegen.target = "cython"
b2.prefs.logging.console_log_level = "WARNING"

DATA = {
    "v630": ("2023_03_23_completeness_630_final.csv", "2023_03_23_connectivity_630_final.parquet"),
    "v783": ("Completeness_783.csv", "Connectivity_783.parquet"),
}

# 감각 뉴런 · 운동 뉴런 ID (FlyWire v630, figures.ipynb에서 가져옴)
NEURONS_V630 = {
    "sugar_R": [
        720575940624963786, 720575940630233916, 720575940637568838, 720575940638202345, 720575940617000768,
        720575940630797113, 720575940632889389, 720575940621754367, 720575940621502051, 720575940640649691,
        720575940639332736, 720575940616885538, 720575940639198653, 720575940620900446, 720575940617937543,
        720575940632425919, 720575940633143833, 720575940612670570, 720575940628853239, 720575940629176663,
        720575940611875570,
    ],
    "bitter_R": [
        720575940621778381, 720575940602353632, 720575940617094208, 720575940619197093, 720575940626287336,
        720575940618600651, 720575940627692048, 720575940630195909, 720575940646212996, 720575940610483162,
        720575940645743412, 720575940627578156, 720575940622298631, 720575940621008895, 720575940629146711,
        720575940610259370, 720575940610481370, 720575940619028208, 720575940614281266, 720575940613061118,
        720575940604027168,
    ],
    "water_R": [
        720575940612950568, 720575940631898285, 720575940606002609, 720575940612579053, 720575940622902535,
        720575940616177458, 720575940660292225, 720575940622486922, 720575940613786774, 720575940629852866,
        720575940625861168, 720575940613996959, 720575940617857694, 720575940644965399, 720575940625203504,
        720575940630553415, 720575940635172191, 720575940634796536,
    ],
    "ir94e_R": [
        720575940614211295, 720575940638218173, 720575940628832256, 720575940626016017, 720575940621375231,
        720575940612920386, 720575940614273292, 720575940628198503, 720575940626241636, 720575940619387814,
        720575940624604560, 720575940615274425, 720575940610683315, 720575940627265265, 720575940624079544,
        720575940629211607, 720575940615089369, 720575940631082124,
    ],
}
MN9 = {"MN9_L": 720575940660219265, "MN9_R": 720575940645521262}  # 입(주둥이) 내밀기 운동 뉴런


def neuron_names() -> dict:
    """FlyWire ID → 이름. 감각 뉴런 그룹, MN9, SEZ 세포 유형(sez_neurons.pickle)."""
    names = {}
    with open(SHIU / "sez_neurons.pickle", "rb") as f:
        for cell_type, ids in pickle.load(f).items():
            for i in ids:
                names[i] = cell_type
    for group, ids in NEURONS_V630.items():
        for k, i in enumerate(ids, 1):
            names[i] = f"{group}_{k}"
    names.update({i: n for n, i in MN9.items()})
    return names


def _run_trial(trial, seed, exc, exc2, slnc, path_comp, path_con, params):
    b2.seed(seed + trial)
    neu, syn, spk_mon = create_model(path_comp, path_con, params)
    poi_inp, neu = poi(neu, exc, exc2, params)
    syn = silence(slnc, syn)
    net = b2.Network(neu, syn, spk_mon, *poi_inp)
    net.run(duration=params["t_run"])
    return {k: [float(t) for t in v] for k, v in spk_mon.spike_trains().items() if len(v)}


def run(name, exc, exc2=(), slnc=(), *, version="v630", n_run=30, seed=0, n_proc=4,
        r_poi_hz=150, r_poi2_hz=0, force=False):
    """실험 하나를 돌려 outputs/phase1/<name>.parquet 과 .json 으로 저장한다."""
    OUT.mkdir(parents=True, exist_ok=True)
    path_pq, path_meta = OUT / f"{name}.parquet", OUT / f"{name}.json"
    if path_pq.exists() and not force:
        print(f">>> {name}: 이미 결과가 있어 건너뜀 (force=True로 다시 실행)")
        return path_pq

    comp_file, con_file = DATA[version]
    path_comp, path_con = SHIU / comp_file, SHIU / con_file
    ids = pd.read_csv(path_comp, index_col=0).index
    flyid2i = {f: i for i, f in enumerate(ids)}
    to_idx = lambda xs: [flyid2i[x] for x in xs]  # noqa: E731

    params = dict(default_params)
    params.update(n_run=n_run, r_poi=r_poi_hz * b2.Hz, r_poi2=r_poi2_hz * b2.Hz)

    print(f">>> {name}: {version}, 자극 {len(exc) + len(exc2)}개, 끔 {len(slnc)}개, "
          f"{n_run}회, seed={seed}, 병렬 {n_proc}")
    t0 = time.time()
    res = Parallel(n_jobs=n_proc)(
        delayed(_run_trial)(t, seed, to_idx(exc), to_idx(exc2), to_idx(slnc), path_comp, path_con, params)
        for t in range(n_run)
    )
    wall = time.time() - t0

    rows = [(ids[i], trial, t) for trial, trains in enumerate(res) for i, ts in trains.items() for t in ts]
    df = pd.DataFrame(rows, columns=["flywire_id", "trial", "t"])
    df.to_parquet(path_pq, compression="brotli")
    path_meta.write_text(json.dumps({
        "name": name, "version": version, "n_run": n_run, "seed": seed, "n_proc": n_proc,
        "r_poi_hz": r_poi_hz, "r_poi2_hz": r_poi2_hz, "t_run_s": float(params["t_run"] / b2.second),
        "exc": list(map(int, exc)), "exc2": list(map(int, exc2)), "slnc": list(map(int, slnc)),
        "wall_s": round(wall, 1), "brian2": b2.__version__,
    }, ensure_ascii=False, indent=2))
    print(f"    {wall:.0f}초, 스파이크 {len(df):,}개 → {path_pq.relative_to(ROOT)}")
    return path_pq


def rates(name) -> pd.DataFrame:
    """뉴런별 평균 · 표준편차 발화율(Hz). 스파이크가 없는 trial은 0Hz로 센다."""
    meta = json.loads((OUT / f"{name}.json").read_text())
    df = pd.read_parquet(OUT / f"{name}.parquet")
    counts = df.groupby(["flywire_id", "trial"]).size().unstack(fill_value=0)
    counts = counts.reindex(columns=range(meta["n_run"]), fill_value=0) / meta["t_run_s"]
    out = pd.DataFrame({"rate_hz": counts.mean(axis=1), "std_hz": counts.std(axis=1, ddof=0)})
    return out.sort_values("rate_hz", ascending=False)


def summary(name, top=15) -> str:
    """실험 요약 문자열: MN9, 자극한 뉴런을 뺀 상위 뉴런(이름 포함)."""
    meta = json.loads((OUT / f"{name}.json").read_text())
    r = rates(name)
    names = neuron_names()
    stim = set(meta["exc"]) | set(meta["exc2"])
    lines = [
        f"[{name}] {meta['version']} · {meta['n_run']}회 · seed={meta['seed']} · {meta['wall_s']}초",
        f"  반응한 뉴런 {len(r):,}개 (자극한 뉴런 {len(stim)}개 포함)",
    ]
    for label, i in MN9.items():
        v = r.rate_hz.get(i, 0.0)
        s = r.std_hz.get(i, 0.0)
        lines.append(f"  {label}: {v:.1f} ± {s:.1f} Hz")
    new = r[~r.index.isin(stim)].head(top)
    lines.append(f"  자극한 뉴런을 뺀 발화율 상위 {top}개:")
    for i, row in new.iterrows():
        lines.append(f"    {row.rate_hz:6.1f} Hz  {names.get(i, '-'):<14} {i}")
    return "\n".join(lines)
