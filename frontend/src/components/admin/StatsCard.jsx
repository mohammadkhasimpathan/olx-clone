/**
 * StatsCard component for displaying dashboard statistics.
 * Used in admin dashboard for key metrics.
 */
const StatsCard = ({ title, value, icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
                </div>
                <div className={`${colorClasses[color]} p-4 rounded-full text-white text-2xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
