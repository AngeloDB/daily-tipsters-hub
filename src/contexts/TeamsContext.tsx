import React, { createContext, useContext, useState, useEffect } from "react";

interface Team {
    id: number;
    name: string;
    logo: string;
}

interface TeamsContextType {
    teams: Team[];
    isLoading: boolean;
    error: string | null;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch("/api/data/teams");
                if (!response.ok) {
                    throw new Error("Failed to fetch teams");
                }
                const data = await response.json();
                if (data.success) {
                    setTeams(data.teams);
                } else {
                    throw new Error(data.error || "Failed to load teams");
                }
            } catch (err: any) {
                console.error("Error fetching teams:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    return (
        <TeamsContext.Provider value={{ teams, isLoading, error }}>
            {children}
        </TeamsContext.Provider>
    );
}

export function useTeams() {
    const context = useContext(TeamsContext);
    if (context === undefined) {
        throw new Error("useTeams must be used within a TeamsProvider");
    }
    return context;
}
