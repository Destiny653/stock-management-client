"use client";

import { useState } from "react";

type Role = "owner" | "admin" | "manager" | "staff" | "viewer";
type Status = "active" | "inactive" | "suspended" | "pending";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    status: Status;
    lastLogin: string;
    createdAt: string;
    warehouseAccess: string[];
    permissions: string[];
}

export default function OrganizationMembers() {
    const [members, setMembers] = useState<Member[]>([
        {
            id: "1",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@acme.com",
            role: "owner",
            status: "active",
            lastLogin: "2024-12-03T14:30:00Z",
            createdAt: "2024-01-01T00:00:00Z",
            warehouseAccess: [],
            permissions: [
                "manage_organization",
                "manage_users",
                "manage_settings",
                "view_inventory",
                "edit_inventory",
            ],
        },
        {
            id: "2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@acme.com",
            role: "admin",
            status: "active",
            lastLogin: "2024-12-04T09:15:00Z",
            createdAt: "2024-01-15T00:00:00Z",
            warehouseAccess: [],
            permissions: [
                "view_inventory",
                "edit_inventory",
                "create_purchase_orders",
                "view_reports",
            ],
        },
        {
            id: "3",
            firstName: "Bob",
            lastName: "Johnson",
            email: "bob.johnson@acme.com",
            role: "manager",
            status: "active",
            lastLogin: "2024-12-02T16:45:00Z",
            createdAt: "2024-02-01T00:00:00Z",
            warehouseAccess: ["WH-001"],
            permissions: ["view_inventory", "create_sales", "view_reports"],
        },
    ]);

    const [showInviteModal, setShowInviteModal] = useState(false);

    const roleBadgeColors = {
        owner: "bg-purple-100 text-purple-800",
        admin: "bg-blue-100 text-blue-800",
        manager: "bg-green-100 text-green-800",
        staff: "bg-yellow-100 text-yellow-800",
        viewer: "bg-gray-100 text-gray-800",
    };

    const statusBadgeColors = {
        active: "bg-green-100 text-green-800",
        inactive: "bg-gray-100 text-gray-800",
        suspended: "bg-red-100 text-red-800",
        pending: "bg-yellow-100 text-yellow-800",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Organization Members
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage team members and their permissions
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Invite Member
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{members.length}</p>
                        <p className="text-sm text-gray-600 mt-1">Total Members</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                            {members.filter((m) => m.status === "active").length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Active</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600">
                            {members.filter((m) => m.status === "pending").length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Pending</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">
                            {members.filter((m) => m.role === "admin").length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Admins</p>
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Member
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Permissions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Login
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-600 font-medium">
                                                {member.firstName[0]}
                                                {member.lastName[0]}
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {member.firstName} {member.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${roleBadgeColors[member.role]
                                            } capitalize`}
                                    >
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeColors[member.status]
                                            } capitalize`}
                                    >
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">
                                        {member.permissions.length} permissions
                                        <div className="text-xs text-gray-400 mt-1">
                                            {member.warehouseAccess.length > 0
                                                ? `${member.warehouseAccess.length} warehouse(s)`
                                                : "All warehouses"}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {member.lastLogin
                                        ? new Date(member.lastLogin).toLocaleDateString()
                                        : "Never"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900">
                                            Edit
                                        </button>
                                        {member.role !== "owner" && (
                                            <button className="text-red-600 hover:text-red-900">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Role Legend */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Role Descriptions
                </h3>
                <dl className="space-y-3">
                    <div className="flex items-start">
                        <dt className="w-24">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                Owner
                            </span>
                        </dt>
                        <dd className="text-sm text-gray-600">
                            Full access to all features including organization management and
                            billing
                        </dd>
                    </div>
                    <div className="flex items-start">
                        <dt className="w-24">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Admin
                            </span>
                        </dt>
                        <dd className="text-sm text-gray-600">
                            Can manage users, inventory, and most settings except billing
                        </dd>
                    </div>
                    <div className="flex items-start">
                        <dt className="w-24">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Manager
                            </span>
                        </dt>
                        <dd className="text-sm text-gray-600">
                            Can manage inventory, create purchase orders, and view reports
                        </dd>
                    </div>
                    <div className="flex items-start">
                        <dt className="w-24">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Staff
                            </span>
                        </dt>
                        <dd className="text-sm text-gray-600">
                            Can create sales and view assigned warehouse inventory
                        </dd>
                    </div>
                    <div className="flex items-start">
                        <dt className="w-24">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Viewer
                            </span>
                        </dt>
                        <dd className="text-sm text-gray-600">
                            Read-only access to inventory and reports
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
