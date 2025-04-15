/**
 * Shared types and utilities for salon booking system
 */
export declare enum UserRole {
    Admin = "admin",
    Employee = "employee",
    Client = "client"
}
export declare enum AppointmentStatus {
    Pending = "pending",
    Completed = "completed",
    Cancelled = "cancelled"
}
export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
}
export interface Appointment {
    id: number;
    client_id: number;
    employee_id: number;
    salon_id: number;
    service_id: number;
    date_time: string;
    status: AppointmentStatus;
    notes?: string;
}
export declare const isAdmin: (user: User) => boolean;
export declare const isEmployee: (user: User) => boolean;
export declare const isClient: (user: User) => boolean;
