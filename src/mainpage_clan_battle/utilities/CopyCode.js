export default async function copyToClipboard(text, onSuccess, onError) {
    try {
        await navigator.clipboard.writeText(text);
        if (onSuccess) {
            onSuccess("User ID copied to clipboard!");
        }
    }
    catch (err) {
        console.error("Failed to copy: ", err);
        if (onError) {
            onError("Failed to copy to clipboard.");
        }
    }
}