import os
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

workspace = os.path.dirname(os.path.abspath(__file__))
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

print("Generating assets for email templates...")

# 1. Рендерим логотип Savencia в прозрачный PNG
def render_logo():
    # Создаем временную страницу для логотипа в цветном варианте
    html_color = """<!DOCTYPE html>
<html>
<head><style>body { margin:0; padding:10px; background: transparent; }</style></head>
<body>
<img src="SAVENCIA_LOGO.svg" style="width: 240px; height: auto; display: block;" />
</body>
</html>"""
    
    # Создаем временную страницу для белого логотипа (для тёмной темы)
    html_white = """<!DOCTYPE html>
<html>
<head><style>
  body { margin:0; padding:10px; background: transparent; }
  .white-filter {
    filter: brightness(0) invert(1);
  }
</style></head>
<body>
<img class="white-filter" src="SAVENCIA_LOGO.svg" style="width: 240px; height: auto; display: block;" />
</body>
</html>"""

    with open(os.path.join(workspace, "temp_logo_c.html"), "w", encoding="utf-8") as f:
        f.write(html_color)
    with open(os.path.join(workspace, "temp_logo_w.html"), "w", encoding="utf-8") as f:
        f.write(html_white)

    with tempfile.TemporaryDirectory() as tmp:
        # Цветной
        out_c = os.path.join(workspace, "logo_color.png")
        cmd_c = [
            chrome, "--headless=new", f"--user-data-dir={tmp}",
            f"--screenshot={out_c}", "--window-size=280,90",
            "--default-background-color=00000000",
            f"file:///{os.path.join(workspace, 'temp_logo_c.html').replace('\\', '/')}"
        ]
        subprocess.run(cmd_c, capture_output=True)
        
        # Белый
        out_w = os.path.join(workspace, "logo_white.png")
        cmd_w = [
            chrome, "--headless=new", f"--user-data-dir={tmp}",
            f"--screenshot={out_w}", "--window-size=280,90",
            "--default-background-color=00000000",
            f"file:///{os.path.join(workspace, 'temp_logo_w.html').replace('\\', '/')}"
        ]
        subprocess.run(cmd_w, capture_output=True)

    # Удаляем временные файлы
    for f in ["temp_logo_c.html", "temp_logo_w.html"]:
        try: os.remove(os.path.join(workspace, f))
        except: pass
        
    print("Logos rendered: logo_color.png and logo_white.png")

# 2. Генерируем стильные изображения-заглушки (аэропорт, взлетная полоса, терминал)
def generate_hero_images():
    # Hero 1: Ночной премиальный рейс / Взлетная полоса в огнях (600x300)
    w, h = 600, 320
    im1 = Image.new("RGB", (w, h), (10, 22, 40))
    d1 = ImageDraw.Draw(im1)
    
    # Градиент неба
    for y in range(h):
        r = int(8 + (y / h) * 12)
        g = int(20 + (y / h) * 35)
        b = int(45 + (y / h) * 45)
        d1.line([(0, y), (w, y)], fill=(r, g, b))
        
    # Горизонт и ВПП
    runway_top_y = 170
    # Линии схождения ВПП
    d1.polygon([(260, runway_top_y), (340, runway_top_y), (480, h), (120, h)], fill=(15, 24, 38))
    
    # Огни ВПП (золотистые и голубые неоновые точки)
    import random
    random.seed(42)
    # Звезды на небе
    for _ in range(80):
        sx = random.randint(10, w - 10)
        sy = random.randint(10, runway_top_y - 20)
        alpha = random.randint(100, 255)
        size = random.choice([1, 1, 1, 2])
        d1.ellipse([sx, sy, sx + size, sy + size], fill=(220, 240, 255))
        
    # Огни взлетной полосы
    steps = 14
    for i in range(steps):
        t = i / steps
        y = int(runway_top_y + (t ** 1.8) * (h - runway_top_y))
        x_left = int(260 - t * 140)
        x_right = int(340 + t * 140)
        rad = max(2, int(t * 5))
        # Золотисто-янтарные огни
        d1.ellipse([x_left - rad, y - rad, x_left + rad, y + rad], fill=(255, 195, 80))
        d1.ellipse([x_right - rad, y - rad, x_right + rad, y + rad], fill=(255, 195, 80))
        # Центральная линия
        if i % 2 == 0:
            cx = 300
            d1.line([(cx, y), (cx, min(h, y + int(t * 12) + 2))], fill=(0, 160, 230), width=max(1, int(t * 3)))

    # Силуэт взлетающего лайнера
    # Центр самолета (300, 110)
    plane_poly = [
        (300, 75),  # нос
        (305, 95), (350, 115), (350, 122), (306, 112), # правое крыло
        (305, 130), (318, 140), (318, 145), (300, 142), # хвост
        (282, 145), (282, 140), (295, 130),
        (294, 112), (250, 122), (250, 115), (295, 95), # левое крыло
    ]
    d1.polygon(plane_poly, fill=(240, 248, 255))
    
    # Навигационные огни на концах крыльев
    d1.ellipse([248, 116, 254, 122], fill=(255, 60, 60)) # красный левый
    d1.ellipse([346, 116, 352, 122], fill=(60, 240, 120)) # зеленый правый
    
    # Надпись на баннере
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 24)
        font_sub = ImageFont.truetype("arial.ttf", 13)
    except:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    d1.text((300, 215), "РЕЙС В НОВЫЙ ГОД 2026", fill=(255, 255, 255), font=font_large, anchor="mm")
    d1.text((300, 245), "МОСКВА • УФА • БЕЛЕБЕЙ", fill=(0, 185, 240), font=font_sub, anchor="mm")
    d1.text((300, 270), "10 ДЕКАБРЯ | GROUPE SAVENCIA", fill=(200, 210, 225), font=font_sub, anchor="mm")
    
    im1.save(os.path.join(workspace, "hero_flight_night.jpg"), quality=90)
    print("Created hero_flight_night.jpg")

    # Hero 2: Светлый архитектурный терминал аэропорта (600x280)
    im2 = Image.new("RGB", (w, 280), (242, 246, 250))
    d2 = ImageDraw.Draw(im2)
    
    # Градиент утреннего/вечернего неба за стеклом терминала
    for y in range(160):
        r = int(210 + (y / 160) * 35)
        g = int(225 + (y / 160) * 25)
        b = int(245 + (y / 160) * 10)
        d2.line([(0, y), (w, y)], fill=(r, g, b))
        
    # Пол терминала (глянцевый, отражающий свет)
    for y in range(160, 280):
        t = (y - 160) / 120
        c = int(235 - t * 25)
        d2.line([(0, y), (w, y)], fill=(c, c + 3, c + 8))

    # Стеклянные балки терминала
    d2.line([(0, 160), (w, 160)], fill=(180, 190, 205), width=2)
    for x in [80, 200, 320, 440, 560]:
        d2.line([(x, 0), (x, 160)], fill=(195, 205, 220), width=3)
        # диагональные фермы
        d2.line([(x, 0), (x + 80, 160)], fill=(215, 222, 235), width=1)
        
    # Самолет на стоянке за окном
    d2.polygon([(380, 115), (490, 115), (480, 130), (370, 130)], fill=(200, 210, 225))
    d2.polygon([(465, 115), (480, 95), (490, 95), (480, 115)], fill=(0, 120, 180)) # синий хвост
    
    # Силуэт стильной новогодней елки в терминале (справа)
    tree_pts = [(520, 90), (535, 125), (528, 125), (542, 160), (534, 160), (550, 200),
                (490, 200), (506, 160), (498, 160), (512, 125), (505, 125)]
    d2.polygon(tree_pts, fill=(35, 85, 60))
    # Гирлянды
    for py in [110, 135, 155, 175, 190]:
        for px in range(500, 545, 10):
            d2.ellipse([px, py, px + 3, py + 3], fill=(255, 210, 60))

    # Текстовый заголовок на светлом постере
    d2.text((50, 60), "НОВОГОДНИЙ ТЕРМИНАЛ", fill=(0, 75, 98), font=font_large)
    d2.text((50, 95), "РЕЙС ОБЪЕДИНЯЕТ 3 ГОРОДА", fill=(0, 143, 208), font=font_large)
    d2.text((50, 135), "10 ДЕКАБРЯ 2026 • SAVENCIA", fill=(222, 106, 9), font=font_sub)
    d2.text((50, 180), "Добро пожаловать в праздничный аэропорт!", fill=(60, 75, 85), font=font_sub)

    im2.save(os.path.join(workspace, "hero_terminal_day.jpg"), quality=90)
    print("Created hero_terminal_day.jpg")

    # 3. Штрихкод для билета
    im_bar = Image.new("RGBA", (320, 60), (255, 255, 255, 0))
    d_bar = ImageDraw.Draw(im_bar)
    x = 10
    bar_pattern = [2,1,3,1,1,2,4,1,2,3,1,2,1,1,3,2,1,4,1,2,2,1,3,1,1,2,3,1,2,1,4,1,2,3,1,1,2,1,3,2,4,1,1,2,3,1,2,1,1,3,2,1,4]
    for w_bar in bar_pattern:
        d_bar.rectangle([x, 5, x + w_bar, 45], fill=(30, 40, 55, 255))
        x += w_bar + random.choice([2, 3, 4])
        if x > 310: break
    d_bar.text((160, 50), "* SV-2026-MOW-UFA-BEL *", fill=(60, 70, 80, 255), font=font_sub, anchor="mm")
    im_bar.save(os.path.join(workspace, "barcode.png"))
    print("Created barcode.png")

if __name__ == "__main__":
    render_logo()
    generate_hero_images()
    print("All assets generated successfully!")
