(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Collapsible elements track their expanded state on the toggle button only;
  // aria-expanded is not valid on the wrapping div/nav, so a class is used for styling
  function toggleCollapsible(toggle, element) {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", !isExpanded);
    element.classList.toggle("expanded", !isExpanded);
  }

  function closeCollapsible(toggle, element) {
    toggle.setAttribute("aria-expanded", false);
    element.classList.remove("expanded");
    toggle.focus();
  }

  // Navigation

  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    if (menuButton && menuList) {
      menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleNavigation(menuButton, menuList);
      });

      menuList.addEventListener("keyup", (event) => {
        if (event.keyCode === ESCAPE) {
          event.stopPropagation();
          closeNavigation(menuButton, menuList);
        }
      });
    }

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      element.addEventListener("click", () => {
        toggleCollapsible(toggle, element);
      });

      element.addEventListener("keyup", (event) => {
        console.log("escape");
        if (event.keyCode === ESCAPE) {
          closeCollapsible(toggle, element);
        }
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

        // Add event handler for click
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    if (!this.toggle.hasAttribute("aria-haspopup")) {
      this.toggle.setAttribute("aria-haspopup", "true");
    }

    if (!this.toggle.hasAttribute("aria-expanded")) {
      this.toggle.setAttribute("aria-expanded", "false");
    }

    this.toggleIcon = this.toggle.querySelector(".dropdown-chevron-icon");
    if (this.toggleIcon) {
      this.toggleIcon.setAttribute("aria-hidden", "true");
    }

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", "false");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", "true");
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;

      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();

      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      // look up starting from current index
      let index = itemChars.indexOf(char, startIndex);

      // if not found, start from start
      if (index === -1) {
        index = itemChars.indexOf(char, 0);
      }

      if (index > -1) {
        this.focusByIndex(index);
      }
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;

      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusLastMenuItem();
          break;
        }
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (key) {
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home":
        case "PageUp": {
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End":
        case "PageDown": {
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Drodowns

  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share

  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Article enhancements for the Giotto documentation surface.

  window.addEventListener("DOMContentLoaded", () => {
    const articleBody = document.querySelector(".article-body");
    const toc = document.querySelector("#article-toc-links");

    if (!articleBody) return;

    const summary = document.querySelector(".article-summary");
    const firstParagraph = articleBody.querySelector("p");

    if (summary && firstParagraph) {
      const text = (firstParagraph.textContent || "").replace(/\s+/g, " ").trim();
      const maxLength = 240;

      if (text) {
        if (text.length <= maxLength) {
          summary.textContent = text;
        } else {
          const truncated = text
            .slice(0, maxLength)
            .replace(/\s+\S*$/, "")
            .trim();
          summary.textContent = `${truncated}…`;
        }
      }
    }

    if (toc) {
      const headings = articleBody.querySelectorAll("h2, h3");
      const usedIds = new Set();

      headings.forEach((heading, index) => {
        const headingText = (heading.textContent || "").trim();
        if (
          !headingText ||
          /^\d+$/.test(headingText) ||
          /^(?:https?:\/\/)?[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(headingText)
        ) {
          return;
        }

        const baseId =
          headingText
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || `section-${index + 1}`;
        let id = baseId;
        let suffix = 2;

        while (usedIds.has(id) || document.getElementById(id)) {
          id = `${baseId}-${suffix}`;
          suffix += 1;
        }

        usedIds.add(id);
        heading.id = heading.id || id;

        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = headingText;
        link.className = `toc-level-${heading.tagName === "H3" ? "3" : "2"}`;
        toc.appendChild(link);
      });

      const tocAside = toc.closest(".article-toc");
      if (tocAside && !toc.children.length) tocAside.hidden = true;
    }

    articleBody.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-code-button")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code-button";
      button.textContent = "Copy";
      button.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent || pre.textContent;

        try {
          await navigator.clipboard.writeText(code);
          button.textContent = "Copied";
        } catch (error) {
          button.textContent = "Copy failed";
        }

        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1600);
      });
      pre.appendChild(button);
    });

    articleBody.querySelectorAll("a[href]").forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;
      let isExternal = false;

      try {
        isExternal =
          new URL(href, window.location.href).origin !== window.location.origin;
      } catch {
        isExternal = false;
      }

      if (!isExternal) return;
      anchor.target = "_blank";
      anchor.rel = "noreferrer noopener";
      if (anchor.querySelector("svg")) return;

      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "2");
      icon.setAttribute("stroke-linecap", "round");
      icon.setAttribute("stroke-linejoin", "round");
      icon.setAttribute("aria-hidden", "true");
      icon.classList.add("external-link-icon");
      icon.innerHTML =
        '<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>';
      anchor.appendChild(icon);
    });

    const articleUrl = window.location.href;
    const articleTitle =
      document.querySelector(".article-title")?.textContent.trim() ||
      document.title;
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      articleUrl
    )}`,
      x: `https://x.com/intent/post?text=${encodeURIComponent(
      articleTitle
    )}&url=${encodeURIComponent(articleUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      articleUrl
    )}`,
    };

    document.querySelectorAll("[data-share-network]").forEach((link) => {
      const url = shareUrls[link.dataset.shareNetwork];
      if (url) link.href = url;
    });

    document
      .querySelectorAll("[data-action='copy-article-link']")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const label = button.querySelector("span");
          try {
            await navigator.clipboard.writeText(articleUrl);
            if (label) label.textContent = "Copied";
          } catch (error) {
            if (label) label.textContent = "Copy failed";
          }
          window.setTimeout(() => {
            if (label) label.textContent = "Copy link";
          }, 1600);
        });
      });
  });

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
    const removeLinks = () => {
      document.querySelectorAll("a[href*='poweredbyzendesk']").forEach((link) => {
        const wrapper = link.closest("footer") || link.parentElement;
        if (wrapper && wrapper !== document.body) wrapper.remove();
        else link.remove();
      });
    };

    removeLinks();
    if (!document.body) return;
    const observer = new MutationObserver(removeLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
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

  // Vanilla JS debounce function, by Josh W. Comeau:
  // https://www.joshwcomeau.com/snippets/javascript/debounce/
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Define variables for search field
  let searchFormFilledClassName = "search-has-value";
  // The global docs dialog has its own async search and must not receive the
  // legacy Copenhagen clear-button enhancement. That enhancement assumes a
  // `.search` wrapper and otherwise renders a stray button below the input.
  let searchFormSelector = "form[role='search']:not(#global-search-form)";

  // Clear the search input, and then return focus to it
  function clearSearchInput(event) {
    event.target
      .closest(searchFormSelector)
      .classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    input.value = "";
    input.focus();
  }

  // Have the search input and clear button respond
  // when someone presses the escape key, per:
  // https://twitter.com/adambsilver/status/1152452833234554880
  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  // Create an HTML button that all users -- especially keyboard users --
  // can interact with, to clear the search input.
  // To learn more about this, see:
  // https://adrianroselli.com/2019/07/ignore-typesearch.html#Delete
  // https://www.scottohara.me/blog/2022/02/19/custom-clear-buttons.html
  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized;
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  // Append the clear button to the search form
  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  // Add a class to the search form when the input has a value;
  // Remove that class from the search form when the input doesn't have a value.
  // Do this on a delay, rather than on every keystroke.
  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(
      searchFormFilledClassName,
      event.target.value.length > 0
    );
  }, 200);

  // Search

  window.addEventListener("DOMContentLoaded", () => {
    // Set up clear functionality for the search field
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });
  });

  const key = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms

  window.addEventListener("DOMContentLoaded", () => {
    // In some cases we should preserve focus after page reload
    returnFocus();

    // show form controls when the textarea receives focus or back button is used and value exists
    const commentContainerTextarea = document.querySelector(
      ".comment-container textarea"
    );
    const commentContainerFormControls = document.querySelector(
      ".comment-form-controls, .comment-ccs"
    );

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener(
        "focus",
        function focusCommentContainerTextarea() {
          commentContainerFormControls.style.display = "block";
          commentContainerTextarea.removeEventListener(
            "focus",
            focusCommentContainerTextarea
          );
        }
      );

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    // Expand Request comment form when Add to conversation is clicked
    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        requestCommentSubmit.style.display = "inline-block";

        if (commentContainerTextarea) {
          commentContainerTextarea.focus();
        }
      });
    }

    // Mark as solved button
    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    // Change Mark as solved text according to whether comment is filled
    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    const usesWysiwyg =
      requestCommentTextarea &&
      requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) {
      return s.trim() === "";
    }

    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }

    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute(
                "data-solve-and-submit-translation"
              );
          }
        }
      });
    }

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );

    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    // Submit requests filter form on search in the request list page
    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    // Submit organization form in the request page
    const requestOrganisationSelect = document.querySelector(
      "#request-organization select"
    );

    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });

      requestOrganisationSelect.addEventListener("click", (e) => {
        // Prevents Ticket details collapsible-sidebar to close on mobile
        e.stopPropagation();
      });
    }

    // If there are any error notifications below an input field, focus that field
    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

})();
