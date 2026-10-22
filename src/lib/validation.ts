/** Same rules as the partner API (partners-api src/routes/me.ts), so the app never accepts what the server rejects. */
export const UPI_ID = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
export const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
