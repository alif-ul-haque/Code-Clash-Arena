import '../style/XpBar.css'


export default function XpBar({ xp, maxXp, username }) {
    const percent = Math.min((xp / maxXp) * 100, 100);

    return (
        <div className="xp-wrapper">
            <p className="xp-label">{username}</p>
            <div className="xp-bar">
                <div
                    className="xp-fill"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}