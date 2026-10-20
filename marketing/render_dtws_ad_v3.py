from PIL import Image, ImageDraw, ImageFont
import math, os, subprocess

W,H,FPS,DURATION=1080,1920,30,12
ROOT=os.path.dirname(__file__); FRAMES=os.path.join(ROOT,'frames_v3'); os.makedirs(FRAMES,exist_ok=True)
BG=(8,8,8); GOLD=(212,160,23); BRIGHT=(255,215,0); WHITE=(244,240,231); MUTED=(158,151,139); GREEN=(37,211,102)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def ft(p,s): return ImageFont.truetype(p,s)
def center(d,text,y,font,fill,spacing=6):
    b=d.multiline_textbbox((0,0),text,font=font,spacing=spacing,align='center'); d.multiline_text(((W-b[2]+b[0])//2,y),text,font=font,fill=fill,spacing=spacing,align='center')
def logo(d,y):
    cx,cy,r=540,y+54,42; pts=[(cx,cy-r),(cx+r,cy-r//2),(cx+r,cy+r//2),(cx,cy+r),(cx-r,cy+r//2),(cx-r,cy-r//2)]
    d.line(pts+[pts[0]],fill=BRIGHT,width=3,joint='curve'); d.line((cx-13,cy-17,cx-13,cy+17),fill=BRIGHT,width=3); d.arc((cx-13,cy-17,cx+24,cy+17),270,90,fill=BRIGHT,width=3)
    center(d,'DEMITECH',y+110,ft(BOLD,40),BRIGHT); center(d,'WEB SERVICES',y+158,ft(FONT,16),MUTED)
def box(d,xy): d.rounded_rectangle(xy,28,fill=(17,17,17),outline=(62,53,32),width=2)
def frame(i):
    t=i/FPS; im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im); gx=int(540+330*math.sin(t*.48))
    for r in range(500,0,-14):
        a=int(20*(1-r/500)); d.ellipse((gx-r,270-r,gx+r,270+r),fill=(8+a,8+a,8))
    for y in range(0,H,96): d.line((0,y,W,y),fill=(20,18,14),width=1)
    for x in range(0,W,96): d.line((x,0,x,H),fill=(20,18,14),width=1)
    if t<2.6:
        logo(d,90); center(d,'BUILD LOCAL.\nGROW ANYWHERE.',500,ft(BOLD,72),WHITE,8); center(d,'Digital solutions for businesses ready to move forward.',820,ft(FONT,29),MUTED)
    elif t<5.8:
        logo(d,70); center(d,'WE BUILD THE WEB.',430,ft(BOLD,60),WHITE); center(d,'YOU GROW THE BUSINESS.',540,ft(BOLD,53),BRIGHT)
        box(d,(110,820,970,1225)); center(d,'WEBSITES',875,ft(BOLD,35),WHITE); center(d,'WEB APPS  ·  MOBILE APPS',1010,ft(BOLD,30),GOLD); center(d,'Built around your goals. Priced for South Africa.',1120,ft(FONT,25),MUTED)
    elif t<9.0:
        logo(d,70); center(d,'DIRECT ACCESS.\nTRANSPARENT PRICING.',430,ft(BOLD,57),WHITE,8)
        for x,title,sub in [(110,'7–21 DAYS','Typical delivery'),(390,'FROM R1,500','Website starting price'),(670,'50 / 50','Milestone payments')]:
            box(d,(x,900,x+250,1190)); center(d,title,980,ft(BOLD,29),BRIGHT); center(d,sub,1080,ft(FONT,20),MUTED)
    else:
        logo(d,95); center(d,'LET’S BUILD\nYOUR NEXT MOVE.',500,ft(BOLD,67),WHITE,8); center(d,'Free quote · No obligation',730,ft(FONT,34),BRIGHT)
        d.rounded_rectangle((110,930,970,1120),30,fill=GREEN); center(d,'WHATSAPP 065 024 1517',995,ft(BOLD,38),(8,8,8)); center(d,'Built Local. Built to Grow.',1650,ft(FONT,28),BRIGHT)
    return im
for i in range(FPS*DURATION): frame(i).save(os.path.join(FRAMES,f'frame_{i:04d}.jpg'),quality=92)
out=os.path.join(ROOT,'dtws_social_ad_v3_9x16.mp4'); audio='aevalsrc=0.06*sin(2*PI*196*t)*(0.45+0.55*sin(2*PI*0.5*t)^2)+0.025*sin(2*PI*392*t):s=44100:d=12'
subprocess.run(['ffmpeg','-y','-framerate',str(FPS),'-i',os.path.join(FRAMES,'frame_%04d.jpg'),'-f','lavfi','-i',audio,'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',out],check=True)
print(out)
