(() => {
  const grid = document.getElementById("project-grid");
  if (!grid) return;

  const username = grid.dataset.githubUser || "amuellerbaumgart-source";
  const exclude = new Set(
    (grid.dataset.exclude || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  );
  const repoLimit = 3;

  const formatTitle = (name) =>
    name
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const truncate = (text, max = 180) => {
    if (!text) return "Explore the repository on GitHub for details and code.";
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trimEnd()}…`;
  };

  const renderStatus = (message, isError = false) => {
    grid.innerHTML = `
      <div class="project-status${isError ? " is-error" : ""}" role="status">
        <p>${escapeHtml(message)}</p>
        <a class="text-link project-profile-link" href="https://github.com/${escapeHtml(username)}" target="_blank" rel="noreferrer">
          View GitHub profile
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 13 13 7M8 7h5v5"/></svg>
        </a>
      </div>
    `;
  };

  const renderRepos = (repos) => {
    grid.innerHTML = repos
      .map((repo, index) => {
        const number = String(index + 1).padStart(2, "0");
        const featuredClass = index === 0 ? " featured" : "";
        const language = repo.language || "GitHub";
        const updated = formatDate(repo.pushed_at || repo.updated_at);
        const description = truncate(repo.description);
        const title = formatTitle(repo.name);

        return `
          <article class="project-card${featuredClass}">
            <div class="project-number">${number}</div>
            <div class="project-content">
              <div class="project-meta">
                <span>${escapeHtml(language)}</span>
                ${updated ? `<span>Updated ${escapeHtml(updated)}</span>` : ""}
              </div>
              <h3>
                <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
                  ${escapeHtml(title)}
                </a>
              </h3>
              <p>${escapeHtml(description)}</p>
              <div class="project-footer">
                <div class="tags tags-dark">
                  <span>${escapeHtml(language)}</span>
                  ${repo.stargazers_count > 0 ? `<span>★ ${repo.stargazers_count}</span>` : ""}
                </div>
                <a class="text-link project-repo-link" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
                  View repo
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 13 13 7M8 7h5v5"/></svg>
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const loadProjects = async () => {
    const endpoint =
      `https://api.github.com/users/${encodeURIComponent(username)}/repos` +
      `?sort=pushed&direction=desc&per_page=30`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      const repos = await response.json();
      const selected = repos
        .filter((repo) => !repo.archived)
        .filter((repo) => !exclude.has(repo.name))
        .slice(0, repoLimit);

      if (!selected.length) {
        renderStatus("No public projects were found yet.");
        return;
      }

      renderRepos(selected);
    } catch (error) {
      console.error(error);
      renderStatus("Couldn't load projects right now. You can still browse them on GitHub.", true);
    }
  };

  loadProjects();
})();
