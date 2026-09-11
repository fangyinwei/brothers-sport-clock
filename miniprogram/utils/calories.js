"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCalories = calculateCalories;
const MET = {
    gym: 6,
    run: 9.8,
    basketball: 8,
    pilates: 3.5
};
function calculateCalories(input) {
    const weight = input.weight && input.weight > 0 ? input.weight : 65;
    const value = (MET[input.sport] * 3.5 * weight * Math.max(0, input.duration)) / 200;
    return Math.max(0, Math.round(value));
}
