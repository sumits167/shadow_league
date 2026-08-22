

const RefreshTokenOptions={
    httpOnly: true,
    secure: true ,     // process.env.NODE_ENV === "production", // Only secure in production
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
}


export default RefreshTokenOptions;
