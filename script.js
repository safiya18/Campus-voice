
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".announcement-grid");
    const searchInput = document.querySelector("#announcementSearch");
    const filterButtons = [...document.querySelectorAll(".category-btn")];
    const viewButtons = [...document.querySelectorAll(".view-btn")];
    const themeButton = document.querySelector(".theme-toggle");
    const newButton = document.querySelector(".new-announcement");
    const postCount = document.querySelector(".post-count");

    if (!grid) {
        console.error("Campus Voice: .announcement-grid was not found.");
        return;
    }

    const POSTS_KEY = "campusVoicePosts";
    const THEME_KEY = "campusVoiceTheme";

    let activeCategory = "all";
    let activeView = "all";

    // LOAD ORIGINAL POSTS

    function getOriginalPosts() {
        return [...grid.querySelectorAll(".announcement-card")].map(
            (card, index) => {
                const footer = card.querySelectorAll(".card-footer span");

                return {
                    id: "demo-" + index,
                    title: card.querySelector("h3")?.textContent.trim() || "",
                    description: card.querySelector(".card-description")?.textContent.trim() || "",
                    category: card.querySelector(".tag")?.textContent.trim().toLowerCase() || "academic",
                    date: footer[0]?.textContent.trim() || "",
                    time: footer[1]?.textContent.trim() || "",
                    expiryDate: "",
                    likes: 0,
                    liked: false,
                    saved: false,
                    views: 0,
                    order: index
                };
            }
        );
    }

    function loadPosts() {
        try {
            const saved = localStorage.getItem(POSTS_KEY);

            if (saved === null) return getOriginalPosts();

            const parsed = JSON.parse(saved);

            return Array.isArray(parsed) ? parsed : getOriginalPosts();
        } catch (error) {
            console.error("Could not load saved posts:", error);
            return getOriginalPosts();
        }
    }

    let posts = loadPosts().map((post, index) => ({
        id: String(post.id || "post-" + index),
        title: String(post.title || ""),
        description: String(post.description || ""),
        category: String(post.category || "academic").toLowerCase(),
        date: String(post.date || ""),
        time: String(post.time || ""),
        expiryDate: String(post.expiryDate || ""),
        likes: Math.max(0, Number(post.likes) || 0),
        liked: Boolean(post.liked),
        saved: Boolean(post.saved),
        views: Math.max(0, Number(post.views) || 0),
        order: Number.isFinite(Number(post.order)) ? Number(post.order) : index
    }));

    let nextOrder = Math.max(-1, ...posts.map(post => post.order)) + 1;

    function savePosts() {
        try {
            localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
        } catch (error) {
            console.error("Could not save posts:", error);
            alert("Your browser could not save the posts. Check your storage settings.");
        }
    }

    // HELPER FUNCTIONS

    function categoryClass(category) {
        return {
            academic: "academic",
            events: "event",
            placement: "placement"
        }[category] || "academic";
    }

    function isExpired(post) {
        if (!post.expiryDate) return false;

        const today = new Date();
        const todayString =
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        return post.expiryDate < todayString;
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);

        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;

        return node;
    }

    // SMART SEARCH

    function matchesSearch(post, searchText) {
        const query = searchText.trim().toLowerCase();

        if (!query) return true;

        const searchableText = [
            post.title,
            post.description,
            post.category,
            post.date,
            post.time
        ].join(" ").toLowerCase();

        if (searchableText.includes(query)) return true;

        const relatedKeywords = {
            "test": ["tests", "exam", "exams", "examination", "internal assessment", "internal exams", "mid semester", "mid-semester", "ia"],
            "tests": ["test", "exam", "exams", "examination", "internal assessment", "internal exams", "mid semester", "mid-semester", "ia"],
            "exam": ["test", "tests", "exams", "examination", "internal assessment", "internal exams", "mid semester", "mid-semester", "ia"],
            "exams": ["test", "tests", "exam", "examination", "internal assessment", "internal exams", "mid semester", "mid-semester", "ia"],
            "examination": ["test", "exam", "exams", "internal assessment", "internal exams", "mid semester", "mid-semester", "ia"],
            "internal assessment": ["test", "tests", "exam", "exams", "examination", "internal exams", "mid semester", "mid-semester", "ia"],
            "internal exams": ["test", "tests", "exam", "exams", "examination", "internal assessment", "mid semester", "mid-semester", "ia"],
            "mid semester": ["test", "exam", "examination", "internal assessment", "internal exams", "mid-semester", "ia"],
            "mid-semester": ["test", "exam", "examination", "internal assessment", "internal exams", "mid semester", "ia"],
            "ia": ["test", "exam", "examination", "internal assessment", "internal exams", "mid semester", "mid-semester"],
            "marks": ["results", "score", "grades"],
            "results": ["marks", "score", "grades"],
            "score": ["marks", "results", "grades"],
            "placement": ["job", "recruitment", "hiring", "company"],
            "job": ["placement", "recruitment", "hiring", "company"],
            "recruitment": ["placement", "job", "hiring", "company"],
            "event": ["fest", "workshop", "seminar", "competition"],
            "fest": ["event", "workshop", "seminar", "competition"],
            "workshop": ["event", "fest", "seminar", "competition"]
        };

        const relatedWords = relatedKeywords[query] || [];

        return relatedWords.some(word => searchableText.includes(word));
    }

    // CREATE ANNOUNCEMENT CARDS

    function createCard(post) {
        const card = element("article", "announcement-card");
        card.dataset.id = post.id;

        const top = element("div", "card-top");

        top.append(
            element("span", "tag " + categoryClass(post.category), post.category.toUpperCase()),
            element("span", "card-number", "CAMPUS POST")
        );

        const title = element("h3", "", post.title);
        const description = element("p", "card-description", post.description);

        const footer = element("div", "card-footer");

        footer.append(
            element("span", "", post.date),
            element("span", "", post.time)
        );

        const bottomLabels = {
            academic: "STAY PREPARED",
            events: "MARK YOUR CALENDAR",
            placement: "YOUR NEXT STEP"
        };

        const bottom = element(
            "div",
            "card-bottom " + categoryClass(post.category) + "-bottom"
        );

        bottom.append(
            element("span", "", bottomLabels[post.category] || "CAMPUS UPDATE"),
            element("span", "arrow", "↗")
        );

        card.append(top, title, description, footer, bottom);

        if (post.expiryDate) {
            card.appendChild(element("p", "expiry-label", "Expires: " + post.expiryDate));
        }

        if (isExpired(post)) {
            card.classList.add("expired-card");
            card.appendChild(element("span", "expired-notice", "EXPIRED"));
        }

        // LIKE BUTTON

        const actions = element("div", "post-actions");

        const likeButton = element("button", "like-button");
        likeButton.type = "button";
        likeButton.dataset.action = "like";
        likeButton.setAttribute("aria-pressed", String(post.liked));
        likeButton.classList.toggle("liked", post.liked);

        likeButton.append(
            document.createTextNode(post.liked ? "♥ " : "♡ "),
            element("span", "like-count", String(post.likes)),
            document.createTextNode(post.likes === 1 ? " Like" : " Likes")
        );

        // SAVE BUTTON

        const saveButton = element(
            "button",
            "bookmark-button",
            post.saved ? "★ Saved" : "☆ Save"
        );

        saveButton.type = "button";
        saveButton.dataset.action = "bookmark";
        saveButton.setAttribute("aria-pressed", String(post.saved));
        saveButton.classList.toggle("bookmarked", post.saved);

        // READ MORE BUTTON

        const readButton = element("button", "read-button", "Read more");
        readButton.type = "button";
        readButton.dataset.action = "read";

        const views = element("span", "post-stats", "↗ " + post.views + " views");

        actions.append(likeButton, saveButton, readButton, views);
        card.appendChild(actions);

        return card;
    }

    // SEARCH, FILTER AND TRENDING

    function updatePosts() {
        const keyword = searchInput ? searchInput.value : "";

        let result = posts.filter(post => {
            const matchesCategory =
                activeCategory === "all" ||
                post.category === activeCategory;

            const searchMatches = matchesSearch(post, keyword);
            const matchesSaved = activeView !== "saved" || post.saved;

            return matchesCategory && searchMatches && matchesSaved;
        });

        // TRENDING: only posts with likes, highest likes first

        if (activeView === "trending") {
            result = result.filter(post => post.likes > 0);

            result.sort((a, b) => {
                if (b.likes !== a.likes) {
                    return b.likes - a.likes;
                }

                return b.views - a.views;
            });
        }

        // Rebuild cards, including all action buttons

        grid.replaceChildren();

        result.forEach(post => {
            grid.appendChild(createCard(post));
        });

        if (postCount) {
            postCount.textContent =
                String(result.length).padStart(2, "0") + " POSTS";
        }
    }

    // CATEGORY FILTERS

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            const selectedCategory = button.textContent.trim().toLowerCase();

            activeCategory =
                selectedCategory === "all" ? "all" : selectedCategory;

            filterButtons.forEach(item => {
                const selected = item === button;

                item.classList.toggle("selected", selected);
                item.setAttribute("aria-pressed", String(selected));
            });

            updatePosts();
        });
    });

    // SEARCH INPUT

    if (searchInput) {
        searchInput.addEventListener("input", updatePosts);
    }

    // ALL / SAVED / TRENDING FILTERS

    viewButtons.forEach(button => {
        button.addEventListener("click", () => {
            activeView = button.dataset.view;

            viewButtons.forEach(item => {
                const selected = item === button;

                item.classList.toggle("selected", selected);
                item.setAttribute("aria-pressed", String(selected));
            });

            updatePosts();
        });
    });

    // LIKE, SAVE AND READ MORE ACTIONS

    grid.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const card = button.closest(".announcement-card");
        if (!card) return;

        const post = posts.find(item => item.id === card.dataset.id);
        if (!post) return;

        if (button.dataset.action === "like") {
            post.liked = !post.liked;

            post.likes = Math.max(
                0,
                post.likes + (post.liked ? 1 : -1)
            );
        }

        if (button.dataset.action === "bookmark") {
            post.saved = !post.saved;
        }

        if (button.dataset.action === "read") {
            post.views++;

            savePosts();
            updatePosts();

            alert(post.title + "\n\n" + post.description);
            return;
        }

        savePosts();
        updatePosts();
    });

    // ADD NEW ANNOUNCEMENT

    function openAnnouncementForm() {
        if (document.querySelector(".announcement-overlay")) return;

        const overlay = element("div", "announcement-overlay");
        const form = element("form", "announcement-form");

        const closeButton = element("button", "close-form", "×");
        closeButton.type = "button";

        form.append(
            closeButton,
            element("h2", "", "New Announcement"),
            element("p", "", "Share an update with your campus.")
        );

        function addField(labelText, name, type, placeholder, required = true) {
            const label = element("label", "", labelText);
            label.htmlFor = "field-" + name;

            const input = type === "textarea"
                ? document.createElement("textarea")
                : document.createElement("input");

            if (type === "textarea") {
                input.rows = 4;
            } else {
                input.type = type;
            }

            input.id = "field-" + name;
            input.name = name;
            input.placeholder = placeholder || "";
            input.required = required;

            form.append(label, input);

            return input;
        }

        addField("Announcement title", "title", "text", "Enter a title");
        addField("Description", "description", "textarea", "Write the details");

        const categoryLabel = element("label", "", "Category");
        categoryLabel.htmlFor = "field-category";

        const category = document.createElement("select");
        category.id = "field-category";
        category.name = "category";

        ["academic", "events", "placement"].forEach(value => {
            const option = document.createElement("option");

            option.value = value;
            option.textContent = value[0].toUpperCase() + value.slice(1);

            category.appendChild(option);
        });

        form.append(categoryLabel, category);

        const expiry = addField(
            "Expiry date (optional)",
            "expiryDate",
            "date",
            "",
            false
        );

        const buttons = element("div", "form-actions");

        const cancel = element("button", "cancel-form", "Cancel");
        cancel.type = "button";

        const publish = element("button", "publish-form", "Publish announcement");
        publish.type = "submit";

        buttons.append(cancel, publish);
        form.appendChild(buttons);

        overlay.appendChild(form);
        document.body.appendChild(overlay);

        function closeForm() {
            overlay.remove();
        }

        closeButton.addEventListener("click", closeForm);
        cancel.addEventListener("click", closeForm);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeForm();
        });

        form.addEventListener("submit", event => {
            event.preventDefault();

            const title = form.elements.title.value.trim();
            const description = form.elements.description.value.trim();

            if (!title || !description) return;

            const now = new Date();

            posts.push({
                id: "post-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
                title,
                description,
                category: category.value,
                date: now.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }),
                time: now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                expiryDate: expiry.value,
                likes: 0,
                liked: false,
                saved: false,
                views: 0,
                order: nextOrder++
            });

            activeCategory = "all";
            activeView = "all";

            if (searchInput) searchInput.value = "";

            filterButtons.forEach(button => {
                const selected =
                    button.textContent.trim().toLowerCase() === "all";

                button.classList.toggle("selected", selected);
                button.setAttribute("aria-pressed", String(selected));
            });

            viewButtons.forEach(button => {
                const selected = button.dataset.view === "all";

                button.classList.toggle("selected", selected);
                button.setAttribute("aria-pressed", String(selected));
            });

            savePosts();
            updatePosts();
            closeForm();
        });
    }

    if (newButton) {
        newButton.addEventListener("click", openAnnouncementForm);
    }

    // DARK AND LIGHT MODE

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark-mode", isDark);

        if (themeButton) {
            themeButton.textContent = isDark ? "☀ Light mode" : "☾ Dark mode";
            themeButton.setAttribute("aria-pressed", String(isDark));
        }

        try {
            localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
        } catch (error) {
            console.warn("Theme preference could not be saved.");
        }
    }

    let initialTheme = "light";

    try {
        initialTheme = localStorage.getItem(THEME_KEY) === "dark"
            ? "dark"
            : "light";
    } catch (error) {
        console.warn("Theme preference could not be loaded.");
    }

    applyTheme(initialTheme);

    if (themeButton) {
        themeButton.addEventListener("click", () => {
            const currentlyDark =
                document.body.classList.contains("dark-mode");

            applyTheme(currentlyDark ? "light" : "dark");
        });
    }

    // START APP

    savePosts();
    updatePosts();
});
