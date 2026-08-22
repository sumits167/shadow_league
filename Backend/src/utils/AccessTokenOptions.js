const AccessTokenOptions = {
    httpOnly: true,   // Prevents client-side JavaScript access
    secure: true,     // Ensures cookie is sent over HTTPS
    sameSite: "lax",  // Controls cross-site cookie behavior
    maxAge: 15 * 60 * 1000, // 15 min
};

export default AccessTokenOptions;