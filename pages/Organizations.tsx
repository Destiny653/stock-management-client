"use client";

import { useState } from "react";

type PlanType = "free" | "starter" | "professional" | "enterprise";
type StatusType = "active" | "suspended" | "cancelled" | "trial";

interface Organization {
    id: string;
    name: string;
    code: string;
    type: string;
    subscription: {
        plan: PlanType;
        status: StatusType;
        maxUsers: number;
        maxWarehouses: number;
    };
    contactInfo: {
        email: string;
        phone: string;
    };
    isActive: boolean;
    createdAt: string;
}

export default function Organizations() {
    const [organizations, setOrganizations] = useState<Organization[]>([
        {
            id: "1",
            name: "Acme Corporation",
            code: "ACME",
            type: "enterprise",
            subscription: {
                plan: "professional",
                status: "active",
                maxUsers: 50,
                maxWarehouses: 10,
            },
            contactInfo: {
                email: "contact@acme.com",
                phone: "+1-555-0100",
            },
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
        },
        {
            id: "2",
            name: "Tech Retail Store",
            code: "TECH-RET",
            type: "retail",
            subscription: {
                plan: "starter",
                status: "active",
                maxUsers: 10,
                maxWarehouses: 3,
            },
            contactInfo: {
                email: "info@techretail.com",
                phone: "+1-555-0200",
            },
            isActive: true,
            createdAt: "2024-02-15T00:00:00Z",
        },
    ]);

    const planBadgeColors = {
        free: "bg-gray-100 text-gray-800",
        starter: "bg-blue-100 text-blue-800",
        professional: "bg-purple-100 text-purple-800",
        enterprise: "bg-green-100 text-green-800",
    };

    const statusBadgeColors = {
        active: "bg-green-100 text-green-800",
        suspended: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800",
        trial: "bg-yellow-100 text-yellow-800",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage all organizations in the system
                    </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Add Organization
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">
                            {organizations.length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Total Organizations</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                            {organizations.filter((o) => o.subscription.status === "active").length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Active</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600">
                            {organizations.filter((o) => o.subscription.status === "trial").length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Trial</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">
                            {organizations.filter((o) => o.subscription.status === "suspended").length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Suspended</p>
                    </div>
                </div>
            </div>

            {/* Organizations Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Organization
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subscription
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Limits
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {organizations.map((org) => (
                            <tr key={org.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {org.name}
                                        </div>
                                        <div className="text-sm text-gray-500">{org.code}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                                        {org.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${planBadgeColors[org.subscription.plan]
                                            } capitalize`}
                                    >
                                        {org.subscription.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeColors[org.subscription.status]
                                            } capitalize`}
                                    >
                                        {org.subscription.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="space-y-1">
                                        <div>Users: {org.subscription.maxUsers}</div>
                                        <div>Warehouses: {org.subscription.maxWarehouses}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        <div>{org.contactInfo.email}</div>
                                        <div>{org.contactInfo.phone}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(org.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900">
                                            View
                                        </button>
                                        <button className="text-gray-600 hover:text-gray-900">
                                            Edit
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
