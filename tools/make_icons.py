"""Draws the app icon (a letter tile on a slate ground) at the sizes Electron and Capacitor need."""
from PIL import Image, ImageDraw, ImageFont
import os
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SLATE=(29,42,48); TILE=(243,230,200); EDGE=(205,184,138); INK=(42,33,22); RED=(196,71,58); BG=(238,242,244)
def tile(size, scale=0.62, ground=True, radius_frac=0.22):
    S=size*4; im=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    if ground: d.rounded_rectangle([0,0,S-1,S-1],radius=int(S*radius_frac),fill=SLATE)
    t=int(S*scale); x0=(S-t)//2; y0=(S-t)//2-int(S*0.01); r=int(t*0.14)
    d.rounded_rectangle([x0,y0+int(t*0.05),x0+t,y0+t+int(t*0.05)],radius=r,fill=EDGE)
    d.rounded_rectangle([x0,y0,x0+t,y0+t],radius=r,fill=TILE)
    f=ImageFont.truetype(BOLD,int(t*0.66)); fs=ImageFont.truetype(BOLD,int(t*0.17))
    d.text((x0+t*0.47,y0+t*0.50),"R",font=f,fill=INK,anchor="mm")
    d.text((x0+t*0.83,y0+t*0.84),"1",font=fs,fill=INK,anchor="mm")
    d.polygon([(x0+t-int(t*0.30),y0),(x0+t-r,y0),(x0+t,y0+r),(x0+t,y0+int(t*0.30))],fill=RED)
    return im.resize((size,size),Image.LANCZOS)
os.makedirs("build",exist_ok=True); os.makedirs("assets",exist_ok=True)
tile(512).save("build/icon.png")
tile(256).save("build/icon.ico",sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
tile(1024).save("assets/icon-only.png")
tile(1024,scale=0.42,ground=False).save("assets/icon-foreground.png")
Image.new("RGBA",(1024,1024),SLATE+(255,)).save("assets/icon-background.png")
for name,bg in (("splash.png",BG),("splash-dark.png",(20,27,31))):
    sp=Image.new("RGBA",(2732,2732),bg+(255,)); t=tile(600,scale=0.9,ground=False); sp.alpha_composite(t,((2732-600)//2,(2732-600)//2)); sp.save("assets/"+name)
print("icons written")
