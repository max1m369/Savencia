import os
import subprocess

cwd = os.path.dirname(os.path.abspath(__file__))
html_file = os.path.join(cwd, 'render_garland.html')
png_file = os.path.join(cwd, 'hero_v4_garland.png')

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--window-size=540,84",
    "--device-scale-factor=2",
    "--default-background-color=00000000",
    f"--screenshot={png_file}",
    f"file:///{html_file.replace(os.sep, '/')}"
]
print("Running chrome screenshot...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if os.path.exists(png_file):
    print("SUCCESS! File size:", os.path.getsize(png_file), "bytes")
else:
    print("FAILED. Stderr:", res.stderr)
