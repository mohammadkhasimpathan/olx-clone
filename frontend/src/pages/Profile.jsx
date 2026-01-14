import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();

    if (!user) return <div className="container mx-auto px-4 py-8">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto card p-8">
                <h1 className="text-3xl font-bold mb-6">My Profile</h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-600 mb-1">Username</label>
                        <p className="font-semibold">{user.username}</p>
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1">Email</label>
                        <p className="font-semibold">{user.email}</p>
                    </div>

                    {user.phone_number && (
                        <div>
                            <label className="block text-gray-600 mb-1">Phone</label>
                            <p className="font-semibold">{user.phone_number}</p>
                        </div>
                    )}

                    {user.location && (
                        <div>
                            <label className="block text-gray-600 mb-1">Location</label>
                            <p className="font-semibold">{user.location}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
