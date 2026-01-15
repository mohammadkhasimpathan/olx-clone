const TRUST_LEVELS = {
    new: {
        label: 'New User',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
        icon: '🆕'
    },
    basic: {
        label: 'Basic',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        icon: '✓'
    },
    trusted: {
        label: 'Trusted',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        icon: '✓✓'
    },
    verified: {
        label: 'Verified',
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-300',
        icon: '✓✓✓'
    },
    elite: {
        label: 'Elite',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        icon: '⭐'
    }
};

const TrustBadge = ({ trustLevel, score, size = 'md', showScore = false }) => {
    const level = TRUST_LEVELS[trustLevel] || TRUST_LEVELS.new;

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5'
    };

    return (
        <div className="inline-flex items-center gap-1.5">
            <span
                className={`
                    inline-flex items-center gap-1 rounded-full font-medium border
                    ${level.bgColor} ${level.textColor} ${level.borderColor}
                    ${sizes[size]}
                `}
                title={`Trust Score: ${score}/100`}
            >
                <span>{level.icon}</span>
                <span>{level.label}</span>
            </span>
            {showScore && (
                <span className="text-sm font-semibold text-gray-600">
                    {score}/100
                </span>
            )}
        </div>
    );
};

export default TrustBadge;
