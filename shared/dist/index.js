"use strict";
/**
 * Shared types and utilities for salon booking system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClient = exports.isEmployee = exports.isAdmin = exports.AppointmentStatus = exports.UserRole = void 0;
// Common enums
var UserRole;
(function (UserRole) {
    UserRole["Admin"] = "admin";
    UserRole["Employee"] = "employee";
    UserRole["Client"] = "client";
})(UserRole || (exports.UserRole = UserRole = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["Pending"] = "pending";
    AppointmentStatus["Completed"] = "completed";
    AppointmentStatus["Cancelled"] = "cancelled";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
// Type guards
const isAdmin = (user) => user.role === UserRole.Admin;
exports.isAdmin = isAdmin;
const isEmployee = (user) => user.role === UserRole.Employee;
exports.isEmployee = isEmployee;
const isClient = (user) => user.role === UserRole.Client;
exports.isClient = isClient;
