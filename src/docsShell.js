const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[character])
  );

const icon = (name) => {
  const paths = {
    chevron: '<path d="m6 9 6 6 6-6"></path>',
    arrow: '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  };
  return `<svg class="lucide-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
    paths[name] || ""
  }</svg>`;
};

const getJson = async (url) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Help Center API returned ${response.status}`);
  return response.json();
};

async function getCollection(path) {
  const items = [];
  let nextUrl = path;

  while (nextUrl) {
    const payload = await getJson(nextUrl);
    items.push(
      ...(payload.categories || payload.sections || payload.articles || [])
    );
    nextUrl = payload.next_page || null;
  }

  return items;
}

function articleUrl(article, helpCenterPath) {
  return (
    article.html_url ||
    article.url ||
    `${helpCenterPath}/articles/${article.id}`
  );
}

function sectionUrl(section, helpCenterPath) {
  return (
    section.html_url ||
    section.url ||
    `${helpCenterPath}/sections/${section.id}`
  );
}

function isCurrentUrl(url) {
  try {
    return (
      new URL(url, window.location.origin).pathname === window.location.pathname
    );
  } catch {
    return false;
  }
}

function removeZendeskBranding() {
  document.querySelectorAll("a[href*='poweredbyzendesk']").forEach((link) => {
    const wrapper = link.closest("footer") || link.parentElement;
    if (wrapper && wrapper !== document.body) wrapper.remove();
    else link.remove();
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  removeZendeskBranding();
  const shell = document.querySelector("#app-shell");
  const sidebar = document.querySelector("#docs-sidebar");
  const sidebarNav = document.querySelector("#sidebar-nav");
  const searchDialog = document.querySelector("#search-dialog");
  const searchInput = document.querySelector("#dialog-search-input");
  const searchForm = document.querySelector("#global-search-form");
  const searchResults = document.querySelector("#search-results");

  if (!shell || !sidebar || !sidebarNav) return;

  const locale =
    shell.dataset.locale || document.documentElement.lang || "en-us";
  const helpCenterPath = shell.dataset.helpCenterPath || `/hc/${locale}`;
  const openSectionsKey = "giotto-docs-open-sections-v2";
  let navigation = { categories: [], sections: [], articles: [] };

  const storedOpenSections = () => {
    try {
      const value = JSON.parse(localStorage.getItem(openSectionsKey) || "[]");
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  };

  const saveOpenSections = (sections) => {
    try {
      localStorage.setItem(openSectionsKey, JSON.stringify([...sections]));
    } catch {
      /* optional */
    }
  };

  const renderSidebar = () => {
    const openSections = storedOpenSections();
    const sectionsByCategory = new Map();
    const articlesBySection = new Map();

    navigation.sections.forEach((section) => {
      const sections =
        sectionsByCategory.get(String(section.category_id)) || [];
      sections.push(section);
      sectionsByCategory.set(String(section.category_id), sections);
    });
    navigation.articles.forEach((article) => {
      const articles = articlesBySection.get(String(article.section_id)) || [];
      articles.push(article);
      articlesBySection.set(String(article.section_id), articles);
    });

    const categoryMarkup = navigation.categories
      .map((category) => {
        const sections = sectionsByCategory.get(String(category.id)) || [];
        return `<div class="nav-category">${escapeHtml(
          category.name
        )}</div>${sections
          .map((section) => {
            const articles = articlesBySection.get(String(section.id)) || [];
            const currentSection = isCurrentUrl(
              sectionUrl(section, helpCenterPath)
            );
            const currentArticle = articles.some((article) =>
              isCurrentUrl(articleUrl(article, helpCenterPath))
            );
            const expanded =
              openSections.has(String(section.id)) ||
              currentSection ||
              currentArticle;
            return `<div class="nav-section"><button class="nav-section-toggle" type="button" data-section-toggle="${escapeHtml(
              section.id
            )}" aria-expanded="${expanded}"><span class="nav-section-label">${escapeHtml(
              section.name
            )}</span><span class="nav-chevron">${icon(
              "chevron"
            )}</span></button><div class="nav-articles" data-section-articles="${escapeHtml(
              section.id
            )}"${expanded ? "" : " hidden"}>${articles
              .map((article) => {
                const href = articleUrl(article, helpCenterPath);
                return `<a class="nav-article${
                  isCurrentUrl(href) ? " is-active" : ""
                }" href="${escapeHtml(href)}"${
                  isCurrentUrl(href) ? ' aria-current="page"' : ""
                }>${escapeHtml(article.title)}</a>`;
              })
              .join("")}</div></div>`;
          })
          .join("")}`;
      })
      .join("");

    sidebarNav.innerHTML = categoryMarkup;
  };

  const renderCategoryArticleCounts = () => {
    const categoryBySection = new Map(
      navigation.sections.map((section) => [
        String(section.id),
        String(section.category_id),
      ])
    );
    const counts = new Map();

    navigation.articles.forEach((article) => {
      const categoryId = categoryBySection.get(String(article.section_id));
      if (categoryId) counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
    });

    document.querySelectorAll("[data-category-id]").forEach((card) => {
      const count = counts.get(String(card.dataset.categoryId)) || 0;
      const label = card.querySelector(".category-card-count");
      if (label) label.textContent = `${count} articles`;

      const category = navigation.categories.find(
        (item) => String(item.id) === String(card.dataset.categoryId)
      );
      const eyebrow = card.querySelector(".card-eyebrow");
      const categoryLabels = {
        "Giotto Cloud": "Product",
        "Giotto API": "Developers",
        "Giotto on-prem": "Deployment",
        "Tutorials and Courses": "Learn",
        "Troubleshooting and FAQ": "Support",
      };
      if (category && eyebrow) {
        eyebrow.textContent = categoryLabels[category.name] || "Documentation";
      }
    });
  };

  try {
    const prefix = `/api/v2/help_center/${encodeURIComponent(locale)}`;
    const results = await Promise.allSettled([
      getCollection(`${prefix}/categories.json?per_page=100`),
      getCollection(`${prefix}/sections.json?per_page=100`),
      getCollection(`${prefix}/articles.json?per_page=100`),
    ]);
    const [categoriesResult, sectionsResult, articlesResult] = results;
    const categories =
      categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
    const sections =
      sectionsResult.status === "fulfilled" ? sectionsResult.value : [];
    const articles =
      articlesResult.status === "fulfilled" ? articlesResult.value : [];

    navigation = { categories, sections, articles };
    if (categories.length) renderSidebar();
    renderCategoryArticleCounts();

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const collection = ["categories", "sections", "articles"][index];
        console.warn(
          `Giotto ${collection} could not load Help Center data:`,
          result.reason?.message || result.reason
        );
      }
    });
  } catch (error) {
    sidebarNav.innerHTML = `<a class="nav-article sidebar-home" href="${escapeHtml(
      helpCenterPath
    )}">Overview</a>`;
    console.warn(
      "Giotto navigation could not load Help Center data:",
      error.message
    );
  }

  sidebarNav.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-section-toggle]");
    if (toggle) {
      const sectionId = toggle.dataset.sectionToggle;
      const list = sidebarNav.querySelector(
        `[data-section-articles="${CSS.escape(sectionId)}"]`
      );
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      if (list) list.hidden = expanded;
      const openSections = storedOpenSections();
      if (expanded) openSections.delete(sectionId);
      else openSections.add(sectionId);
      saveOpenSections(openSections);
      return;
    }
    if (event.target.closest("a")) sidebar.classList.remove("is-open");
  });

  document
    .querySelectorAll("[data-action='open-sidebar']")
    .forEach((button) =>
      button.addEventListener("click", () => sidebar.classList.add("is-open"))
    );
  document
    .querySelectorAll("[data-action='close-sidebar']")
    .forEach((button) =>
      button.addEventListener("click", () =>
        sidebar.classList.remove("is-open")
      )
    );

  const closeSearch = () => {
    if (!searchDialog) return;
    searchDialog.hidden = true;
    document.body.classList.remove("search-open");
  };
  const openSearch = () => {
    if (!searchDialog || !searchInput) return;
    searchDialog.hidden = false;
    document.body.classList.add("search-open");
    searchInput.focus();
  };

  document
    .querySelectorAll("[data-action='open-search']")
    .forEach((button) => button.addEventListener("click", openSearch));
  document
    .querySelectorAll("[data-action='close-search']")
    .forEach((button) => button.addEventListener("click", closeSearch));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape") {
      closeSearch();
      sidebar.classList.remove("is-open");
    }
  });

  let searchTimer;
  const renderSearchResults = (results) => {
    if (!searchResults) return;
    searchResults.innerHTML = results.length
      ? results
          .map((result) => {
            const href =
              result.html_url ||
              result.url ||
              `${helpCenterPath}/articles/${result.id}`;
            return `<a class="result-item" href="${escapeHtml(
              href
            )}"><h3>${escapeHtml(result.title)}</h3><small>${escapeHtml(
              result.section_name || "Documentation"
            )}</small><p>${escapeHtml(
              result.snippet || result.description || ""
            )}</p></a>`;
          })
          .join("")
      : '<p class="empty-state">No articles matched your search.</p>';
  };

  const searchArticles = async (query) => {
    if (!searchResults || !query.trim()) {
      if (searchResults) searchResults.innerHTML = "";
      return;
    }
    searchResults.innerHTML = '<p class="empty-state">Searching…</p>';
    try {
      const payload = await getJson(
        `/api/v2/help_center/articles/search.json?query=${encodeURIComponent(
          query
        )}&locale=${encodeURIComponent(locale)}&per_page=10`
      );
      renderSearchResults(payload.results || []);
    } catch (error) {
      searchResults.innerHTML =
        '<p class="empty-state">Search is temporarily unavailable.</p>';
      console.warn(
        "Giotto search could not load Help Center data:",
        error.message
      );
    }
  };

  searchInput?.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(
      () => searchArticles(searchInput.value),
      220
    );
  });
  searchForm?.addEventListener("submit", (event) => {
    if (!searchInput?.value.trim()) {
      event.preventDefault();
      return;
    }
  });
});
