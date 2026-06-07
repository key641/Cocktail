from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path("output/playwright")
OUT.mkdir(parents=True, exist_ok=True)
W, H = 390, 844
BG = "#fbf8f1"
INK = "#252018"
MUTED = "#716557"
GOLD = "#a58345"
LINE = "#d8c39a"

SERIF = "C:/Windows/Fonts/NotoSerifSC-VF.ttf"
SANS = "C:/Windows/Fonts/Noto Sans SC (TrueType).otf"
SANS_BOLD = "C:/Windows/Fonts/Noto Sans SC Bold (TrueType).otf"


def font(path: str, size: int):
    return ImageFont.truetype(path, size)


serif34 = font(SERIF, 34)
sans12 = font(SANS, 12)
sans13 = font(SANS, 13)
sans14 = font(SANS, 14)
sans16 = font(SANS_BOLD, 16)
sans18 = font(SANS_BOLD, 18)


def rr(d, x0, y0, x1, y1, r, fill, outline=None, width=1):
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=fill, outline=outline, width=width)


def draw_wrapped(d, s, x, y, f, fill, max_chars, line_gap=8):
    lines = []
    current = ""
    for ch in s:
        current += ch
        if len(current) >= max_chars:
            lines.append(current)
            current = ""
    if current:
        lines.append(current)
    for line in lines:
        d.text((x, y), line, font=f, fill=fill)
        y += f.size + line_gap
    return y


def draw_listening_glass(d, cx, cy, scale=1.0):
    d.ellipse([cx - 118 * scale, cy - 110 * scale, cx + 118 * scale, cy + 116 * scale], fill="#f4ead8", outline="#e1d0ad", width=1)
    d.ellipse([cx - 60 * scale, cy + 95 * scale, cx + 60 * scale, cy + 112 * scale], fill="#dfd1bb")
    bowl = [
        (cx - 66 * scale, cy - 72 * scale),
        (cx + 66 * scale, cy - 72 * scale),
        (cx + 42 * scale, cy + 58 * scale),
        (cx + 20 * scale, cy + 82 * scale),
        (cx - 20 * scale, cy + 82 * scale),
        (cx - 42 * scale, cy + 58 * scale),
    ]
    d.polygon(bowl, fill="#fffaf0", outline="#bca270")
    d.ellipse([cx - 66 * scale, cy - 88 * scale, cx + 66 * scale, cy - 56 * scale], outline="#bca270", width=max(1, int(2 * scale)))
    d.pieslice([cx - 52 * scale, cy - 10 * scale, cx + 52 * scale, cy + 34 * scale], 180, 360, fill="#d27a68")
    d.polygon([(cx - 52 * scale, cy + 12 * scale), (cx + 52 * scale, cy + 12 * scale), (cx + 40 * scale, cy + 62 * scale), (cx - 40 * scale, cy + 62 * scale)], fill="#c96f62")
    rr(d, cx - 24 * scale, cy + 8 * scale, cx + 4 * scale, cy + 36 * scale, 6 * scale, "#ffffff88", "#fff8e8")
    rr(d, cx + 12 * scale, cy + 18 * scale, cx + 34 * scale, cy + 40 * scale, 6 * scale, "#ffffff88", "#fff8e8")
    for bx, by, r in [(-34, 42, 3), (-12, 30, 2), (24, 48, 3), (38, 22, 2)]:
        d.ellipse([cx + (bx - r) * scale, cy + (by - r) * scale, cx + (bx + r) * scale, cy + (by + r) * scale], fill="#fff3d1")
    d.polygon([(cx - 7 * scale, cy + 82 * scale), (cx + 7 * scale, cy + 82 * scale), (cx + 16 * scale, cy + 120 * scale), (cx - 16 * scale, cy + 120 * scale)], fill="#fffaf0", outline="#bca270")
    d.ellipse([cx - 42 * scale, cy + 114 * scale, cx + 42 * scale, cy + 132 * scale], fill="#fffaf0", outline="#bca270")


def draw_cocktail_visual(d, cx, cy):
    d.ellipse([cx - 68, cy + 140, cx + 68, cy + 164], fill="#e4d8c3")
    d.polygon([(cx - 46, cy - 72), (cx + 46, cy - 72), (cx + 34, cy + 142), (cx - 34, cy + 142)], fill="#fffaf2", outline="#867963")
    d.rectangle([cx - 36, cy + 0, cx + 36, cy + 138], fill="#d9f3c7")
    for x, y in [(-22, 24), (10, 48), (-4, 76)]:
        rr(d, cx + x, cy + y, cx + x + 28, cy + y + 28, 6, "#ffffff99", "#ffffff")
    d.line([cx + 32, cy - 86, cx + 14, cy + 120], fill="#9f6d56", width=5)
    d.line([cx + 32, cy - 86, cx + 52, cy - 98], fill="#9f6d56", width=5)
    for bx, by, r in [(-16, 118, 3), (8, 96, 2), (20, 70, 3), (-4, 52, 2), (16, 32, 2)]:
        d.ellipse([cx + bx - r, cy + by - r, cx + bx + r, cy + by + r], fill="#ffffffcc")
    d.line([cx - 52, cy - 84, cx - 42, cy - 32], fill="#6d8f62", width=2)
    d.ellipse([cx - 70, cy - 76, cx - 50, cy - 48], fill="#7fa66d")
    d.ellipse([cx - 48, cy - 84, cx - 28, cy - 56], fill="#7fa66d")
    d.pieslice([cx + 32, cy - 76, cx + 82, cy - 26], 200, 320, fill="#dce783", outline="#93a449")
    d.line([cx - 46, cy - 72, cx + 46, cy - 72, cx + 34, cy + 142, cx - 34, cy + 142, cx - 46, cy - 72], fill="#6b5f4f", width=2)
    d.line([cx - 26, cy - 50, cx - 28, cy + 120], fill="#ffffffdd", width=3)


def home():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im, "RGBA")
    d.ellipse([-90, -120, 260, 210], fill="#efe0bd66")
    d.text((22, 22), "Nightcap Lab", font=sans12, fill=GOLD)
    d.text((300, 22), "12 classics", font=sans12, fill=GOLD)
    draw_listening_glass(d, 195, 210, 0.95)
    rr(d, 224, 292, 366, 355, 18, "#fffdf8cc", LINE)
    d.text((238, 305), "AI 酒保", font=sans12, fill=GOLD)
    draw_wrapped(d, "我会听你的口味、心情和手边材料。", 238, 326, sans12, MUTED, 12, 4)
    d.text((22, 414), "给今晚一点仪式感", font=sans12, fill=GOLD)
    draw_wrapped(d, "不知道喝什么，就从一杯刚好适合你的开始", 22, 440, serif34, INK, 10, 6)
    draw_wrapped(d, "用心情探索，或者把家里现有材料告诉我。少买一点，少纠结一点，把酒调得更漂亮一点。", 22, 568, sans14, MUTED, 18, 7)
    rr(d, 22, 672, 368, 744, 18, "#e7ca86", "#b89045")
    d.text((42, 690), "探索今晚喝什么", font=sans18, fill=INK)
    d.text((42, 718), "心情、口味、强度", font=sans12, fill="#5a4522")
    rr(d, 22, 756, 368, 828, 18, "#fffdf8dd", LINE)
    d.text((42, 774), "用现有材料调酒", font=sans18, fill=INK)
    d.text((42, 802), "最大化利用库存", font=sans12, fill=MUTED)
    im.save(OUT / "cocktail-home-mobile-preview.png")


def result():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im, "RGBA")
    d.ellipse([-80, -120, 260, 210], fill="#efe0bd66")
    rr(d, 22, 20, 90, 56, 18, "#fffdf8dd", LINE)
    d.text((43, 31), "回首页", font=sans12, fill=INK)
    d.text((22, 88), "今晚的酒单", font=sans12, fill=GOLD)
    d.text((22, 114), "莫吉托", font=serif34, fill=INK)
    d.text((22, 158), "Mojito · 轻盈 · 高球杯", font=sans14, fill=MUTED)
    rr(d, 22, 190, 368, 478, 20, "#fffdf8dd", LINE)
    draw_cocktail_visual(d, 195, 292)
    for i, t in enumerate(["薄荷", "清爽", "低负担"]):
        x = 70 + i * 82
        rr(d, x, 444, x + 62, 474, 15, "#faf6ec", None)
        d.text((x + 16, 452), t, font=sans12, fill=GOLD)
    rr(d, 22, 500, 368, 590, 20, "#fffdf8dd", LINE)
    d.text((42, 518), "为什么是这杯", font=sans16, fill=INK)
    draw_wrapped(d, "这杯的薄荷、清爽、低负担气质适合现在的状态，尤其贴合你选择的清爽方向。", 42, 546, sans13, MUTED, 22, 5)
    rr(d, 22, 606, 368, 688, 20, "#f5e8c9", LINE)
    d.text((42, 624), "线上酒保提示", font=sans16, fill=INK)
    draw_wrapped(d, "薄荷只要轻压出香气，不要捣碎，否则会有草腥味。", 42, 652, sans13, MUTED, 22, 5)
    rr(d, 22, 706, 368, 828, 20, "#fffdf8dd", LINE)
    d.text((42, 724), "配方", font=sans12, fill=GOLD)
    rows = [("白朗姆", "45 ml"), ("青柠汁", "25 ml"), ("单糖浆", "15 ml"), ("薄荷叶", "8 片")]
    y = 750
    for a, b in rows:
        d.text((42, y), a, font=sans13, fill=INK)
        d.text((300, y), b, font=sans13, fill=GOLD)
        y += 22
    im.save(OUT / "cocktail-result-mobile-preview.png")


home()
result()
print(OUT / "cocktail-home-mobile-preview.png")
print(OUT / "cocktail-result-mobile-preview.png")
