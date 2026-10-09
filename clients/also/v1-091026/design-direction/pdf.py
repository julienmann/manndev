from playwright.sync_api import sync_playwright
import pathlib
with sync_playwright() as p:
    b=p.chromium.launch(channel="chrome")
    pg=b.new_page()
    pg.goto("http://localhost:8321/design-direction/sheet.html"); pg.wait_for_load_state("networkidle")
    pg.evaluate("document.fonts.ready")
    pg.pdf(path="ALSO-Productions-Design-Direction.pdf",width="297mm",height="210mm",print_background=True,prefer_css_page_size=True)
    # preview PNGs of each page for checking
    pg.set_viewport_size({"width":1123,"height":794})
    for i,el in enumerate(pg.locator(".page").all()):
        el.screenshot(path=f"/private/tmp/claude-501/-Users-julienmann-www-MANNDEVPROJECTS-alsoprod/36fbe57f-fa64-4f6c-9248-089006e5c414/scratchpad/p{i+1}.png")
    b.close()
