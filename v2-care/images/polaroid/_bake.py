#!/usr/bin/env python3
# 宝利来语言 v2：不用「冷调 + 低饱和 + 拖影」那套（那是电影感，不是宝利来）。
# 真宝利来 = 奶白褪色 + 天烧到近白 + 高光偏黄/暗部偏青绿 + 柔焦 + 漏光 + 灰尘。
# 每张色偏略有不同（真实相纸批次差异），避免 8 张一个模子。
import os, numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw

SRC = '/Users/davidma/WorkBuddy/2026-06-17-20-28-55/gratitude-app/v2-care/images'
OUT = os.path.join(SRC, 'polaroid')

# (源图, 文件名, 色偏参数)  —— 挑大天空、空场景、随手构图，避开戏剧性日落
PICKS = [
    ('warm/warm-01.jpg',       'pol-01', (1.02, 1.01, 0.96)),   # 湖面黄昏 → 奶油黄
    ('hopeful/hopeful-05.jpg', 'pol-02', (1.00, 1.02, 0.99)),   # 雾湖 → 中性偏绿
    ('hopeful/hopeful-06.jpg', 'pol-03', (1.03, 1.00, 0.94)),   # 树林 → 黄绿
    ('calm/calm-03.jpg',       'pol-04', (0.98, 1.01, 1.02)),   # 湖上小船 → 偏青
    ('calm/calm-04.jpg',       'pol-05', (1.02, 1.02, 0.95)),   # 林间小路 → 黄绿
    ('gentle/gentle-03.jpg',   'pol-06', (1.04, 1.00, 0.97)),   # 花枝 → 奶油粉
    ('warm/warm-05.jpg',       'pol-07', (0.99, 1.00, 1.00)),   # 海面 → 灰青
    ('calm/calm-05.jpg',       'pol-08', (1.01, 1.02, 0.97)),   # 瀑布 → 绿
]


def square(im, size=900):
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    return im.resize((size, size), Image.LANCZOS)


def polaroid_grade(im, cast, seed):
    arr = np.asarray(im).astype(np.float32)

    # 1) 天烧白：只压高光，让它向近白滚，而不是整体提亮
    hi = np.clip((arr - 168) / 87, 0, 1) ** 1.1
    arr = arr + (255 - arr) * 0.62 * hi

    # 2) 奶白褪色：抬黑 + 压缩动态范围（相纸的黑不是 0，是 26 左右的暖灰）
    arr = arr * 0.885 + 27

    # 3) 高光偏暖、暗部偏青绿（宝利来的经典交叉色偏）
    lum = arr.mean(axis=2, keepdims=True) / 255.0
    r, g, b = cast
    arr[:, :, 0] *= 1 + (r - 1) * (0.35 + 0.65 * lum[:, :, 0])
    arr[:, :, 1] *= 1 + (g - 1) * (0.35 + 0.65 * lum[:, :, 0])
    arr[:, :, 2] *= 1 + (b - 1) * (0.35 + 0.65 * lum[:, :, 0])
    shadow = 1 - lum[:, :, 0]
    arr[:, :, 0] -= 7 * shadow     # 暗部抽红
    arr[:, :, 1] += 4 * shadow     # 暗部补绿
    arr[:, :, 2] += 6 * shadow     # 暗部补青

    im2 = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    # 4) 饱和度只降到 .64 —— 真宝利来还有颜色（红裙、橘外套都是饱和的）
    im2 = ImageEnhance.Color(im2).enhance(0.64)

    # 5) 柔焦：相纸 + 镜头的软，不是失焦
    soft = im2.filter(ImageFilter.GaussianBlur(3.4))
    im2 = Image.blend(im2, soft, 0.34)

    # 6) 漏光：一角暖橙，screen 混合
    w, h = im2.size
    leak = Image.new('RGB', (w, h), (0, 0, 0))
    d = ImageDraw.Draw(leak)
    cornery = [(0, 0), (w, 0), (w, h), (0, h)][seed % 4]
    d.ellipse([cornery[0] - w * 0.55, cornery[1] - h * 0.55,
               cornery[0] + w * 0.55, cornery[1] + h * 0.55],
              fill=(150, 96, 40))
    leak = leak.filter(ImageFilter.GaussianBlur(90))
    idx = np.asarray(im2).astype(np.float32) / 255.0
    lk = np.asarray(leak).astype(np.float32) / 255.0
    idx = 1 - (1 - idx) * (1 - lk * 0.30)
    im2 = Image.fromarray(np.clip(idx * 255, 0, 255).astype(np.uint8))

    # 7) 暗角（轻）
    y, x = np.mgrid[0:h, 0:w]
    rr = np.sqrt(((x - w / 2) / (w * 0.66)) ** 2 + ((y - h / 2) / (h * 0.66)) ** 2)
    v = np.clip(1 - 0.22 * np.clip(rr - 0.62, 0, 1.5) ** 1.3, 0, 1)
    a = np.asarray(im2).astype(np.float32) * v[:, :, None]
    im2 = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

    # 8) 颗粒 + 极少量灰尘
    a = np.asarray(im2).astype(np.float32)
    rng = np.random.default_rng(seed * 31 + 5)
    a += rng.normal(0, 3.6, a.shape[:2])[:, :, None]
    im2 = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im2)
    for _ in range(14):
        px, py = int(rng.integers(0, w)), int(rng.integers(0, h))
        rad = float(rng.uniform(0.6, 1.8))
        d.ellipse([px, py, px + rad, py + rad], fill=(238, 232, 220))
    return im2


os.makedirs(OUT, exist_ok=True)
for i, (rel, name, cast) in enumerate(PICKS):
    im = square(Image.open(os.path.join(SRC, rel)).convert('RGB'))
    out = os.path.join(OUT, name + '.jpg')
    polaroid_grade(im, cast, i).save(out, quality=90, optimize=True, progressive=True)
    print('baked', name, os.path.getsize(out) // 1024, 'KB', '<-', rel)
