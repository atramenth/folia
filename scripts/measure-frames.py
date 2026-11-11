"""Measure where the printed orange frame (cadre) sits on every scanned page.
Writes frames.json: {page: [cx, cy, w, h, angleDeg]} as fractions of the image width and height."""
import sys, json, glob, os, numpy as np
from PIL import Image
from multiprocessing import Pool
D = sys.argv[1]; W = 520

def analyse(n):
    try:
        im = Image.open(f'{D}/{n}.avif').convert('RGB')
    except Exception as e:
        return n, None
    ow, oh = im.size
    h = int(oh * W / ow)
    a = np.asarray(im.resize((W, h), Image.BILINEAR)).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1); mn = a.min(-1); s = (mx - mn) / (mx + 1e-6)
    m = (r >= g) & (g >= b) & (s > 0.16) & (s < 0.7) & (mx > 0.75) & ((g - b) > 0.04)
    cs = m.sum(0).astype(float); rs = m.sum(1).astype(float)
    if cs.max() < 40 or rs.max() < 40:
        return n, None
    def edge(p, thr, fromend=False):
        idx = np.where(p > thr)[0]
        return None if len(idx) == 0 else (idx[-1] if fromend else idx[0])
    L = edge(cs, .30 * cs.max()); R = edge(cs, .30 * cs.max(), True)
    T = edge(rs, .30 * rs.max()); B = edge(rs, .30 * rs.max(), True)
    if None in (L, R, T, B) or R - L < W * .5 or B - T < h * .5:
        return n, None
    # skew: outer edge of the frame along each side
    def slope(pos, vals):
        pos = np.array(pos, float); vals = np.array(vals, float)
        if len(pos) < 8: return 0.0, None
        k, c = np.polyfit(pos, vals, 1)
        res = vals - (k * pos + c); keep = np.abs(res) < 3
        if keep.sum() >= 6: k, c = np.polyfit(pos[keep], vals[keep], 1)
        return k, c
    xs = np.arange(L + int((R - L) * .2), R - int((R - L) * .2), 3)
    top = [(x, np.argmax(m[max(T - 12, 0):T + 40, x]) + max(T - 12, 0)) for x in xs if m[max(T - 12, 0):T + 40, x].any()]
    bot = [(x, (len(m[B - 40:B + 12, x]) - 1 - np.argmax(m[B - 40:B + 12, x][::-1])) + B - 40) for x in xs if m[B - 40:B + 12, x].any()]
    ys = np.arange(T + int((B - T) * .2), B - int((B - T) * .2), 3)
    lft = [(y, np.argmax(m[y, max(L - 12, 0):L + 40]) + max(L - 12, 0)) for y in ys if m[y, max(L - 12, 0):L + 40].any()]
    rgt = [(y, (len(m[y, R - 40:R + 12]) - 1 - np.argmax(m[y, R - 40:R + 12][::-1])) + R - 40) for y in ys if m[y, R - 40:R + 12].any()]
    kt, ct = slope(*zip(*top)) if top else (0, None)
    kb, cb = slope(*zip(*bot)) if bot else (0, None)
    kl, cl = slope(*zip(*lft)) if lft else (0, None)
    kr, cr = slope(*zip(*rgt)) if rgt else (0, None)
    ang = np.degrees(np.mean([np.arctan(kt), np.arctan(kb), -np.arctan(kl), -np.arctan(kr)]))
    # edges evaluated at the page centre
    xm, ym = (L + R) / 2, (T + B) / 2
    t = kt * xm + ct if ct is not None else T
    bt = kb * xm + cb if cb is not None else B
    l = kl * ym + cl if cl is not None else L
    rr = kr * ym + cr if cr is not None else R
    return n, [float((l + rr) / 2 / W), float((t + bt) / 2 / h), float((rr - l) / W), float((bt - t) / h), float(ang)]

if __name__ == '__main__':
    pages = sorted(int(os.path.basename(f)[:-5]) for f in glob.glob(f'{D}/*.avif'))
    with Pool(os.cpu_count()) as p: res = p.map(analyse, pages, chunksize=8)
    out = {n: v for n, v in res}
    json.dump(out, open(sys.argv[2], 'w'))
    ok = [v for v in out.values() if v]
    print(len(ok), 'of', len(out), 'detected')
    a = np.array(ok)
    for i, nm in enumerate(['cx', 'cy', 'w', 'h', 'ang']):
        print(nm, 'min %.4f p5 %.4f med %.4f p95 %.4f max %.4f' % (a[:, i].min(), np.percentile(a[:, i], 5), np.median(a[:, i]), np.percentile(a[:, i], 95), a[:, i].max()))
    print('failed:', [n for n, v in out.items() if not v][:60])
