from PIL import Image, ImageDraw, ImageFont
import math, os, subprocess

W, H, FPS, SECONDS = 1080, 1920, 30, 15
OUT_DIR = os.path.dirname(__file__)
FRAMES = os.path.join(OUT_DIR, 'frames')
os.makedirs(FRAMES, exist_ok=True)

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
GOLD = (212, 160, 23)
GOLD_BRIGHT = (255, 215, 0)
WHITE = (244, 240, 231)
MUTED = (157, 151, 140)
BG = (8, 8, 8)
GREEN = (37, 211, 102)


def font(path, size):
    return ImageFont.truetype(path, size)


def centered(draw, text, y, f, fill, spacing=0):
    box = draw.multiline_textbbox((0, 0), text, font=f, spacing=spacing, align='center')
    x = (W - (box[2] - box[0])) // 2
    draw.multiline_text((x, y), text, font=f, fill=fill, spacing=spacing, align='center')


def wrap(text, f, max_width):
    words, lines, line = text.split(), [], ''
    for word in words:
        trial = (line + ' ' + word).strip()
        if ImageDraw.Draw(Image.new('RGB', (1, 1))).textbbox((0, 0), trial, font=f)[2] <= max_width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line: lines.append(line)
    return '\n'.join(lines)


def draw_logo(draw, y, scale=1.0):
    # Compact, original-brand treatment: hexagon + wordmark.
    cx, cy = W // 2, int(y + 62 * scale)
    r = int(44 * scale)
    pts = [(cx, cy-r), (cx+r, cy-r//2), (cx+r, cy+r//2), (cx, cy+r), (cx-r, cy+r//2), (cx-r, cy-r//2)]
    draw.line(pts + [pts[0]], fill=GOLD_BRIGHT, width=max(2, int(3*scale)), joint='curve')
    draw.line([(cx-14*scale, cy-18*scale), (cx-14*scale, cy+18*scale)], fill=GOLD_BRIGHT, width=max(2, int(3*scale)))
    draw.arc((cx-14*scale, cy-18*scale, cx+25*scale, cy+18*scale), 270, 90, fill=GOLD_BRIGHT, width=max(2, int(3*scale)))
    centered(draw, 'DEMITECH', int(y + 122*scale), font(FONT_BOLD, int(42*scale)), GOLD_BRIGHT)
    centered(draw, 'WEB SERVICES', int(y + 174*scale), font(FONT, int(17*scale)), MUTED)


def rounded_panel(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def frame(i):
    t = i / FPS
    img = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)
    # Subtle moving gold glow and grid for brand continuity.
    glow_x = int(W * (0.22 + 0.56 * (0.5 + 0.5 * math.sin(t * 0.55))))
    for r in range(520, 0, -12):
        alpha = max(0, int(26 * (1 - r / 520)))
        col = (8 + alpha, 8 + alpha, 8)
        draw.ellipse((glow_x-r, 300-r, glow_x+r, 300+r), fill=col)
    for x in range(-H, W, 100):
        draw.line((x, 0, x+H, H), fill=(24, 21, 15), width=1)
    for y in range(0, H, 100):
        draw.line((0, y, W, y), fill=(18, 17, 14), width=1)

    if t < 2.5:
        p = min(1, t / 0.45)
        draw_logo(draw, 150 - int((1-p)*30), 1.0)
        centered(draw, 'Your business deserves\na better first impression.', 610, font(FONT_BOLD, 61), WHITE, 8)
        centered(draw, 'Websites, web apps & mobile apps\nbuilt to help you grow.', 850, font(FONT, 32), MUTED, 8)
        draw.line((270, 1055, 810, 1055), fill=GOLD, width=4)
    elif t < 7.0:
        draw_logo(draw, 70, 0.62)
        centered(draw, 'LOOK PROFESSIONAL.', 470, font(FONT_BOLD, 60), WHITE)
        centered(draw, 'LOAD FAST.', 565, font(FONT_BOLD, 60), GOLD_BRIGHT)
        centered(draw, 'CONVERT MORE.', 660, font(FONT_BOLD, 60), WHITE)
        # UI card visual
        rounded_panel(draw, (105, 850, 975, 1425), 28, (17,17,17), (53,47,32), 2)
        draw.rectangle((105, 850, 975, 925), fill=(23,22,19))
        draw.ellipse((140, 880, 160, 900), fill=(80, 72, 52)); draw.ellipse((170, 880, 190, 900), fill=(80, 72, 52)); draw.ellipse((200, 880, 220, 900), fill=(80, 72, 52))
        draw.rectangle((170, 1000, 830, 1046), fill=GOLD)
        draw.rectangle((170, 1090, 670, 1110), fill=(64,60,50))
        draw.rectangle((170, 1140, 770, 1160), fill=(49,47,41))
        draw.rectangle((170, 1225, 420, 1330), fill=(33,31,26), outline=GOLD, width=2)
        draw.rectangle((455, 1225, 705, 1330), fill=(33,31,26), outline=(78,69,49), width=2)
        draw.rectangle((740, 1225, 910, 1330), fill=(33,31,26), outline=(78,69,49), width=2)
        centered(draw, 'Built for South African businesses', 1500, font(FONT, 28), MUTED)
    elif t < 11.8:
        draw_logo(draw, 70, 0.62)
        centered(draw, 'START SMALL.\nGROW SMART.', 470, font(FONT_BOLD, 72), WHITE, 10)
        cards = [('Landing pages', 'From R1,500'), ('Delivery', '7–21 days'), ('Payments', 'Milestones')]
        y = 850
        for idx, (a, b) in enumerate(cards):
            x = 110 + idx*290
            rounded_panel(draw, (x, y, x+250, y+260), 18, (17,17,17), (53,47,32), 2)
            draw.text((x+24, y+40), a, font=font(FONT, 22), fill=MUTED)
            draw.text((x+24, y+125), b, font=font(FONT_BOLD, 30), fill=GOLD_BRIGHT)
        centered(draw, 'Direct access. Transparent pricing.\nNo agency bloat.', 1330, font(FONT, 31), WHITE, 8)
    else:
        draw_logo(draw, 100, 0.7)
        centered(draw, 'READY TO BUILD?', 520, font(FONT_BOLD, 70), WHITE)
        centered(draw, 'Get your free quote today.', 670, font(FONT, 38), GOLD_BRIGHT)
        rounded_panel(draw, (120, 900, 960, 1080), 24, GOLD, None)
        centered(draw, 'WHATSAPP 065 024 1517', 956, font(FONT_BOLD, 39), (8, 8, 8))
        centered(draw, 'No obligation · Reply within 24 hours', 1220, font(FONT, 28), MUTED)
        centered(draw, 'DEMITECH WEB SERVICES', 1650, font(FONT_BOLD, 27), WHITE)
        centered(draw, 'Built Local. Built to Grow.', 1710, font(FONT, 25), GOLD_BRIGHT)
    return img


for i in range(FPS * SECONDS):
    frame(i).save(os.path.join(FRAMES, f'frame_{i:04d}.jpg'), quality=92)

out = os.path.join(OUT_DIR, 'dtws_social_ad_9x16.mp4')
# Light synthetic pulse/chime bed keeps the text-led ad from feeling silent without competing with the copy.
audio = 'aevalsrc=0.07*sin(2*PI*220*t)*(0.45+0.55*sin(2*PI*0.5*t)^2)+0.03*sin(2*PI*440*t):s=44100:d=15'
cmd = [
    'ffmpeg', '-y', '-framerate', str(FPS), '-i', os.path.join(FRAMES, 'frame_%04d.jpg'),
    '-f', 'lavfi', '-i', audio, '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out
]
subprocess.run(cmd, check=True)
print(out)
