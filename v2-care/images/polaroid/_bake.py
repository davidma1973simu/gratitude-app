#!/usr/bin/env python3
# 把仓库内相片烘成「宝利来」语言：冷调、低饱和、过曝泛光、轻微动感、颗粒、暗角。
# 逐张 bake 成独立文件（而不是运行时 canvas filter），因为 ctx.filter 在部分 Safari 上不生效。
import os, numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

SRC = '/Users/davidma/WorkBuddy/2026-06-17-20-28-55/gratitude-app/v2-care/images'
OUT = os.path.join(SRC, 'polaroid')

# 8 张冷调候选：湖、海、雾、山、林、浪、黄昏，全部无人像
PICKS = [
    ('calm/calm-03.jpg',     'pol-01'),
    ('calm/calm-05.jpg',     'pol-02'),
    ('hopeful/hopeful-02.jpg', 'pol-03'),
    ('hopeful/hopeful-05.jpg', 'pol-04'),
    ('hopeful/hopeful-06.jpg', 'pol-05'),
    ('calm/calm-02.jpg',     'pol-06'),
    ('calm/calm-06.jpg',     'pol-07'),
    ('calm/calm-04.jpg',     'pol-08'),
]


def square(im, size=900):
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    return im.resize((size, size), Image.LANCZOS)


def motion_blur(im, dist=11, steps=5):
    """横向运行平均，模拟一点手持/移动的拖影"""
    res = im
    im_arr = np.asarray(im).astype(np.float32)
    acc = np.zeros_like(im_arr)
    offs = [int(-dist / 2 + dist * i / (steps - 1)) for i in range(steps)]
    for off in offs:
        acc += np.roll(im_arr, off, axis=1)
    acc /= steps
    return Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8))


def bloom(im, radius=26, thresh=148):
    b = im.filter(ImageFilter.GaussianBlur(radius))
    arr = np.asarray(im).astype(np.float32)
    lum = arr.mean(axis=2)
    mask = np.clip((lum - thresh) / (255 - thresh), 0, 1) ** 1.4
    m = (mask * 255).astype(np.uint8)
    mask_img = Image.fromarray(m, 'L').filter(ImageFilter.GaussianBlur(9))
    return Image.composite(Image.blend(im, b, 0.62), im, mask_img)


def vignette(im, strength=0.34):
    w, h = im.size
    y, x = np.mgrid[0:h, 0:w]
    cx, cy = w / 2, h / 2
    r = np.sqrt(((x - cx) / (w * 0.62)) ** 2 + ((y - cy) / (h * 0.62)) ** 2)
    v = np.clip(1 - strength * np.clip(r - 0.55, 0, 1.6) ** 1.5, 0, 1)
    arr = np.asarray(im).astype(np.float32) * v[:, :, None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def grain(im, amount=5.2):
    arr = np.asarray(im).astype(np.float32)
    rng = np.random.default_rng(7)
    n = rng.normal(0, amount, arr.shape[:2])[:, :, None]
    return Image.fromarray(np.clip(arr + n, 0, 255).astype(np.uint8))


def cool_cast(im):
    arr = np.asarray(im).astype(np.float32)
    arr[:, :, 0] *= 0.925          # 压红
    arr[:, :, 1] *= 0.985
    arr[:, :, 2] *= 1.075          # 提蓝
    # 抬黑位：把纯黑拉起来一点，像过期胶片
    arr = arr * 0.955 + 14
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def process(path):
    im = square(Image.open(path).convert('RGB'))
    im = cool_cast(im)
    im = ImageEnhance.Color(im).enhance(0.40)      # 低饱和
    im = ImageEnhance.Brightness(im).enhance(1.10)  # 过曝倾向
    im = ImageEnhance.Contrast(im).enhance(0.92)    # 反差压低，留灰
    im = bloom(im)
    # 动感只给一部分，全部拖影会像糊了
    if 'pol-03' in path or 'pol-05' in path or 'pol-08' in path:
        im = Image.blend(im, motion_blur(im, dist=18, steps=7), 0.72)
    else:
        im = Image.blend(im, motion_blur(im, dist=7, steps=4), 0.28)
    im = vignette(im, 0.32)
    im = grain(im, 4.6)
    return im


os.makedirs(OUT, exist_ok=True)
for rel, name in PICKS:
    src = os.path.join(SRC, rel)
    out = os.path.join(OUT, name + '.jpg')
    process(src).save(out, quality=88, optimize=True, progressive=True)
    print('baked', name, os.path.getsize(out) // 1024, 'KB')
