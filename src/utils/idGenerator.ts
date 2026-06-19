import { customAlphabet } from 'nanoid';

const safeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

const carId = customAlphabet(safeAlphabet, 8);
const clientId = customAlphabet(safeAlphabet, 8);
const reservationId = customAlphabet(safeAlphabet, 10);

export const generateCarId = () => `CAR-${carId()}`;
export const generateClientId = () => `CLI-${clientId()}`;
export const generateReservationId = () => `RES-${reservationId()}`;
const violationId = customAlphabet(safeAlphabet, 8);
export const generateViolationId = () => `VIO-${violationId()}`;
