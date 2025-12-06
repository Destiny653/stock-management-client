"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to manage entities (CRUD operations)
 * @param {string} entityType - Type of entity (e.g., 'products', 'suppliers')
 * @param {string} apiEndpoint - API endpoint for the entity
 */
export function useEntities(entityType: string, apiEndpoint: string) {
    const [entities, setEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch entities
    const fetchEntities = async (filters: Record<string, any> = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryString = new URLSearchParams(filters).toString();
            const url = queryString ? `${apiEndpoint}?${queryString}` : apiEndpoint;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${entityType}`);
            }

            const data = await response.json();
            setEntities(data);
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Get single entity by ID
    const getEntity = async (id: string | number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiEndpoint}/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${entityType} with id ${id}`);
            }

            const data = await response.json();
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Create entity
    const createEntity = async (entityData: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(entityData),
            });

            if (!response.ok) {
                throw new Error(`Failed to create ${entityType}`);
            }

            const data = await response.json();
            setEntities((prev) => [...prev, data]);
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Update entity
    const updateEntity = async (id: string | number, entityData: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiEndpoint}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(entityData),
            });

            if (!response.ok) {
                throw new Error(`Failed to update ${entityType}`);
            }

            const data = await response.json();
            setEntities((prev) =>
                prev.map((entity: any) => (entity.id === id ? data : entity))
            );
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Delete entity
    const deleteEntity = async (id: string | number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiEndpoint}/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`Failed to delete ${entityType}`);
            }

            setEntities((prev) => prev.filter((entity: any) => entity.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        entities,
        loading,
        error,
        fetchEntities,
        getEntity,
        createEntity,
        updateEntity,
        deleteEntity,
        setEntities,
    };
}
