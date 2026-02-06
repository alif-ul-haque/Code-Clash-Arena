const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export default function timeAgo(isoTime) {
    const diff = Date.now() - new Date(isoTime);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return rtf.format(-minutes, 'minute');
    if (hours < 24) return rtf.format(-hours, 'hour');
    return rtf.format(-days, 'day');
}