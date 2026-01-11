export function showToast(message, type = "info") {
    let bg = "#3b82f6"; // blue-500 default
    if (type === "success") bg = "#10b981"; // green-500
    if (type === "error") bg = "#ef4444"; // red-500
    if (type === "warning") bg = "#f59e0b"; // amber-500

    Toastify({
        text: message,
        duration: 3000,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: bg,
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            padding: "12px 24px"
        },
        onClick: function(){} // Callback after click
    }).showToast();
}
