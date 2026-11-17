// Article enhancements for the Giotto documentation surface.

window.addEventListener("DOMContentLoaded", () => {
  const articleBody = document.querySelector(".article-body");
  const toc = document.querySelector("#article-toc-links");

  if (!articleBody) return;

  if (toc) {
    const headings = articleBody.querySelectorAll("h2, h3");
    const usedIds = new Set();

    headings.forEach((heading, index) => {
      const baseId =
        (heading.textContent || "section")
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
      link.textContent = heading.textContent.trim();
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

  articleBody.querySelectorAll("a[target='_blank']").forEach((anchor) => {
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
