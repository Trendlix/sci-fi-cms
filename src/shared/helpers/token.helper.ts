import { jwtDecode } from "jwt-decode";

const decodeToken = (token: string) => {
    const decoded = jwtDecode(token);
    return decoded;
}

export const verifyToken = (token: string) => {
    const decoded = decodeToken(token);
    if (!decoded) {
        return false;
    }
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return false;
    }
    return true;
}

export default decodeToken;