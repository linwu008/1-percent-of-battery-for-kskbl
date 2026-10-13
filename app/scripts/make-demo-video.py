#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 Playwright 录的 webm 转成可提交的演示 mp4：底部字幕栏 + 片尾卡。

用法（在 app/ 目录下先跑录屏，再跑本脚本）：
    RECORD_DEMO=1 npm run test:browser -- tests/demo.spec.ts
    python scripts/make-demo-video.py

依赖 ffmpeg。优先读 FFMPEG 环境变量，其次找系统 PATH，
最后回落到 imageio-ffmpeg 自带的二进制（pip install imageio-ffmpeg）。

字幕的时间点取自 tests/demo.spec.ts 录制时写出的 assets/demo-cues.json——
不要改成硬编码的时间轴：各阶段耗时是被页面状态牵着走的（等打字机真的打完才推进），
硬编码一定对不上。
"""
import glob
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # app/
PROJ = ROOT.parent
ASSETS = PROJ / "assets"
WORK = ROOT / ".demo-work"
OUT = ASSETS / "1pct-battery-v1.0.0-demo.mp4"

W, H = 1440, 900
BAR = 88  # 底部字幕栏高度，画面不压缩，字幕画在留出的黑边上
BG = "0x0B120F"

FONTS = [r"C:\Windows\Fonts\msyh.ttc", "/System/Library/Fonts/PingFang.ttc",
         "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"]
FONTS_B = [r"C:\Windows\Fonts\msyhbd.ttc", "/System/Library/Fonts/PingFang.ttc",
           "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"]

# 阶段字幕：(起, 止, 文字)。起止取自 assets/demo-cues.json，文字做了压缩与拆分。
SUBS = [
    (2.3, 9.4, "1% Battery · 灾后资源决策模拟"),
    (9.4, 17.3, "同一个起点，你和 Ghost 各做各的选择"),
    (17.3, 35.8, "开局先讲清楚：你在哪、伤到哪、手里有什么"),
    (35.8, 50.3, "三种策略，先选一种行为倾向"),
    (50.3, 72.0, "每一步推进 25–35 分钟，电量被消耗的同时也在自然流失"),
    (72.0, 118.5, "电量、时间与成果，每一步都当场结算"),
    (118.6, 124.9, "结算：你和 Ghost 的模拟存活概率"),
    (124.9, 140.8, "每一步，你和最优可能的距离"),
    (140.8, 168.3, "权重在结算才揭晓：动作档位 × 题目权重"),
]

ENDRARD_LINES = [
    ("在线试玩", "one-percent-battery-v07.app.workbuddy.host"),
    ("源码仓库", "github.com/linwu008/1-percent-of-battery-for-kskbl"),
]

log_lines = []


def log(s):
    log_lines.append(str(s))
    print(s)


def find_ffmpeg():
    ff = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if ff:
        return ff
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit("找不到 ffmpeg：设 FFMPEG 环境变量，或 pip install imageio-ffmpeg")


def find_font(cands):
    for c in cands:
        if Path(c).exists():
            return c
    sys.exit("找不到中文字体，请在 FONTS 里补上本机路径")


def esc(text):
    """drawtext 的文本转义：反斜杠、单引号、冒号。"""
    return text.replace("\\", "\\\\").replace("'", r"\'").replace(":", r"\:")


def build_filter(font):
    parts = [f"pad={W}:{H + BAR}:0:0:color={BG}"]
    parts.append(f"drawbox=x=0:y={H}:w={W}:h=1:color=0x24463A@1:t=fill")
    path = font.replace("\\", "/").replace(":", r"\:")
    for start, end, text in SUBS:
        parts.append(
            f"drawtext=fontfile='{path}':text='{esc(text)}':expansion=none"
            f":x=(w-text_w)/2:y={H + 29}:fontsize=31:fontcolor=0xE4F5EC"
            f":enable='between(t,{start},{end})'"
        )
    return ",".join(parts)


def make_endcard(path, font, font_b):
    from PIL import Image, ImageDraw, ImageFont

    w, h = W, H + BAR
    img = Image.new("RGB", (w, h), (11, 18, 15))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 3], fill=(99, 230, 176))

    f1 = ImageFont.truetype(font_b, 68)
    f2 = ImageFont.truetype(font, 33)
    f3 = ImageFont.truetype(font, 28)
    f4 = ImageFont.truetype(font, 22)

    def center(text, fnt, y, fill):
        d.text(((w - d.textlength(text, font=fnt)) / 2, y), text, font=fnt, fill=fill)

    center("1% Battery · 最后的余量", f1, 290, (234, 246, 240))
    center("灾后资源决策模拟器 · v1.0.0", f2, 398, (99, 230, 176))
    for i, (k, v) in enumerate(ENDRARD_LINES):
        center(f"{k}    {v}", f3, 512 + i * 54, (198, 220, 209))
    center("模拟能耗与概率 · 非真实救援设备或救援工具", f4, 905, (116, 142, 130))
    img.save(path)


def main():
    ff = find_ffmpeg()
    font = find_font(FONTS)
    font_b = find_font(FONTS_B)
    log(f"ffmpeg: {ff}")

    found = []
    if (WORK / "source.webm").exists():
        found.append(WORK / "source.webm")
    found += [Path(p) for p in glob.glob(str(ROOT / "test-results" / "*" / "video.webm"))]
    if not found:
        sys.exit(
            "找不到录屏。先录，再把源文件存到 app/.demo-work/source.webm：\n"
            "  RECORD_DEMO=1 npm run test:browser -- tests/demo.spec.ts\n"
            "  （Playwright 默认只保留失败产物，跑完整测试会把 test-results 清掉，"
            "录完请立刻复制出来）"
        )
    src = found[0]
    log(f"源视频: {src}")

    WORK.mkdir(exist_ok=True)
    endcard = WORK / "endcard.png"
    make_endcard(str(endcard), font, font_b)

    graph = (
        f"[0:v]{build_filter(font)}[v0];"
        f"[1:v]fps=25,format=yuv420p[v1];"
        f"[v0][v1]concat=n=2:v=1:a=0[out]"
    )
    graphfile = WORK / "graph.txt"
    graphfile.write_text(graph, encoding="utf-8")

    if OUT.exists():
        OUT.unlink()

    r = subprocess.run(
        [ff, "-y", "-hide_banner", "-loglevel", "error",
         "-i", src,
         "-loop", "1", "-t", "6", "-i", str(endcard),
         "-filter_complex_script", str(graphfile),
         "-map", "[out]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-r", "25", "-an", "-movflags", "+faststart",
         str(OUT)],
        capture_output=True, timeout=2400,
    )
    if r.returncode != 0:
        log(r.stderr.decode("utf-8", "replace")[-4000:])
        sys.exit(f"转码失败 rc={r.returncode}")

    info = subprocess.run([ff, "-hide_banner", "-i", str(OUT)],
                          capture_output=True).stderr.decode("utf-8", "replace")
    for line in info.splitlines():
        if "Duration" in line or "Stream #0:0" in line:
            log(line.strip())
    log(f"产物: {OUT}  {OUT.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    if (sys.stdout.encoding or "").lower() not in ("utf-8", "utf8"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    main()
