import pymupdf
d = pymupdf.open('/root/.claude/uploads/37b301ad-be09-5c60-b313-f72553601eae/861d2932-ESGCounts_Brandbook.pdf')
drs = d[0].get_drawings()[1:4]  # mark, ESG, Counts

def f(v): return f"{v:.2f}".rstrip('0').rstrip('.')
def path_d(dr, ox, oy):
    out = []; last = None
    def P(p): return f"{f(p.x-ox)} {f(p.y-oy)}"
    for it in dr['items']:
        k = it[0]
        if k == 're':
            r = it[1]; out.append(f"M{f(r.x0-ox)} {f(r.y0-oy)}H{f(r.x1-ox)}V{f(r.y1-oy)}H{f(r.x0-ox)}Z"); last=None; continue
        if k == 'qu':
            q = it[1]; out.append(f"M{P(q.ul)}L{P(q.ur)}L{P(q.lr)}L{P(q.ll)}Z"); last=None; continue
        start = it[1]
        if last is None or abs(start.x-last.x) > 0.01 or abs(start.y-last.y) > 0.01:
            if out and last is not None: out.append("Z")
            out.append(f"M{P(start)}")
        if k == 'l': out.append(f"L{P(it[2])}"); last = it[2]
        elif k == 'c': out.append(f"C{P(it[2])} {P(it[3])} {P(it[4])}"); last = it[4]
    out.append("Z")
    return "".join(out), ("evenodd" if dr.get('even_odd') else "nonzero")

x0 = min(dr['rect'].x0 for dr in drs); y0 = min(dr['rect'].y0 for dr in drs)
x1 = max(dr['rect'].x1 for dr in drs); y1 = max(dr['rect'].y1 for dr in drs)
pad = 0
W, H = x1-x0, y1-y0
paths = [path_d(dr, x0, y0) for dr in drs]
mark_r = drs[0]['rect']
mark_path, mark_rule = path_d(drs[0], mark_r.x0, mark_r.y0)

TEAL, LIME, DARK, WHITE = "#2C5D63", "#A9C52F", "#283739", "#FFFFFF"
def full(colors, name, title):
    body = "".join(f'<path fill="{c}" fill-rule="{r}" d="{p}"/>' for (p, r), c in zip(paths, colors))
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(W)} {f(H)}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'
    open(f"public/brand/{name}.svg", "w").write(s)
def mark(color, name, bg=None):
    s = mark_r.width
    body = f'<path fill="{color}" fill-rule="{mark_rule}" d="{mark_path}"/>'
    if bg:
        m = s*0.14; S = s+2*m
        s_ = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(S)} {f(S)}"><rect width="{f(S)}" height="{f(S)}" rx="{f(S*0.22)}" fill="{bg}"/><g transform="translate({f(m)} {f(m)})">{body}</g></svg>\n'
    else:
        s_ = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(s)} {f(mark_r.height)}" role="img" aria-label="ESGCounts"><title>ESGCounts</title>{body}</svg>\n'
    open(f"public/brand/{name}.svg", "w").write(s_)

import os; os.makedirs("public/brand", exist_ok=True)
full([TEAL, LIME, TEAL], "logo-color", "ESGCounts")          # white / light backgrounds
full([WHITE, LIME, WHITE], "logo-on-teal", "ESGCounts")      # teal / dark backgrounds
full([TEAL, TEAL, TEAL], "logo-teal", "ESGCounts")           # pale lime backgrounds
full([WHITE, WHITE, WHITE], "logo-white", "ESGCounts")       # lime backgrounds
mark(TEAL, "mark-teal"); mark(WHITE, "mark-white")
mark(WHITE, "app-icon", bg=TEAL)
print(W, H, mark_r)
