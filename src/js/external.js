document.addEventListener("DOMContentLoaded", () => {
    // --- DOM ELEMENT REFERENCES ---
    const mainAppContainer = document.getElementById("mainAppContainer");
    const authMessageContainer = document.getElementById("authMessageContainer");
    const navActions = document.getElementById("navActions");
    const recipeContainer = document.getElementById("recipeContainer");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const filterContainer = document.getElementById("filterContainer");
    const showMoreBtn = document.getElementById("showMoreBtn");
    const showMoreContainer = document.getElementById("showMoreContainer");
    const statusContainer = document.getElementById("statusContainer");

    // Modal elements
    const recipeModal = document.getElementById("recipeModal");
    const modalBody = document.getElementById("modalBody");
    const closeModalBtn = document.getElementById("closeModalBtn");

    // --- STATE MANAGEMENT ---
    let allRecipes = [];
    let filteredRecipes = [];
    let recipesPerPage = 8;
    let currentPage = 1;
    let debounceTimer;

    // --- API DETAILS ---
    const API_URL = "https://dummyjson.com/recipes";
    const USERS_API_URL = "https://dummyjson.com/users";

    const handleLogout = () => {
        localStorage.removeItem("firstName");
        window.location.href = "LoginPage.html";
    }

    const setupNavbar = (isLoggedIn, firstName) => {
        if (isLoggedIn) {
            navActions.innerHTML = `
                <span class="nav-welcome">Welcome, ${firstName}!</span>
                <button id="logoutBtn" class="nav-btn">Logout</button>
            `;
            document
                .getElementById("logoutBtn")
                .addEventListener("click", handleLogout);
        } else {
            navActions.innerHTML = `
                <a href="loginPage.html"><button class="nav-btn">Login</button></a>
            `;
        }
    };

    /**
     * Checks if the user is logged in by looking for 'firstName' in localStorage.
     * This function now controls whether the app loads or not.
     */
    const checkAuth = async () => {
        const userFirstName = localStorage.getItem("firstName");

        if (!userFirstName) {
            setupNavbar(false);
            displayLoginMessage();
            return;
        }

        try {
            const response = await fetch(USERS_API_URL);
            if (!response.ok) {
                throw new Error("Could not verify user.");
            }
            const data = await response.json();

            const isValidUser = data.users.some(
                (user) => user.firstName === userFirstName
            );

            if (isValidUser) {
                setupNavbar(true, userFirstName);
                mainAppContainer.classList.remove("app-hidden");
                fetchRecipes();
            } else {
                displayLoginMessage();
            }
        } catch (error) {
            console.error("Authentication check failed:", error);
            setupNavbar(false);
            displayLoginMessage();
        }
    };

    const displayLoginMessage = () => {
        mainAppContainer.style.display = "none";
        authMessageContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2>Access Denied</h2>
                <p>You must be logged in to view the recipes.</p>
                <p><a href="loginPage.html">Click here to go to the Login Page</a></p>
            </div>
        `;
    };

    // --- CORE FUNCTIONS ---

    const fetchRecipes = async () => {
        statusContainer.innerHTML = `<p class="loading-text">Loading recipes...</p>`;

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            allRecipes = data.recipes;
            filteredRecipes = [...allRecipes];

            populateFilters();
            renderInitialRecipes();

            statusContainer.innerHTML = "";
        } catch (error) {
            console.error("Failed to fetch recipes:", error);
            statusContainer.innerHTML = `<p class="error-text">Could not load recipes. Please try again later.</p>`;
            showMoreContainer.style.display = "none";
        }
    };

    const renderInitialRecipes = () => {
        currentPage = 1;
        recipeContainer.innerHTML = "";
        const recipesToDisplay = filteredRecipes.slice(0, recipesPerPage);
        appendRecipesToDOM(recipesToDisplay);
        updateShowMoreButton();
    };

    /**
     * @param {Array} recipes - The array of recipe objects to display.
     */
    const appendRecipesToDOM = (recipes) => {
        if (recipes.length === 0 && currentPage === 1) {
            recipeContainer.innerHTML = `<p class="no-results-text">No recipes found. Try a different search or filter.</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        recipes.forEach((recipe) => {
            const card = document.createElement("div");
            card.className = "recipe-card";
            card.dataset.id = recipe.id;

            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${recipe.image}" alt="${recipe.name}" class="card-image" loading="lazy">
                    <div class="card-rating">${recipe.rating} ★</div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${recipe.name}</h3>
                    <p class="card-category">${recipe.cuisine}</p>
                    <div class="card-info">
                        <span class="card-info-item">${recipe.difficulty}</span>
                        <span class="card-info-item">${recipe.cookTimeMinutes} min</span>
                    </div>
                    <button class="card-button">View Full Recipe</button>
                </div>
            `;
            fragment.appendChild(card);
        });
        recipeContainer.appendChild(fragment);
    };

    /**
     * Populates the filter buttons based on unique cuisines found in the recipes.
     */
    const populateFilters = () => {
        const cuisines = [
            "All",
            ...new Set(allRecipes.map((r) => r.cuisine).filter(Boolean)),
        ];
        filterContainer.innerHTML = cuisines
            .map(
                (cuisine) =>
                    `<button class="filter-btn ${
                        cuisine === "All" ? "filter-btn--active" : ""
                    }" data-cuisine="${cuisine}">
                ${cuisine}
            </button>`
            )
            .join("");
    };

    /**
     * Filters and searches recipes based on the current input and selected filter.
     */
    const applyFiltersAndSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const activeFilter = document.querySelector(
            ".filter-btn.filter-btn--active"
        );
        const selectedCuisine = activeFilter.dataset.cuisine;

        // Start with all recipes
        let tempRecipes = [...allRecipes];

        // Filter by cuisine if not 'All'
        if (selectedCuisine !== "All") {
            tempRecipes = tempRecipes.filter(
                (recipe) => recipe.cuisine === selectedCuisine
            );
        }

        // Filter by search term
        if (searchTerm) {
            tempRecipes = tempRecipes.filter(
                (recipe) =>
                    recipe.name.toLowerCase().includes(searchTerm) ||
                    recipe.ingredients.some((ing) =>
                        ing.toLowerCase().includes(searchTerm)
                    )
            );
        }

        filteredRecipes = tempRecipes;
        renderInitialRecipes();
    };

    /**
     * Shows or hides the "Show More" button based on whether there are more recipes to display.
     */
    const updateShowMoreButton = () => {
        if (recipeContainer.children.length < filteredRecipes.length) {
            showMoreContainer.style.display = "block";
        } else {
            showMoreContainer.style.display = "none";
        }
    };

    /**
     * @param {number} recipeId - The ID of the recipe to display.
     */
    const showRecipeModal = (recipeId) => {
        const recipe = allRecipes.find((r) => r.id === recipeId);
        if (!recipe) return;

        modalBody.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.name}" class="modal-image">
            <div class="modal-header">
                <h2 class="modal-title">${recipe.name}</h2>
                <div class="modal-meta">
                    <span class="meta-item"><strong>Cuisine:</strong> ${
                        recipe.cuisine
                    }</span>
                    <span class="meta-item"><strong>Difficulty:</strong> ${
                        recipe.difficulty
                    }</span>
                    <span class="meta-item"><strong>Time:</strong> ${
                        recipe.cookTimeMinutes
                    } mins</span>
                    <span class="meta-item"><strong>Servings:</strong> ${
                        recipe.servings
                    }</span>
                    <span class="meta-item"><strong>Rating:</strong> ${
                        recipe.rating
                    } (${recipe.reviewCount} reviews)</span>
                </div>
            </div>
            <div class="modal-details-grid">
                <div class="modal-ingredients">
                    <h3 class="modal-subtitle">Ingredients</h3>
                    <ul class="ingredients-list">
                        ${recipe.ingredients
                            .map((ing) => `<li>${ing}</li>`)
                            .join("")}
                    </ul>
                </div>
                <div class="modal-instructions">
                    <h3 class="modal-subtitle">Instructions</h3>
                    <ol class="instructions-list">
                        ${recipe.instructions
                            .map((step) => `<li>${step}</li>`)
                            .join("")}
                    </ol>
                </div>
            </div>
        `;
        recipeModal.classList.add("visible");
    };

    const hideRecipeModal = () => {
        recipeModal.classList.remove("visible");
        // Clear the modal body to free up memory.
        modalBody.innerHTML = "";
    };

    // --- EVENT LISTENERS ---

    // Real-time search with debouncing.
    searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        // Wait 300ms after the user stops typing before we search.
        debounceTimer = setTimeout(() => {
            applyFiltersAndSearch();
        }, 300);
    });

    // Search button click.
    searchBtn.addEventListener("click", () => {
        applyFiltersAndSearch();
    });

    // Filter buttons click handler.
    filterContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("filter-btn")) {
            document
                .querySelector(".filter-btn.filter-btn--active")
                .classList.remove("filter-btn--active");
            e.target.classList.add("filter-btn--active");
            applyFiltersAndSearch();
        }
    });

    // "Show More" button functionality.
    showMoreBtn.addEventListener("click", () => {
        currentPage++;
        const startIndex = (currentPage - 1) * recipesPerPage;
        const endIndex = startIndex + recipesPerPage;
        const nextPageRecipes = filteredRecipes.slice(startIndex, endIndex);

        appendRecipesToDOM(nextPageRecipes);
        updateShowMoreButton();
    });

    // "View Full Recipe" button delegation from the main container.
    recipeContainer.addEventListener("click", (e) => {
        // .closest() to find the parent recipe card from the clicked button.
        const card = e.target.closest(".recipe-card");
        if (card && e.target.classList.contains("card-button")) {
            const recipeId = parseInt(card.dataset.id, 10);
            showRecipeModal(recipeId);
        }
    });

    // Modal closing functionality.
    closeModalBtn.addEventListener("click", hideRecipeModal);
    // Also close the modal if the user clicks on the background overlay.
    recipeModal.addEventListener("click", (e) => {
        if (e.target === recipeModal) {
            hideRecipeModal();
        }
    });
    // Also close the modal if the user presses the Escape key.
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && recipeModal.classList.contains("visible")) {
            hideRecipeModal();
        }
    });

    // --- INITIALIZATION ---
    checkAuth();
});
