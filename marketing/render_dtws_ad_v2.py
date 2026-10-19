from PIL import Image, ImageDraw, ImageFont
import math, os, subprocess

W, H, FPS, DURATION = 1080, 1920, 30, 12
ROOT = os.path.dirname(__file__)
FRAME_DIR = os.path.join(ROOT, 'frames_v2')
os.makedirs(FRAME_DIR, exist_ok=True)
BG=(8,8,8); GOLD=(212,160,23); BRIGHT=(255,215,0); WHITE=(244,240,231); MUTED=(158,151,139); GREEN=(37,211,102)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def f(path,size): return ImageFont.truetype(path,size)
def center(d,text,y,ft,fill,spacing=4):
    box=d.multiline_textbbox((0,0),text,font=ft,spacing=spacing,align='center')
    d.multiline_text(((W-(box[2]-box[0]))//2,y),text,font=ft,fill=fill,spacing=spacing,align='center')
def panel(d,box,fill=(17,17,17),outline=(62,53,32)):
    d.rounded_rectangle(box,28,fill=fill,outline=outline,width=2)
def logo(d,y):
    cx=540; cy=y+55; r=42
    pts=[(cx,cy-r),(cx+r,cy-r//2),(cx+r,cy+r//2),(cx,cy+r),(cx-r,cy+r//2),(cx-r,cy-r//2)]
    d.line(pts+[pts[0]],fill=BRIGHT,width=3,joint='curve')
    d.line((cx-13,cy-17,cx-13,cy+17),fill=BRIGHT,width=3)
    d.arc((cx-13,cy-17,cx+24,cy+17),270,90,fill=BRIGHT,width=3)
    center(d,'DEMITECH',y+112,f(BOLD,40),BRIGHT)
    center(d,'WEB SERVICES',y+160,f(FONT,16),MUTED)

def make(i):
    t=i/FPS; img=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(img)
    gx=int(540+360*math.sin(t*.55))
    for r in range(500,0,-14):
        a=int(20*(1-r/500)); d.ellipse((gx-r,260-r,gx+r,260+r),fill=(8+a,8+a,8))
    for y in range(0,H,96): d.line((0,y,W,y),fill=(20,18,14),width=1)
    for x in range(0,W,96): d.line((x,0,x,H),fill=(20,18,14),width=1)
    if t<2.5:
        logo(d,100); center(d,'STOP LOSING\nCUSTOMERS ONLINE.',510,f(BOLD,66),WHITE,8); center(d,'Your website is often your first sales conversation.',800,f(FONT,30),MUTED,6)
    elif t<6:
        logo(d,70); center(d,'STARTING FROM',430,f(FONT,28),MUTED); center(d,'R1,500',500,f(BOLD,116),BRIGHT); center(d,'Professional websites for South African businesses.',700,f(FONT,30),WHITE)
        panel(d,(110,910,970,1240)); center(d,'7–21 DAY DELIVERY',985,f(BOLD,42),WHITE); center(d,'Milestone payments · Direct access · No agency bloat',1085,f(FONT,26),MUTED)
    elif t<9.5:
        logo(d,70); center(d,'LOOK PROFESSIONAL.\nLOAD FAST.\nCONVERT MORE.',430,f(BOLD,60),WHITE,8)
        d.rectangle((170,990,910,1060),fill=GOLD); d.rectangle((170,990,680,1060),fill=BRIGHT)
        center(d,'BUILT FOR GROWTH',1160,f(BOLD,37),GOLD); center(d,'Websites · Web apps · Mobile apps',1250,f(FONT,30),MUTED)
    else:
        logo(d,95); center(d,'READY TO BUILD?',500,f(BOLD,74),WHITE); center(d,'Get your free quote today.',650,f(FONT,38),BRIGHT)
        d.rounded_rectangle((110,900,970,1095),30,fill=GREEN); center(d,'WHATSAPP 065 024 1517',965,f(BOLD,38),(8,8,8))
        center(d,'No obligation · Reply within 24 hours',1250,f(FONT,28),MUTED); center(d,'Built Local. Built to Grow.',1660,f(FONT,27),BRIGHT)
    return img

for i in range(FPS*DURATION): make(i).save(os.path.join(FRAME_DIR,f'frame_{i:04d}.jpg'),quality=92)
out=os.path.join(ROOT,'dtws_social_ad_v2_9x16.mp4')
audio='aevalsrc=0.06*sin(2*PI*220*t)*(0.45+0.55*sin(2*PI*0.5*t)^2)+0.025*sin(2*PI*440*t):s=44100:d=12'
subprocess.run(['ffmpeg','-y','-framerate',str(FPS),'-i',os.path.join(FRAME_DIR,'frame_%04d.jpg'),'-f','lavfi','-i',audio,'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',out],check=True)
print(out)
