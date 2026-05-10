AUTHOR = "UE長崎"
SITENAME = "UE長崎"
SITEURL = ""

PATH = "content"
STATIC_PATHS = ["images"]
IGNORE_FILES = ["sample"]

TIMEZONE = "Asia/Tokyo"
DEFAULT_LANG = "ja"

THEME = "themes/ue_nagasaki"

# URL構成
ARTICLE_URL = "events/{slug}/"
ARTICLE_SAVE_AS = "events/{slug}/index.html"
PAGE_URL = "{slug}/"
PAGE_SAVE_AS = "{slug}/index.html"

# トップ → index.html, イベント一覧 → events/index.html
DIRECT_TEMPLATES = ["index", "archives"]
INDEX_SAVE_AS = "index.html"
ARCHIVES_SAVE_AS = "events/index.html"

# 不要な出力を無効化
AUTHOR_SAVE_AS = ""
CATEGORY_SAVE_AS = ""
TAG_SAVE_AS = ""
AUTHORS_SAVE_AS = ""
CATEGORIES_SAVE_AS = ""
TAGS_SAVE_AS = ""

# フィード無効化
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

DEFAULT_PAGINATION = False
RELATIVE_URLS = True

# プラグイン設定
PLUGINS = [
    "sitemap",
    "neighbors",
    "minchin.pelican.plugins.summary",
    "related_posts",
    "pelican_embed_microblog",
]
