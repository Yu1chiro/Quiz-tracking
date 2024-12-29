document.addEventListener("DOMContentLoaded", function () {
    const materiDiv = document.getElementById("mobile-first");

    function checkDevice() {
        if (window.innerWidth <= 760) {
            materiDiv.style.display = "block";
        } else {
            materiDiv.style.display = "block";
            materiDiv.textContent = "Access Denied ! please open quiz in mobile phone";
        }
    }

    checkDevice();

    window.addEventListener("resize", checkDevice);

    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        alert("Right-click is disabled.");
    });

    document.addEventListener("keydown", function (e) {
        if (
            (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "K")) || // Ctrl+Shift+I/J/K
            (e.ctrlKey && e.key === "U") // Ctrl+U
        ) {
            e.preventDefault();
        }
    });
});
