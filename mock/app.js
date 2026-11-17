 (async () => {
  async function loadData() {
    try {
      const response = await fetch("/api/zendesk-data");
      if (!response.ok) throw new Error(`Zendesk data request failed with ${response.status}`);
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.categories) || !Array.isArray(payload.sections) || !Array.isArray(payload.articles)) {
        throw new Error("Zendesk data response is incomplete");
      }
      return payload;
    } catch (error) {
      console.warn("Using local mock data:", error.message);
      return window.giottoMockData;
    }
  }

  const data = await loadData();
  const app = document.querySelector("#app");
  const sidebar = document.querySelector("#docs-sidebar");
  const sidebarNav = document.querySelector("#sidebar-nav");
  const searchDialog = document.querySelector("#search-dialog");
  const searchResults = document.querySelector("#search-results");
  const searchInputs = [...document.querySelectorAll("[data-search-input]")];

  const categoryById = new Map(data.categories.map((category) => [category.id, category]));
  const sectionById = new Map(data.sections.map((section) => [section.id, section]));
  const articleById = new Map(data.articles.map((article) => [article.id, article]));
  const openSectionsKey = "giotto-docs-open-sections-v2";

  const iconPaths = {
    search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
    menu: '<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>',
    x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    chevronDown: '<path d="m6 9 6 6 6-6"></path>',
    arrowLeft: '<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>',
    arrowRight: '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
    arrowUpRight: '<path d="M7 7h10v10"></path><path d="M7 17 17 7"></path>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
    check: '<path d="m20 6-11 11-5-5"></path>',
    share: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4"></path><path d="m15.4 6.5-6.8 4"></path>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
    thumbsUp: '<path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>',
    thumbsDown: '<path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>',
    messageCircle: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>',
  };

  function icon(name, className = "lucide-icon") {
    return `<svg class="${className}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ""}</svg>`;
  }

  const socialIconPaths = {
    facebook: '<path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.42c0-3.026 1.791-4.7 4.533-4.7 1.312 0 2.686.236 2.686.236v2.953h-1.514c-1.492 0-1.956.93-1.956 1.884v2.28h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"></path>',
    x: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.963 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"></path>',
    linkedin: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V8.999h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.287ZM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123ZM3.56 20.452h3.56V8.999H3.56v11.453ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0Z"></path>',
  };

  function socialIcon(name) {
    return `<svg class="social-icon social-icon-${name}" viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" aria-hidden="true">${socialIconPaths[name] || ""}</svg>`;
  }

  function hydrateIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((element) => {
      if (!element.hasChildNodes()) element.innerHTML = icon(element.dataset.icon);
    });
  }

  const escapeHtml = (value) =>
    value.replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);

  const categorySections = (categoryId) => data.sections.filter((section) => section.categoryId === categoryId);
  const sectionArticles = (sectionId) => data.articles.filter((article) => article.sectionId === sectionId);
  const articleCategory = (article) => categoryById.get(article.categoryId);
  const articleSection = (article) => sectionById.get(article.sectionId);

  function getOpenSections() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(openSectionsKey) || "null");
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  }

  function saveOpenSections(sections) {
    try {
      window.localStorage.setItem(openSectionsKey, JSON.stringify([...sections]));
    } catch {
      // Local persistence is optional in private browsing contexts.
    }
  }

  function collapseSidebarSections() {
    saveOpenSections(new Set());
    document.querySelectorAll("[data-section-toggle]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    document.querySelectorAll("[data-section-articles]").forEach((list) => { list.hidden = true; });
  }

  function renderSidebar() {
    const openSections = getOpenSections();
    sidebarNav.innerHTML = data.categories.map((category) => `
      <div class="nav-category" data-slot="sidebar-group-label">${category.name}</div>
      ${categorySections(category.id).map((section) => `
        <div class="nav-section" data-slot="sidebar-menu-item">
          <button class="nav-section-toggle" data-slot="button" data-section-toggle="${section.id}" aria-expanded="${openSections.has(section.id)}"><span class="nav-section-label">${section.name}</span><span class="nav-chevron" data-icon="chevronDown"></span></button>
          <div class="nav-articles" data-section-articles="${section.id}"${openSections.has(section.id) ? "" : " hidden"}>
            ${sectionArticles(section.id).map((article) => `<a class="nav-article" data-article-link="${article.id}" href="#/article/${article.id}">${article.title}</a>`).join("")}
          </div>
        </div>
      `).join("")}
    `).join("");
    hydrateIcons(sidebarNav);
  }

  function renderHome() {
    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Giotto documentation</p>
        <h1>Intelligence you control.</h1>
        <p>Build, deploy, and operate Giotto across cloud, API, on-premise infrastructure, and the ideas behind modern reasoning systems.</p>
        <form class="hero-search" data-slot="input-group" data-search-form>
          <label class="sr-only" for="hero-search-input">Search Giotto Docs</label>
          <input id="hero-search-input" data-slot="input" name="q" type="search" placeholder="Search Giotto Docs" autocomplete="off" />
          <span data-icon="search"></span>
        </form>
      </section>
      <section>
        <div class="section-heading"><h2>Explore the docs</h2></div>
        <div class="category-grid" data-slot="card-grid">
          ${data.categories.map((category) => {
            const count = categorySections(category.id).reduce((total, section) => total + section.articlesCount, 0);
            return `<a class="category-card" data-slot="card" href="#/category/${category.id}"><span class="card-eyebrow badge badge-secondary" data-slot="badge">${category.eyebrow}</span><h3>${category.name}</h3><p>${category.description}</p><span class="card-footer" data-slot="card-footer"><span>${count} articles</span><span data-icon="arrowRight"></span></span></a>`;
          }).join("")}
        </div>
        <div class="quick-links">
          <a class="quick-link" href="#/article/giotto-api-overview">API overview</a>
          <a class="quick-link" href="#/article/make-your-first-api-request-with-python">First Python request</a>
          <a class="quick-link" href="#/article/install-giotto">Install Giotto</a>
          <a class="quick-link" href="#/article/403-forbidden">Troubleshoot a 403</a>
        </div>
      </section>
    `;
    hydrateIcons(app);
    collapseSidebarSections();
    bindPageEvents();
  }

  function renderCategory(categoryId) {
    const category = categoryById.get(categoryId);
    if (!category) return renderHome();
    app.innerHTML = `
      <header class="page-intro"><p class="eyebrow">${category.eyebrow}</p><h1>${category.name}</h1><p>${category.description}</p></header>
      <div class="section-grid">
        ${categorySections(category.id).map((section) => `
          <section class="section-card" data-slot="card">
            <h2>${section.name}</h2>
            <p>${section.description}</p>
            <ul>${sectionArticles(section.id).slice(0, 4).map((article) => `<li><a href="#/article/${article.id}"><span>${article.title}</span><span data-icon="arrowUpRight"></span></a></li>`).join("")}</ul>
            ${section.articlesCount > 4 ? `<a class="quick-link" href="#/section/${section.id}">View all ${section.articlesCount} articles</a>` : ""}
          </section>
        `).join("")}
      </div>
    `;
    hydrateIcons(app);
    collapseSidebarSections();
    bindPageEvents();
  }

  function renderSection(sectionId) {
    const section = sectionById.get(sectionId);
    if (!section) return renderHome();
    const category = categoryById.get(section.categoryId);
    app.innerHTML = `
      <header class="page-intro"><p class="eyebrow">${category.name}</p><h1>${section.name}</h1><p>${section.description}</p></header>
      <div class="search-page"><div class="result-list" data-slot="item-group">${sectionArticles(section.id).map((article) => renderResult(article)).join("")}</div></div>
    `;
    hydrateIcons(app);
    bindPageEvents();
  }

  function renderResult(article) {
    const section = articleSection(article);
    return `<a class="result-item" data-slot="item" href="#/article/${article.id}"><h2>${article.title}</h2><small>${section.name}</small><p>${article.summary}</p></a>`;
  }

  function renderArticle(articleId) {
    const article = articleById.get(articleId);
    if (!article) return renderHome();
    const section = articleSection(article);
    const category = articleCategory(article);
    const headingLinks = buildHeadingLinks(article.headings);
    const relatedArticles = getRelatedArticles(article);
    const articleUrl = article.htmlUrl || `${window.location.origin}${window.location.pathname}#/article/${encodeURIComponent(article.id)}`;
    app.innerHTML = `
      <div class="article-layout">
        <article data-slot="card">
          <header class="article-header"><p class="eyebrow">${category.name} · ${section.name}</p><h1>${article.title}</h1><p class="article-summary">${article.summary}</p></header>
          <div class="article-body">${article.body}</div>
          <footer class="article-footer">
            <section class="related-articles" aria-labelledby="related-title">
              <div class="article-footer-heading"><span class="footer-icon" data-icon="arrowRight"></span><h2 id="related-title">Related articles</h2></div>
              <div class="related-article-list" data-related-for="${article.id}">${relatedArticles.length ? relatedArticles.map(renderRelatedArticle).join("") : '<p class="footer-empty">No related articles yet.</p>'}</div>
            </section>
            <section class="article-share" aria-labelledby="share-title">
              <div class="article-footer-heading"><span class="footer-icon" data-icon="share"></span><h2 id="share-title">Share this article</h2></div>
              <div class="article-share-links">
                <a class="share-link" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}" target="_blank" rel="noreferrer noopener">${socialIcon("facebook")}<span>Facebook</span></a>
                <a class="share-link" href="https://x.com/intent/post?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}" target="_blank" rel="noreferrer noopener">${socialIcon("x")}<span>X</span></a>
                <a class="share-link" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}" target="_blank" rel="noreferrer noopener">${socialIcon("linkedin")}<span>LinkedIn</span></a>
                <button class="footer-link-button" type="button" data-action="copy-article-link" data-article-url="${escapeHtml(articleUrl)}"><span data-icon="link"></span>Copy link</button>
              </div>
            </section>
            <section class="article-helpfulness" aria-labelledby="helpful-title" data-helpfulness="${article.id}" hidden>
              <div class="article-footer-heading"><span class="footer-icon" data-icon="messageCircle"></span><h2 id="helpful-title">Was this article helpful?</h2></div>
              <div class="helpful-actions"><button class="button button-secondary feedback-button" type="button" data-feedback="yes"><span data-icon="thumbsUp"></span>Yes</button><button class="button button-secondary feedback-button" type="button" data-feedback="no"><span data-icon="thumbsDown"></span>No</button></div>
              <p class="feedback-count">0 out of 0 found this helpful. Have more questions? <a href="https://docs.giotto.ai/hc/en-001/requests/new" target="_blank" rel="noreferrer noopener">Submit a request</a></p>
              <p class="feedback-status" data-feedback-status aria-live="polite"></p>
            </section>
            <section class="article-comments" aria-labelledby="comments-title" hidden>
              <div class="article-footer-heading"><span class="footer-icon" data-icon="messageCircle"></span><h2 id="comments-title">Comments</h2></div>
              <div class="comments-list" data-comments-for="${article.id}"><p class="footer-empty">Loading comments…</p></div>
              ${article.commentsDisabled ? "" : '<div class="comment-sign-in"><p>Sign in to leave a comment or ask a question.</p><button class="button button-secondary" type="button">Sign in to comment</button></div>'}
            </section>
          </footer>
        </article>
        <aside class="article-toc" aria-label="On this page"><div class="toc-label">On this page</div>${headingLinks.map(({ heading, id }) => `<a href="#${id}" data-toc-target="${id}">${heading}</a>`).join("")}</aside>
      </div>
    `;
    hydrateIcons(app);
    decorateCodeBlocks();
    decorateArticleLinks();
    bindFeedback(article.id);
    bindCopyArticleLink();
    loadArticleComments(article);
    bindPageEvents();
  }

  function slugify(value) {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  }

  function buildHeadingLinks(headings) {
    const counts = new Map();
    return headings.map((heading) => {
      const baseId = slugify(heading);
      const count = (counts.get(baseId) || 0) + 1;
      counts.set(baseId, count);
      return { heading, id: count === 1 ? baseId : `${baseId}-${count}` };
    });
  }

  function decorateArticleLinks() {
    document.querySelectorAll(".article-body a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!/^https?:\/\//i.test(href) || link.querySelector(".external-link-icon")) return;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
      link.insertAdjacentHTML("beforeend", `<span class="external-link-icon">${icon("arrowUpRight")}</span>`);
    });
  }

  function getRelatedArticles(article) {
    const related = data.articles
      .filter((item) => item.id !== article.id)
      .map((item, index) => {
        const sameSection = item.sectionId === article.sectionId;
        const sameCategory = item.categoryId === article.categoryId;
        const sourceWords = new Set(`${article.title} ${article.summary}`.toLowerCase().match(/[a-z0-9]{4,}/g) || []);
        const itemWords = new Set(`${item.title} ${item.summary}`.toLowerCase().match(/[a-z0-9]{4,}/g) || []);
        const overlap = [...sourceWords].filter((word) => itemWords.has(word)).length;
        return { item, score: (sameSection ? 20 : 0) + (sameCategory ? 8 : 0) + overlap * 3, index };
      })
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 5)
      .map(({ item }) => item);
    return related;
  }

  function renderRelatedArticle(article) {
    return `<a class="related-article" href="#/article/${encodeURIComponent(article.id)}"><span>${escapeHtml(article.title)}</span><span data-icon="arrowRight"></span></a>`;
  }

  function bindFeedback(articleId) {
    const container = document.querySelector(`[data-helpfulness="${articleId}"]`);
    if (!container) return;
    const buttons = [...container.querySelectorAll("[data-feedback]")];
    const status = container.querySelector("[data-feedback-status]");
    let saved = null;
    try { saved = window.localStorage.getItem(`giotto-feedback-${articleId}`); } catch { /* optional */ }
    buttons.forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.feedback === saved);
      button.addEventListener("click", () => {
        const value = button.dataset.feedback;
        buttons.forEach((item) => item.classList.toggle("is-selected", item === button));
        status.textContent = value === "yes" ? "Thanks for your feedback." : "Thanks — we’ll use this to improve the docs.";
        try { window.localStorage.setItem(`giotto-feedback-${articleId}`, value); } catch { /* optional */ }
      });
    });
  }

  function bindCopyArticleLink() {
    document.querySelectorAll("[data-action=copy-article-link]").forEach((button) => {
      button.addEventListener("click", async () => {
        const url = button.dataset.articleUrl || window.location.href;
        try { await navigator.clipboard?.writeText(url); } catch { /* clipboard can be unavailable locally */ }
        button.innerHTML = `${icon("check")}Copied`;
        window.setTimeout(() => { button.innerHTML = `${icon("link")}Copy link`; }, 1400);
      });
    });
  }

  function formatCommentDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
  }

  async function loadArticleComments(article) {
    const target = document.querySelector(`[data-comments-for="${article.id}"]`);
    if (!target) return;
    if (article.commentsDisabled) {
      target.innerHTML = '<p class="footer-empty">0 comments</p><p class="footer-empty">Article is closed for comments.</p>';
      return;
    }
    if (!article.sourceId) {
      target.innerHTML = '<p class="footer-empty">No comments yet.</p>';
      return;
    }
    try {
      const response = await fetch(`/api/zendesk-comments/${encodeURIComponent(article.sourceId)}`);
      if (!response.ok) throw new Error(`Comments request failed with ${response.status}`);
      const payload = await response.json();
      target.innerHTML = payload.comments?.length
        ? payload.comments.map((comment) => `<article class="comment"><div class="comment-meta"><strong>${escapeHtml(comment.author)}</strong><time datetime="${escapeHtml(comment.createdAt || "")}">${formatCommentDate(comment.createdAt)}</time></div><p>${escapeHtml(comment.body)}</p></article>`).join("")
        : '<p class="footer-empty">No comments yet.</p>';
    } catch (error) {
      console.warn("Comments unavailable:", error.message);
      target.innerHTML = '<p class="footer-empty">Comments are not available in this preview.</p>';
    }
  }

  function renderSearch(query, target = searchResults) {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? data.articles.filter((article) => `${article.title} ${article.summary} ${article.body}`.toLowerCase().includes(normalized))
      : data.articles.slice(0, 8);
    target.innerHTML = matches.length ? matches.map(renderResult).join("") : '<div class="empty-state">No local articles matched that search.</div>';
  }

  function renderSearchPage(query) {
    app.innerHTML = `<div class="search-page"><p class="eyebrow">Search</p><h1>Search results</h1><input id="page-search-input" data-slot="input" type="search" value="${escapeHtml(query)}" placeholder="Search Giotto Docs" /><div id="page-search-results" class="result-list" data-slot="item-group"></div></div>`;
    renderSearch(query, document.querySelector("#page-search-results"));
    collapseSidebarSections();
    const input = document.querySelector("#page-search-input");
    input.addEventListener("input", () => renderSearch(input.value, document.querySelector("#page-search-results")));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        window.location.hash = `#/search?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
    hydrateIcons(app);
  }

  function navigate() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    const [path, queryString = ""] = hash.split("?");
    const [route, ...parts] = path.split("/");
    const params = new URLSearchParams(queryString);
    if (!route) return renderHome();
    if (route === "category") return renderCategory(parts[0]);
    if (route === "section") return renderSection(parts[0]);
    if (route === "article") return renderArticle(parts.join("/"));
    if (route === "search") return renderSearchPage(params.get("q") || "");
    return renderHome();
  }

  function openSearch() {
    searchDialog.hidden = false;
    document.body.classList.add("search-open");
    const input = document.querySelector("#dialog-search-input");
    input.value = "";
    renderSearch("");
    input.focus();
  }

  function closeSearch() {
    searchDialog.hidden = true;
    document.body.classList.remove("search-open");
  }
  function closeSidebar() { sidebar.classList.remove("is-open"); }

  function toggleSidebarSection(button) {
    const list = document.querySelector(`[data-section-articles="${button.dataset.sectionToggle}"]`);
    if (!list) return;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    list.hidden = expanded;
    const openSections = getOpenSections();
    if (expanded) openSections.delete(button.dataset.sectionToggle);
    else openSections.add(button.dataset.sectionToggle);
    saveOpenSections(openSections);
  }

  function decorateCodeBlocks() {
    document.querySelectorAll(".article-body pre").forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      wrapper.dataset.slot = "card";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      const copyButton = document.createElement("button");
      copyButton.className = "code-copy button button-ghost button-small";
      copyButton.dataset.action = "copy-code";
      copyButton.dataset.copyCode = pre.textContent;
      copyButton.dataset.slot = "button";
      copyButton.type = "button";
      copyButton.innerHTML = `${icon("copy")}<span>Copy</span>`;
      copyButton.setAttribute("aria-label", "Copy code block");
      wrapper.appendChild(copyButton);
    });
  }

  function updateSidebarState() {
    const currentHash = window.location.hash;
    const articleMatch = currentHash.match(/^#\/?article\/(.+)$/);
    const currentArticle = articleMatch ? articleById.get(articleMatch[1]) : null;
    const currentSectionId = currentArticle?.sectionId || currentHash.match(/^#\/?section\/([^?]+)/)?.[1];
    if (currentSectionId) {
      const openSections = getOpenSections();
      if (!openSections.has(currentSectionId)) {
        openSections.add(currentSectionId);
        saveOpenSections(openSections);
      }
      const currentToggle = document.querySelector(`[data-section-toggle="${currentSectionId}"]`);
      const currentList = document.querySelector(`[data-section-articles="${currentSectionId}"]`);
      currentToggle?.setAttribute("aria-expanded", "true");
      if (currentList) currentList.hidden = false;
    }
    document.querySelectorAll(".nav-article").forEach((link) => {
      link.classList.toggle("is-active", currentArticle ? link.dataset.articleLink === currentArticle.id : false);
    });
    document.querySelectorAll("[data-section-toggle]").forEach((button) => {
      button.classList.toggle("is-current", button.dataset.sectionToggle === currentSectionId);
    });
  }

  function bindPageEvents() {
    document.querySelectorAll("[data-action=copy-code]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard?.writeText(button.dataset.copyCode || "");
        } catch {
          // Clipboard access can be denied in a local or private browser context.
        }
        button.innerHTML = `${icon("check")}<span>Copied</span>`;
        button.setAttribute("aria-label", "Code copied");
        window.setTimeout(() => { button.innerHTML = `${icon("copy")}<span>Copy</span>`; }, 1200);
        window.setTimeout(() => { button.setAttribute("aria-label", "Copy code block"); }, 1200);
      });
    });
    document.querySelectorAll("[data-search-form]").forEach((form) => form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = new FormData(form).get("q");
      window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
    }));
    updateSidebarState();
  }

  document.addEventListener("click", (event) => {
    const tocLink = event.target.closest("[data-toc-target]");
    if (tocLink) {
      event.preventDefault();
      document.getElementById(tocLink.dataset.tocTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const sectionToggle = event.target.closest("[data-section-toggle]");
    if (sectionToggle) toggleSidebarSection(sectionToggle);

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "open-search") openSearch();
    if (action === "close-search") closeSearch();
    if (action === "open-sidebar") sidebar.classList.add("is-open");
    if (action === "close-sidebar") closeSidebar();
    if (event.target.closest(".nav-article, .category-card, .result-item, .quick-link")) {
      closeSidebar();
      closeSearch();
    }
  });

  searchInputs.forEach((input) => input.addEventListener("input", () => {
    renderSearch(input.value);
    searchInputs.filter((other) => other !== input).forEach((other) => { other.value = input.value; });
  }));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape") {
      closeSearch();
      closeSidebar();
    }
  });
  window.addEventListener("hashchange", navigate);

  renderSidebar();
  hydrateIcons();
  navigate();
})();
