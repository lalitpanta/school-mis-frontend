import { useAuthContext } from '../context/AuthContext';

/**
 * Convenience hook that exposes everything from AuthContext.
 * Use this hook in components instead of importing AuthContext directly.
 */
const useAuth = () => useAuthContext();

export default useAuth;
