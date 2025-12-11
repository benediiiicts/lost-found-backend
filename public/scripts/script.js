function searchBarang(){
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const filterType = document.getElementById("filterType").value;
    const items = document.querySelectorAll("#itemsContainer .card");

    items.forEach(card => {
        const namaBarang = card.querySelector("h3").textContent.toLowerCase();
        const tipeLaporan = card.querySelector(".type").textContent.toLowerCase();

        let matchName = namaBarang.includes(searchInput);
        let matchType =
            filterType === "all" ||
            (filterType === "lost" && tipeLaporan.includes("kehilangan")) ||
            (filterType === "found" && tipeLaporan.includes("ditemukan"));

        card.style.display = (matchName && matchType) ? "block" : "none";
    });
}

document.getElementById("searchInput").addEventListener("keyup", searchBarang);
document.getElementById("filterType").addEventListener("change", searchBarang);