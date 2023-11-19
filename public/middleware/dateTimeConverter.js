"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndianTime = void 0;
function getIndianTime(date) {
    const currentTime = new Date(date);
    const utcOffsetInMinutes = 330; // Indian timezone offset is +5:30 (5 hours * 60 minutes + 30 minutes)
    const indianTime = new Date(currentTime.getTime() + utcOffsetInMinutes * 60 * 1000);
    return indianTime;
}
exports.getIndianTime = getIndianTime;
