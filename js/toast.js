export function showToast(message, type = "info") {
    // Determine class based on type
    let className = "toastify"; // Default class
    if (type === "success") className += " success";
    if (type === "error") className += " error";
    if (type === "warning") className += " warning"; // I can add warning style if needed

    Toastify({
        text: message,
        duration: 3000,
        gravity: "top", // `top` or `bottom`
        position: "center", // Centered is more elegant for alerts
        stopOnFocus: true, 
        className: className, // Use CSS class for styling
        onClick: function(){} 
    }).showToast();
}
