from PIL import Image, ImageDraw, ImageFont
import math, os, subprocess
W,H,FPS,DURATION=1080,1920,30,12
ROOT=os.path.dirname(__file__); FRAMES=os.path.join(ROOT,'frames_v9'); os.makedirs(FRAMES,exist_ok=True)
BG=(8,8,8); GOLD=(212,160,23); BRIGHT=(255,215,0); WHITE=(244,240,231); MUTED=(158,151,139); GREEN=(37,211,102)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def ft(p,s): return ImageFont.truetype(p,s)
def center(d,text,y,font,fill,spacing=6):
    b=d.multiline_textbbox((0,0),text,font=font,spacing=spacing,align='center'); d.multiline_text(((W-b[2]+b[0])//2,y),text,font=font,fill=fill,spacing=spacing,align='center')
def logo(d,y):
    cx,cy,r=540,y+54,42; pts=[(cx,cy-r),(cx+r,cy-r//2),(cx+r,cy+r//2),(cx,cy+r),(cx-r,cy+r//2),(cx-r,cy-r//2)]
    d.line(pts+[pts[0]],fill=BRIGHT,width=3,joint='curve'); d.line((cx-13,cy-17,cx-13,cy+17),fill=BRIGHT,width=3); d.arc((cx-13,cy-17,cx+24,cy+17),270,90,fill=BRIGHT,width=3)
    center(d,'DEMITECH',y+110,ft(BOLD,40),BRIGHT); center(d,'WEB SERVICES',y+158,ft(FONT,16),MUTED)
def panel(d,xy): d.rounded_rectangle(xy,28,fill=(17,17,17),outline=(62,53,32),width=2)
def frame(i):
    t=i/FPS; im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im); gx=int(540+330*math.sin(t*.5))
    for r in range(500,0,-14):
        a=int(20*(1-r/500)); d.ellipse((gx-r,270-r,gx+r,270+r),fill=(8+a,8+a,8))
    for y in range(0,H,96): d.line((0,y,W,y),fill=(20,18,14),width=1)
    for x in range(0,W,96): d.line((x,0,x,H),fill=(20,18,14),width=1)
    if t<2.5:
        logo(d,90); center(d,'YOUR BUSINESS\nISN’T GENERIC.',470,ft(BOLD,72),WHITE,8); center(d,'Your digital presence shouldn’t be either.',800,ft(FONT,31),MUTED)
    elif t<5.8:
        logo(d,60); center(d,'BUILT AROUND\nYOUR GOALS.',410,ft(BOLD,66),WHITE,8); center(d,'Website · Web app · Mobile app',760,ft(FONT,32),BRIGHT); panel(d,(120,930,960,1190)); center(d,'PRACTICAL. CLEAR. SCALABLE.',990,ft(BOLD,31),WHITE); center(d,'No one-size-fits-all packages.',1085,ft(FONT,25),MUTED)
    elif t<9.2:
        logo(d,60); center(d,'START AT THE\nRIGHT LEVEL.',400,ft(BOLD,65),WHITE,8); center(d,'From R1,500 · Transparent pricing\nMilestone payments · Direct access',700,ft(FONT,31),MUTED,8); d.line((190,1110,890,1110),fill=GOLD,width=4); center(d,'FREE QUOTE · NO OBLIGATION',1190,ft(BOLD,34),BRIGHT)
    else:
        logo(d,95); center(d,'LET’S BUILD\nYOUR FIT.',500,ft(BOLD,72),WHITE,8); center(d,'WhatsApp your idea today.',700,ft(FONT,34),BRIGHT); d.rounded_rectangle((110,930,970,1120),30,fill=GREEN); center(d,'WHATSAPP 065 024 1517',995,ft(BOLD,38),(8,8,8)); center(d,'Built Local. Built to Grow.',1650,ft(FONT,28),BRIGHT)
    return im
for i in range(FPS*DURATION): frame(i).save(os.path.join(FRAMES,f'frame_{i:04d}.jpg'),quality=92)
out=os.path.join(ROOT,'dtws_social_ad_v9_9x16.mp4'); audio='aevalsrc=0.06*sin(2*PI*370*t)*(0.45+0.55*sin(2*PI*0.5*t)^2)+0.025*sin(2*PI*740*t):s=44100:d=12'
subprocess.run(['ffmpeg','-y','-framerate',str(FPS),'-i',os.path.join(FRAMES,'frame_%04d.jpg'),'-f','lavfi','-i',audio,'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',out],check=True)
print(out)
