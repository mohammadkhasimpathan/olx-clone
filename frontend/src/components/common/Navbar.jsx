import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-bold text-primary-600">
                        OLX Clone
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/listings/create" className="btn-primary">
                                    + Post Ad
                                </Link>
                                <Link to="/my-listings" className="text-gray-700 hover:text-primary-600">
                                    My Ads
                                </Link>
                                <Link to="/profile" className="text-gray-700 hover:text-primary-600">
                                    {user?.username}
                                </Link>
                                <button onClick={logout} className="btn-secondary">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 hover:text-primary-600">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-primary">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
