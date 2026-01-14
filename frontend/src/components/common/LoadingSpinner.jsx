import { useUI } from '../../context/UIContext';

const LoadingSpinner = () => {
    const { loading } = useUI();

    if (!loading) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
                <p className="mt-4 text-gray-700 font-medium">Loading...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
