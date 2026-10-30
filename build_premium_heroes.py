import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1120, 460

def create_technical_blueprint():
    # Base image - Deep Savencia Dark Navy
    img = Image.new("RGBA", (W, H), (0, 30, 43, 255))
    draw = ImageDraw.Draw(img)

    # 1. Subtle CAD engineering grid
    grid_size = 28
    for x in range(0, W, grid_size):
        draw.line([(x, 0), (x, H)], fill=(0, 55, 75, 120), width=1)
    for y in range(0, H, grid_size):
        draw.line([(0, y), (W, y)], fill=(0, 55, 75, 120), width=1)
    
    # Major grid lines every 4 units
    for x in range(0, W, grid_size * 4):
        draw.line([(x, 0), (x, H)], fill=(0, 80, 110, 160), width=1)
    for y in range(0, H, grid_size * 4):
        draw.line([(0, y), (W, y)], fill=(0, 80, 110, 160), width=1)

    # 2. Corner crosshairs and technical borders
    margin = 32
    draw.rectangle([(margin, margin), (W - margin, H - margin)], outline=(0, 143, 208, 140), width=1)
    
    # Corner brackets
    bracket_len = 16
    for cx, cy in [(margin, margin), (W - margin, margin), (margin, H - margin), (W - margin, H - margin)]:
        dx = 1 if cx == margin else -1
        dy = 1 if cy == margin else -1
        draw.line([(cx, cy), (cx + dx * bracket_len, cy)], fill=(222, 106, 9, 255), width=2)
        draw.line([(cx, cy), (cx, cy + dy * bracket_len)], fill=(222, 106, 9, 255), width=2)

    # 3. Radar / Navigation rings on the right center
    rcx, rcy = W - 320, H // 2
    for r in [60, 120, 180, 240]:
        draw.ellipse([(rcx - r, rcy - r), (rcx + r, rcy + r)], outline=(0, 143, 208, 70), width=1)
    
    # Range ring dashed
    for angle in range(0, 360, 15):
        rad = math.radians(angle)
        x1 = rcx + int(150 * math.cos(rad))
        y1 = rcy + int(150 * math.sin(rad))
        x2 = rcx + int(158 * math.cos(rad))
        y2 = rcy + int(158 * math.sin(rad))
        draw.line([(x1, y1), (x2, y2)], fill=(27, 187, 233, 160), width=1)

    # Crosshair through radar center
    draw.line([(rcx - 260, rcy), (rcx + 260, rcy)], fill=(0, 143, 208, 90), width=1)
    draw.line([(rcx, rcy - 200), (rcx, rcy + 200)], fill=(0, 143, 208, 90), width=1)

    # 4. Flight Vector line (MOW -> UFA -> BEL -> NEW YEAR)
    pts = [
        (margin + 60, H // 2 + 70, "MOW [55.75°N]", "MOSCOW // DEP 17:00"),
        (margin + 260, H // 2 + 10, "UFA [54.73°N]", "UFA // DEP 17:00"),
        (margin + 440, H // 2 + 80, "BEL [54.10°N]", "BELEBEY // DEP 15:00"),
        (W - 200, H // 2 - 60, "DEST // 2026", "NEW YEAR // ARRIVAL")
    ]
    
    poly_pts = [(p[0], p[1]) for p in pts]
    for i in range(len(poly_pts) - 1):
        x1, y1 = poly_pts[i]
        x2, y2 = poly_pts[i+1]
        draw.line([(x1, y1), (x2, y2)], fill=(222, 106, 9, 220), width=2)
        mx, my = (x1 + x2) // 2, (y1 + y2) // 2
        draw.ellipse([(mx - 3, my - 3), (mx + 3, my + 3)], fill=(255, 255, 255, 255))

    for px, py, code, detail in pts:
        draw.ellipse([(px - 10, py - 10), (px + 10, py + 10)], outline=(222, 106, 9, 255), width=2)
        draw.ellipse([(px - 4, py - 4), (px + 4, py + 4)], fill=(255, 255, 255, 255))
        draw.text((px - 30, py + 16), code, fill=(255, 255, 255, 240))
        draw.text((px - 30, py + 30), detail, fill=(27, 187, 233, 200))

    # 5. Aircraft Wireframe Schematic (Isometric / Top technical projection)
    acx, acy = W // 2 + 100, H // 2 - 40
    draw.line([(acx - 140, acy), (acx + 120, acy)], fill=(255, 255, 255, 180), width=1)
    
    nose = (acx + 130, acy)
    cockpit_top = (acx + 90, acy - 12)
    cockpit_bot = (acx + 90, acy + 12)
    body_top_mid = (acx + 20, acy - 15)
    body_bot_mid = (acx + 20, acy + 15)
    
    wing_top_root = (acx + 30, acy - 15)
    wing_top_tip = (acx - 60, acy - 140)
    wing_top_trail = (acx - 80, acy - 15)
    
    wing_bot_root = (acx + 30, acy + 15)
    wing_bot_tip = (acx - 60, acy + 140)
    wing_bot_trail = (acx - 80, acy + 15)
    
    tail_cone = (acx - 130, acy)
    stabilizer_top = (acx - 140, acy - 50)
    stabilizer_bot = (acx - 140, acy + 50)
    
    plane_lines = [
        (nose, cockpit_top), (cockpit_top, body_top_mid), (body_top_mid, (acx - 110, acy - 10)), ((acx - 110, acy - 10), tail_cone),
        (nose, cockpit_bot), (cockpit_bot, body_bot_mid), (body_bot_mid, (acx - 110, acy + 10)), ((acx - 110, acy + 10), tail_cone),
        (wing_top_root, wing_top_tip), (wing_top_tip, wing_top_trail),
        (wing_bot_root, wing_bot_tip), (wing_bot_tip, wing_bot_trail),
        (wing_top_tip, (wing_top_tip[0] - 8, wing_top_tip[1] - 15)),
        (wing_bot_tip, (wing_bot_tip[0] - 8, wing_bot_tip[1] + 15)),
        ((acx - 10, acy - 55), (acx + 25, acy - 55)),
        ((acx - 10, acy + 55), (acx + 25, acy + 55)),
        ((acx - 100, acy), stabilizer_top), (stabilizer_top, (acx - 135, acy - 6)),
        ((acx - 100, acy), stabilizer_bot), (stabilizer_bot, (acx - 135, acy + 6))
    ]
    for p1, p2 in plane_lines:
        draw.line([p1, p2], fill=(255, 255, 255, 240), width=2)

    for t in [0.25, 0.5, 0.75]:
        wx = wing_top_root[0] * (1-t) + wing_top_tip[0] * t
        wy = wing_top_root[1] * (1-t) + wing_top_tip[1] * t
        draw.line([(wx, wy), (wx - 15, wy + 25)], fill=(0, 143, 208, 140), width=1)
        
        bx = wing_bot_root[0] * (1-t) + wing_bot_tip[0] * t
        by = wing_bot_root[1] * (1-t) + wing_bot_tip[1] * t
        draw.line([(bx, by), (bx - 15, by - 25)], fill=(0, 143, 208, 140), width=1)

    # 6. Technical Telemetry Labels & HUD
    draw.text((margin + 16, margin + 14), "GROUPE SAVENCIA // AERONAUTICAL DISPATCH DIAGRAM", fill=(222, 106, 9, 255))
    draw.text((margin + 16, margin + 30), "FLIGHT: SV-2026 | SECTOR: MOW-UFA-BEL | AIRFRAME: A350-SAV | CLASS: ALL-TEAM", fill=(148, 163, 184, 255))
    
    draw.text((W - 320, margin + 14), "STATUS: CLEAR FOR TAKEOFF", fill=(52, 211, 153, 255))
    draw.text((W - 320, margin + 30), "CRUISE: FL380 | MACH: 0.82 | HDG: 092°", fill=(148, 163, 184, 255))

    # Bottom scale bar
    bx = margin + 16
    by = H - margin - 24
    draw.line([(bx, by), (bx + 200, by)], fill=(255, 255, 255, 200), width=1)
    for sx in [0, 50, 100, 150, 200]:
        draw.line([(bx + sx, by - 5), (bx + sx, by + 5)], fill=(255, 255, 255, 200), width=1)
    draw.text((bx, by - 16), "0 km              500 km            1000 km", fill=(148, 163, 184, 220))
    draw.text((bx + 230, by - 8), "PRECISION FLIGHT VECTOR // SCALE 1:2500000", fill=(0, 143, 208, 220))

    img = img.convert("RGB")
    img.save("hero_technical_blueprint.png", "PNG", optimize=True)
    print("hero_technical_blueprint.png generated successfully!")


def create_atmospheric_terminal_3d():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # 1. Sky & Horizon Gradient outside the glass (Blue hour into warm dusk)
    horizon_y = int(H * 0.62)
    for y in range(horizon_y):
        ratio = y / horizon_y
        if ratio < 0.6:
            r = int(5 * (1 - ratio/0.6) + 12 * (ratio/0.6))
            g = int(20 * (1 - ratio/0.6) + 45 * (ratio/0.6))
            b = int(45 * (1 - ratio/0.6) + 85 * (ratio/0.6))
        else:
            sub = (ratio - 0.6) / 0.4
            r = int(12 * (1 - sub) + 75 * sub)
            g = int(45 * (1 - sub) + 75 * sub)
            b = int(85 * (1 - sub) + 80 * sub)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # 2. Tarmac / Apron outside
    for y in range(horizon_y, H):
        sub = (y - horizon_y) / (H - horizon_y)
        r = int(15 + 10 * sub)
        g = int(22 + 12 * sub)
        b = int(32 + 15 * sub)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # 3. Distant Runway / Taxiway lights
    vanish_x = int(W * 0.38)
    vanish_y = horizon_y - 8
    
    draw.polygon([(vanish_x - 12, vanish_y), (vanish_x + 12, vanish_y),
                  (vanish_x + 140, H), (vanish_x - 140, H)],
                 fill=(22, 32, 45, 180))

    # Centerline glowing dashes
    num_dashes = 18
    for i in range(num_dashes):
        t = (i / num_dashes) ** 1.8
        dy = int(vanish_y + t * (H - vanish_y))
        dw = max(2, int(t * 8))
        dh = max(2, int(t * 14))
        draw.rectangle([(vanish_x - dw//2, dy), (vanish_x + dw//2, dy + dh)], fill=(222, 106, 9, 230))
        draw.ellipse([(vanish_x - dw*2, dy - dh), (vanish_x + dw*2, dy + dh*2)], fill=(244, 184, 96, 60))

    # Blue edge taxiway lights
    for i in range(12):
        t = (i / 12) ** 1.7
        dy = int(vanish_y + t * (H - vanish_y))
        lx = int(vanish_x - 12 - t * 130)
        draw.ellipse([(lx - 2, dy - 2), (lx + 2, dy + 2)], fill=(56, 189, 248, 255))
        draw.ellipse([(lx - 6, dy - 6), (lx + 6, dy + 6)], fill=(56, 189, 248, 70))
        rx = int(vanish_x + 12 + t * 130)
        draw.ellipse([(rx - 2, dy - 2), (rx + 2, dy + 2)], fill=(56, 189, 248, 255))
        draw.ellipse([(rx - 6, dy - 6), (rx + 6, dy + 6)], fill=(56, 189, 248, 70))

    # 4. Silhouetted Commercial Jet on Apron
    px = int(W * 0.72)
    py = horizon_y + 10
    scale = 0.85
    jet_poly = [
        (px - 160*scale, py - 4*scale),
        (px - 90*scale, py - 8*scale),
        (px - 40*scale, py - 18*scale),
        (px - 10*scale, py - 60*scale),
        (px + 10*scale, py - 5*scale),
        (px + 120*scale, py - 6*scale),
        (px + 110*scale, py + 8*scale),
        (px - 150*scale, py + 8*scale)
    ]
    draw.polygon(jet_poly, fill=(10, 16, 24, 240))
    draw.polygon([(px - 20*scale, py + 2*scale), (px + 60*scale, py + 48*scale),
                  (px + 20*scale, py + 52*scale), (px - 60*scale, py + 6*scale)],
                 fill=(8, 12, 18, 255))
    draw.ellipse([(px - 10*scale - 2, py - 60*scale - 2), (px - 10*scale + 2, py - 60*scale + 2)], fill=(239, 68, 68, 255))
    draw.ellipse([(px + 60*scale - 2, py + 48*scale - 2), (px + 60*scale + 2, py + 48*scale + 2)], fill=(34, 197, 94, 255))

    # 5. Modern Glass Architecture: Terminal Floor-to-Ceiling Windows
    mullion_x = [120, 310, 520, 750, 960]
    for mx in mullion_x:
        draw.polygon([(mx - 6, 0), (mx + 6, 0), (mx - 18, H), (mx - 6, H)], fill=(18, 28, 40, 255))
        draw.line([(mx + 6, 0), (mx - 6, H)], fill=(50, 70, 95, 180), width=1)
        draw.line([(mx + 8, 0), (mx - 4, H)], fill=(255, 255, 255, 40), width=1)

    for ty in [int(H * 0.28), int(H * 0.7)]:
        draw.rectangle([(0, ty - 4), (W, ty + 4)], fill=(18, 28, 40, 240))
        draw.line([(0, ty - 4), (W, ty - 4)], fill=(50, 70, 95, 160), width=1)

    # 6. Polished Terrazzo Interior Floor
    floor_y = int(H * 0.7)
    floor_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    f_draw = ImageDraw.Draw(floor_overlay)
    
    for y in range(floor_y, H):
        opacity = int(140 + 90 * ((y - floor_y) / (H - floor_y)))
        f_draw.line([(0, y), (W, y)], fill=(8, 16, 26, opacity))
    
    for mx in mullion_x:
        f_draw.line([(mx - 10, floor_y), (mx - 20, H)], fill=(222, 106, 9, 35), width=8)

    img = Image.alpha_composite(img, floor_overlay)
    draw = ImageDraw.Draw(img)

    # 7. Interior Ambient Architectural Glow & Subtle Festive Bokeh
    bokeh_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bokeh_layer)
    
    random.seed(2026)
    for _ in range(35):
        bx = random.randint(40, W - 40)
        by = random.randint(15, int(H * 0.45))
        br = random.randint(6, 22)
        color = random.choice([
            (244, 184, 96, random.randint(40, 110)),
            (222, 106, 9, random.randint(30, 80)),
            (255, 255, 255, random.randint(50, 120)),
            (56, 189, 248, random.randint(25, 70))
        ])
        b_draw.ellipse([(bx - br, by - br), (bx + br, by + br)], fill=color)

    bokeh_layer = bokeh_layer.filter(ImageFilter.GaussianBlur(radius=3))
    img = Image.alpha_composite(img, bokeh_layer)
    draw = ImageDraw.Draw(img)

    # 8. Terminal Glass Overlay Vignette & Typography Badge
    draw.rectangle([(0, 0), (W, 4)], fill=(222, 106, 9, 255))
    
    draw.text((40, 24), "TERMINAL HUB // SKY LOUNGE 2026", fill=(255, 255, 255, 240))
    draw.text((40, 42), "SAVENCIA NEW YEAR SPECIAL DEPARTURES", fill=(244, 184, 96, 200))

    draw.text((W - 320, 24), "GATES: MOW · UFA · BEL", fill=(56, 189, 248, 230))
    draw.text((W - 320, 42), "STATUS: BOARDING CALL", fill=(52, 211, 153, 230))

    img = img.convert("RGB")
    img.save("hero_terminal_3d.jpg", "JPEG", quality=92, optimize=True)
    print("hero_terminal_3d.jpg generated successfully!")

if __name__ == "__main__":
    create_technical_blueprint()
    create_atmospheric_terminal_3d()
