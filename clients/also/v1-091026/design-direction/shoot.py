from playwright.sync_api import sync_playwright
URL="http://localhost:8321/"
PREP="""
document.querySelectorAll('.reveal').forEach(e=>{e.classList.add('in');e.style.transitionDelay='0ms'});
document.querySelectorAll('img[loading]').forEach(i=>i.loading='eager');
document.querySelector('header').classList.remove('scrolled');
"""
with sync_playwright() as p:
    b=p.chromium.launch(channel="chrome")
    pg=b.new_page(viewport={"width":1440,"height":900},device_scale_factor=2,reduced_motion="reduce")
    pg.goto(URL); pg.wait_for_load_state("networkidle"); pg.evaluate(PREP); pg.wait_for_timeout(800)
    pg.screenshot(path="shots/hero.png")
    pg.add_style_tag(content="header{display:none!important}")
    for sel,name in [("#trailers","trailers"),(".about","about"),("#productions","productions"),("#studio","team"),("#news","news")]:
        pg.locator(sel).screenshot(path=f"shots/{name}.png")
    pg.locator("#contact").screenshot(path="shots/contact.png")
    pg.locator("footer").screenshot(path="shots/footer.png")
    # hover state on a poster card
    pg.locator(".card").nth(2).scroll_into_view_if_needed(); pg.locator(".card").nth(2).hover(); pg.wait_for_timeout(600)
    pg.locator(".card").nth(2).screenshot(path="shots/card-hover.png")
    pg.locator(".card").nth(0).screenshot(path="shots/card.png")
    pg.locator(".trailer").nth(1).screenshot(path="shots/trailer-tile.png")
    pg.locator(".hero .ctas").first.screenshot(path="shots/buttons.png")
    pg.locator(".hero-nav").screenshot(path="shots/hero-nav.png")
    m=b.new_page(viewport={"width":390,"height":844},device_scale_factor=3,is_mobile=True,has_touch=True,reduced_motion="reduce")
    m.goto(URL); m.wait_for_load_state("networkidle"); m.evaluate(PREP); m.wait_for_timeout(800)
    m.screenshot(path="shots/m-hero.png")
    m.locator("#productions").scroll_into_view_if_needed(); m.evaluate("scrollTo(0,document.querySelector('#productions').offsetTop)"); m.wait_for_timeout(500)
    m.screenshot(path="shots/m-productions.png")
    m.evaluate("scrollTo(0,0)"); m.click(".menu-btn"); m.wait_for_timeout(300)
    m.screenshot(path="shots/m-menu.png")
    b.close()
