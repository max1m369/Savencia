import subprocess
import tempfile
import shutil
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
workspace = r"g:\ПРОФИ\Елена Котсерова - Сцена\СИМА"
brain = r"C:\Users\desig\.gemini\antigravity\brain\76be1657-1fcf-4d1c-a641-5ed8b432f4da"
ws_url = "file:///" + workspace.replace("\\", "/")

with open(os.path.join(workspace, 'emulator.html'), 'r', encoding='utf-8') as f:
    em_base = f.read()

with tempfile.TemporaryDirectory() as tmp:
    # 1. Capture full email scrolls for all variants 1..8
    variants = [(f'v{i}_full.png', f'variant{i}.html') for i in range(1, 9)]
    for vname, vfile in variants:
        out_path = os.path.join(workspace, vname)
        cmd = [
            chrome, "--headless=new", f"--user-data-dir={tmp}",
            f"--screenshot={out_path}", "--window-size=650,2300",
            f"{ws_url}/{vfile}"
        ]
        subprocess.run(cmd, capture_output=True)
        print(f"Captured {vname}")

    # 2. Capture dual-screen emulator for variants 1..8
    for num in [str(i) for i in range(1, 9)]:
        vfile = f'variant{num}.html'
        out_name = f'variant{num}_emulator.png'
        out_path = os.path.join(workspace, out_name)
        
        # Modify active button and iframe src in emulator
        mod = em_base.replace("let currentVariant = 'variant8.html';", f"let currentVariant = '{vfile}';")
        mod = mod.replace('src="variant8.html"', f'src="{vfile}"')
        
        tmp_em_name = f'_temp_em_{num}.html'
        tmp_em_path = os.path.join(workspace, tmp_em_name)
        with open(tmp_em_path, 'w', encoding='utf-8') as f:
            f.write(mod)

        tmp_url = f"{ws_url}/{tmp_em_name}"
        subprocess.run([
            chrome, "--headless=new", f"--user-data-dir={tmp}",
            f"--screenshot={out_path}", "--window-size=1550,1050",
            tmp_url
        ], capture_output=True)

        if os.path.exists(tmp_em_path):
            os.remove(tmp_em_path)
        print(f"Captured {out_name}")

# Copy all screenshots and assets to brain directory
all_files = [f"v{i}_full.png" for i in range(1, 9)] + [f"variant{i}_emulator.png" for i in range(1, 9)] + [
    "f-window.svg", "f-window.png", "g-poster.svg", "g-poster.png", "g-logo.png",
    "icon_moscow.png", "icon_ufa.png", "icon_belebey.png", "hero_festive_runway.jpg", "hero_v1_festive.jpg", "barcode.png"
]
for fname in all_files:
    src = os.path.join(workspace, fname)
    if os.path.exists(src):
        shutil.copy(src, os.path.join(brain, fname))

print("All screenshots successfully captured and synced to brain!")
