export default async function copyToClipboard(text) {
    try {
        console.log("Copying to clipboard:", text);
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    }
    catch (err) {
        console.error("Failed to copy: ", err);
        alert("Failed to copy to clipboard.");
    }
}