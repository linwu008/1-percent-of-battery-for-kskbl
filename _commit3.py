import subprocess, os

cwd = r"C:\Users\DELL\WorkBuddy\2026-10-12-20-14-08\proj\1-percent-of-battery-for-kskbl-main"
log = []

def run(args, port="7890", timeout=600):
    env = dict(os.environ)
    for k in ["HTTP_PROXY","HTTPS_PROXY","http_proxy","https_proxy","ALL_PROXY","all_proxy"]:
        env.pop(k, None)
    if port != "none":
        env["HTTP_PROXY"] = f"http://127.0.0.1:{port}"
        env["HTTPS_PROXY"] = f"http://127.0.0.1:{port}"
    r = subprocess.run(["git"] + args, cwd=cwd, env=env, capture_output=True, timeout=timeout)
    return r.returncode, (r.stdout.decode("utf-8","replace") + r.stderr.decode("utf-8","replace"))[:1200]

msg = "docs: 补 v0.3.0 上线链接与仓库/发布记录"
for a in [["add", "-A"],
          ["commit", "-m", msg],
          ["push", "origin", "v0.3.0"],
          ["log", "--oneline", "-3"]]:
    rc, txt = run(a)
    log.append(f"[{' '.join(a[:2])}] rc={rc}\n{txt}")

open(os.path.join(cwd, "_commit3.txt"), "w", encoding="utf-8").write("\n".join(log))
print("done")
